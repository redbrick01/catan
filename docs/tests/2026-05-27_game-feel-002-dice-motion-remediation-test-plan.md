# FEEL-002 주사위 굴림 모션 수정 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/plans/2026-05-27_game-feel-002-dice-motion-remediation-plan.md`
- 변경 파일:
  - `script.js`
  - `styles.css`
  - `scripts/game-feel-dice-seed-static-test.js`

## 자동 테스트

```text
node --check script.js
node --check server.js
node scripts/game-feel-dice-seed-static-test.js
node scripts/game-feel-settings-static-test.js
node scripts/game-feel-turn-state-static-test.js
```

검증 내용:

- seeded dice helper가 존재한다.
- `renderDieCube()`가 `dice-motion-shell`을 렌더링한다.
- `animationSeed` 또는 `rollId`가 CSS custom properties로 연결된다.
- final face mapping은 `.dice-cube`에 남고, roll animation은 `.dice-motion-shell`에 적용된다.
- reduced-motion selector가 dice motion shell을 억제한다.
- 온라인 roll pending flag가 켜지고 해제되는 경로가 존재한다.

## 브라우저 확인

대상 URL:

```text
http://127.0.0.1:4173/?test=1
```

확인 항목:

- 오프라인 게임 시작 후 초기 배치를 완료하면 roll button이 활성화된다.
- 주사위 굴림 후 `die1`, `die2`, `diceTotal`, aria-label, fallback text가 일치한다.
- `#dieOne .dice-motion-shell`과 `#dieTwo .dice-motion-shell`이 존재한다.
- motion shell computed style에 `dice-seeded-roll` animation이 적용된다.
- motion shell에 `--dice-roll-x-start`, `--dice-roll-y-start`, `--dice-roll-duration` 값이 존재한다.
- `.dice-cube` final transform이 결과값에 맞게 적용된다.

## 온라인 확인

가능하면 2클라이언트 온라인 방에서 확인한다.

- roll command 전송 직후 최종 숫자를 선표시하지 않는다.
- command pending 동안 dice panel이 rolling 상태를 가진다.
- 서버 state 수신 후 `lastDice` 기준 final face와 settle animation이 표시된다.
- command error 또는 reconnect hydrate 후 과거 motion이 반복되지 않는다.

## 완료 기준

- 자동 테스트가 통과한다.
- 브라우저에서 seed-derived CSS 변수가 실제 DOM에 적용된다.
- final face와 숫자 표시가 일치한다.
- 온라인 authoritative result 원칙이 유지된다.
- 실행하지 못한 온라인/브라우저 항목은 최종 보고서에 이유와 함께 남긴다.
