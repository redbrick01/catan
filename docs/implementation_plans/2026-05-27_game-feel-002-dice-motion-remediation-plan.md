# FEEL-002 주사위 굴림 모션 수정 계획

작성일: 2026-05-27

## 배경

FEEL-002 최종 보고서는 CSS 3D 주사위, hold-time input entropy, 서버 animation seed, 생산 cue 연결이 구현되었다고 기록했다. 다만 미실행 항목으로 주사위 면 시각 검증, 모바일 레이아웃 QA, 온라인 2클라이언트 굴림 스모크가 남아 있었다.

이후 구현 상태를 계획과 비교한 결과, 3D 주사위 표시와 값별 final face 매핑은 존재하지만 원래 계획의 핵심인 "seed 기반 굴림 모션 변주"는 아직 완성되지 않았다.

## 현재 판정

- 적용됨
  - `die1`, `die2`, `total` 표시
  - CSS 3D cube DOM 렌더링
  - 값별 final transform 매핑
  - `clientHoldMs`, `clientEntropy`, `clientStartedAt` 온라인 전송
  - 서버 `lastDice.animationSeed`, `lastDice.rollId`
  - reduced-motion suppression
- 미흡함
  - `animationSeed`가 실제 회전 경로나 CSS 변수에 반영되지 않는다.
  - `.dice-settled`의 `dice-settle` 애니메이션이 모든 굴림에 같은 고정 모션을 적용한다.
  - `.dice-rolling` 또는 온라인 rolling pending 상태가 시각적으로 분리되어 있지 않다.
  - `rollKey`는 DOM 재렌더 키로만 쓰이고 모션 변주에는 쓰이지 않는다.
  - 정적 테스트가 문자열 존재 여부 중심이라 실제 seed 기반 모션을 검증하지 못한다.

## 수정 목표

주사위 결과는 기존처럼 서버 또는 로컬 게임 로직이 결정하되, 표시 모션은 `animationSeed`와 `rollId`를 사용해 재현 가능한 회전 경로를 갖게 한다. 같은 결과라도 hold duration과 서버 seed가 다르면 서로 다른 굴림처럼 보여야 한다.

## 구현 범위

- `script.js`
  - `animationSeed` 기반 dice motion parameter 생성 helper 추가
  - `renderDieCube()`가 seed-derived CSS custom properties를 DOM에 주입
  - 온라인 명령 전송 후 결과 수신 전 rolling pending class 적용
  - pointer/click 중복 실행 방지 확인 및 필요 시 `commitDiceRoll()` 단일 진입점으로 정리
  - test helper에 deterministic dice render 검증용 entry 추가
- `styles.css`
  - `.dice-rolling` 상태 추가
  - seed-derived CSS 변수 기반 roll keyframes 적용
  - final face transform과 roll animation이 충돌하지 않도록 wrapper/cube 역할 분리
  - reduced-motion에서는 rolling/settle animation 제거, 숫자와 final face는 즉시 표시
- `scripts/game-feel-dice-seed-static-test.js`
  - seed 값이 CSS 변수 또는 motion parameter로 연결되는지 검증
  - `rollKey`가 단순 render key에만 머물지 않는지 검증
- 신규 브라우저/스모크 테스트 후보
  - 오프라인 forced roll에서 face와 total 일치 확인
  - 서로 다른 seed가 서로 다른 CSS motion parameter를 만드는지 확인
  - reduced-motion에서 animation이 꺼지고 숫자는 유지되는지 확인

## 설계 기준

### 1. 결과 transform과 굴림 transform 분리

현재 `.dice-cube` 하나가 final face transform과 `dice-settle` animation transform을 모두 담당한다. 이 구조에서는 keyframes가 transform을 덮어 final face와 roll path가 충돌할 수 있다.

수정 후 구조는 아래처럼 역할을 나눈다.

```text
die-face
  dice-motion-shell  -> seed 기반 굴림/settle animation
    dice-cube        -> final face transform
      dice-side-1..6
```

`dice-cube`는 결과 face만 담당하고, `dice-motion-shell`이 흔들림, 회전, scale, settle을 담당한다.

### 2. seed-derived CSS custom properties

`animationSeed` 또는 fallback `rollId`를 hash하여 아래 값을 만든다.

```text
--dice-roll-x-start
--dice-roll-y-start
--dice-roll-z-start
--dice-roll-x-mid
--dice-roll-y-mid
--dice-roll-pop
--dice-roll-duration
```

범위 예시:

```text
x/y start: 360deg ~ 1080deg
z start: -180deg ~ 180deg
mid overshoot: -28deg ~ 28deg
pop scale: 1.03 ~ 1.10
duration: 520ms ~ 820ms
```

모션 parameter는 deterministic이어야 한다. 같은 `die value + animationSeed + rollId` 조합은 같은 CSS 값을 만든다.

### 3. 상태 class

권장 상태:

```text
dice-panel.dice-rolling
dice-panel.dice-settled
die-face[data-value="1".."6"]
```

오프라인은 결과가 즉시 있으므로 짧은 `dice-rolling` 후 `dice-settled`로 넘어가도 된다. 온라인은 명령 전송 직후 `dice-rolling`을 켜되 숫자 선표시는 하지 않고, 서버 state의 `lastDice` 수신 이후 final face를 표시한다.

### 4. 접근성과 reduced motion

- `aria-label`, fallback text, `diceTotal`은 기존 계약을 유지한다.
- `html[data-effective-motion="reduced"]` 또는 `prefers-reduced-motion: reduce`에서는 roll/settle animation을 제거한다.
- reduced-motion에서도 `die1`, `die2`, `total`, final face는 즉시 일치해야 한다.

## 구현 단계

1. `renderDieCube()` DOM 구조를 `dice-motion-shell > dice-cube`로 바꾼다.
2. `makeDiceMotionStyle(value, rollKey)` helper를 추가한다.
3. helper에서 seed hash 기반 CSS custom properties를 생성한다.
4. `.dice-cube` final transform은 기존 mapping을 유지한다.
5. `.dice-motion-shell`에 roll/settle keyframes를 적용한다.
6. 온라인 roll command 전송 중 `dice-rolling` pending 상태를 표시하고, 오류 시 해제한다.
7. 같은 state 재수신 시 애니메이션이 반복되지 않도록 기존 `data-render-key` dedupe를 유지한다.
8. 정적 테스트를 seed-to-style 연결 검증으로 강화한다.
9. 브라우저에서 forced roll 1~6 face, total, animation style, reduced-motion을 확인한다.

## 완료 기준

- `animationSeed` 또는 `rollId`가 실제 CSS motion parameter에 반영된다.
- 같은 결과라도 다른 seed면 roll motion parameter가 달라진다.
- 같은 결과와 같은 seed면 roll motion parameter가 재현된다.
- 최종 3D face가 `die1`, `die2`, `diceTotal`과 일치한다.
- 온라인에서는 서버 state 수신 전 최종 숫자를 선표시하지 않는다.
- 오류나 reconnect hydrate로 과거 굴림 모션이 재생되지 않는다.
- reduced-motion에서 모션은 꺼지지만 숫자 정보는 손실되지 않는다.
- 기존 생산 tile highlight와 resource bump가 깨지지 않는다.

## 테스트 계획

자동:

```text
node --check script.js
node --check server.js
node scripts/game-feel-dice-seed-static-test.js
node scripts/game-feel-settings-static-test.js
node scripts/game-feel-turn-state-static-test.js
```

브라우저:

- `?test=1`에서 forced roll 1~6을 각각 렌더링하고 face/aria/total 일치 확인
- 서로 다른 seed 두 개로 같은 결과를 렌더링하여 CSS 변수 차이 확인
- 같은 seed로 같은 결과를 재렌더링하여 CSS 변수 동일성 확인
- reduced-motion 설정 후 animation name/duration이 억제되는지 확인
- 온라인 roll command 중 pending 상태와 서버 결과 settle 상태 확인

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| keyframes transform이 final face transform을 덮음 | shell/cube wrapper로 transform 책임 분리 |
| seed 모션 때문에 결과 face가 틀어짐 | final face는 `.dice-cube[data-value]` mapping만 담당 |
| 애니메이션이 state 재수신마다 반복됨 | `data-render-key`와 FEEL cue dedupe 유지 |
| reduced-motion에서 정보 손실 | fallback text와 final face 즉시 표시 |
| 테스트가 다시 문자열 존재 검사에 머묾 | CSS 변수 값 비교와 browser computed style 검증 추가 |

## 비범위

- 주사위 물리 엔진 도입
- 사운드 에셋 추가
- 자원 카드가 타일에서 손패로 날아가는 chip flight
- 서버 주사위 결과 결정 방식 변경
