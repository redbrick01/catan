# FEEL-002 주사위/자원 생산 피드백 계획
 

## 2026-05-27 구현 범위 업데이트

- `script.js`
  - pointer hold helpers for dice button input. 추가.
  - `makeDiceSeedMaterial()`, 3D die rendering, dice/production cue emission, and offline `lastProduction` recording. 추가.
  - Sent `clientHoldMs`, `clientEntropy`, and `clientStartedAt` with online roll commands.
  - production recipient bump classes without exposing opponent resource types beyond existing viewer-safe state. 추가.
- `server.js`
  - `makeRollAnimationSeed()`. 추가.
  - `lastDice.animationSeed` and `lastDice.rollId` while keeping server-authoritative dice results. 추가.
- `styles.css`
  - CSS 3D dice cube, settle animation, resource bump animation, and reduced-motion suppression. 추가.
- `scripts/game-feel-dice-seed-static-test.js`
  - static coverage for hold input, online payload, server seed fields, 3D dice CSS, and production cue wiring. 추가.

Implementation keeps final online dice results server authoritative. FEEL-002 does not add sound assets; sound channel results continue through FEEL-006A safe skips until FEEL-006B.
작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

주사위 결과, 생산 타일, 자원 수령 결과를 하나의 흐름으로 이해하게 한다.
추가로 CSS 3D 주사위 모션과 버튼 hold duration 기반 seed entropy를 도입해 주사위를 "굴린다"는 감각을 강화한다.

## 범위

- 오프라인 dice roll 모션
- 온라인 rolling pending 상태
- CSS 3D dice cube 2개
- 버튼 pointerdown/pointerup hold duration 측정
- hold duration 기반 animation seed
- 온라인 roll command에 client hold entropy 전달
- 서버 authoritative result와 animation seed 분리
- 서버 결과 이후 dice/result cue
- 생산 타일 강조
- 내 자원 종류별 cue
- 상대 generic card gain cue
- 도둑/은행 재고 부족 차단 cue

## private state 기준

- 생산 타일 강조는 공개 보드 정보이므로 허용한다.
- 상대 플레이어 카드에는 자원 종류별 cue를 표시하지 않는다.
- 상대 생산 사운드는 generic sound만 사용한다.
- 온라인 production cue는 서버의 기존 viewer별 production view 계약을 따른다.
- 내가 받은 생산에는 `resourceType`을 허용하지만, 상대가 받은 생산에는 `resourceType`을 제거하고 `cardDelta` 또는 generic gain만 사용한다.

## CSS 3D Dice 구현 기준

일반적인 CSS dice roller는 다음 구조를 사용한다.

```html
<div class="dice-scene">
  <div class="dice-cube">
    <div class="dice-face dice-face-1"></div>
    <div class="dice-face dice-face-2"></div>
    <div class="dice-face dice-face-3"></div>
    <div class="dice-face dice-face-4"></div>
    <div class="dice-face dice-face-5"></div>
    <div class="dice-face dice-face-6"></div>
  </div>
</div>
```

CSS 기준:

```text
dice-scene: perspective
dice-cube: transform-style: preserve-3d
dice-face: translateZ(size / 2)
final value: result face가 정면/상단에 오도록 rotateX/Y/Z 지정
roll motion: seed 기반 중간 회전 + 최종 transform
```

1차 구현은 별도 외부 라이브러리보다 기존 DOM/CSS 구조에 맞춘 lightweight CSS cube를 우선한다. 외부 `css-dice-roller`류 코드를 가져올 경우 라이선스와 번들 영향 검토가 필요하다.

## Hold-time Seed 기준

버튼 입력:

```text
pointerdown: pressStart = performance.now()
pointerup: holdMs = clamp(performance.now() - pressStart, 0, 3000)
pointercancel/blur: 안전하게 roll 취소 또는 기본 holdMs 적용
```

입력 정책:

- `rollButton`에서 발생한 pointer 이벤트는 dice panel drag를 시작하지 않는다.
- pointer 기반 굴림과 기존 click 기반 굴림이 동시에 실행되지 않도록 단일 진입점으로 수렴한다.
- 마우스/터치/펜 입력은 `pointerdown`과 `pointerup` 사이의 hold duration을 사용한다.
- 키보드 Space/Enter 입력은 hold duration이 없으므로 `clientHoldMs = 0` 또는 기본값을 사용하고, entropy는 crypto 기반 값으로 보강한다.
- `pointercancel`, 창 blur, 버튼 비활성화 발생 시에는 rolling pending을 해제하고 중복 명령을 보내지 않는다.

오프라인:

```text
seedMaterial = gameId + turnIndex + activePlayerIndex + holdMs + performance.now() + cryptoRandom
result = seedablePrng(seedMaterial)
animationSeed = seedMaterial + ":animation"
```

온라인:

```text
client -> server:
{
  name: "rollDice",
  clientHoldMs,
  clientEntropy,
  clientStartedAt
}
```

서버:

```text
serverSeedMaterial = roomId + revision + activeSeat + clientHoldMs + clientEntropy + crypto.randomBytes()
result = serverAuthoritativeRoll(serverSeedMaterial)
rollAnimationSeed = hash(serverSeedMaterial + ":animation")
```

서버가 최종 결과를 확정하고, 클라이언트는 서버 결과와 `rollAnimationSeed`를 기준으로 모션을 재생한다.

## 공정성/보안 기준

- hold duration은 촉각적 입력과 entropy 보강용이다.
- hold duration만으로 결과가 결정되면 안 된다.
- 온라인에서는 클라이언트가 보낸 값이 조작될 수 있다고 가정한다.
- 서버 entropy를 반드시 섞는다.
- 온라인에서 `clientHoldMs`와 `clientEntropy`는 서버 seed material에 섞을 수 있지만, 클라이언트가 결과를 단독 통제할 수 없어야 한다.
- 클라이언트는 온라인 결과를 선계산하거나 선표시하지 않고, 서버 state의 `lastDice`와 `animationSeed`만 신뢰한다.
- test mode에서만 명시적 total/seed 주입을 허용한다.

## 구현 후보

- `script.js`
  - `startDicePress()`
  - `finishDicePress()`
  - `makeDiceSeedMaterial()`
  - `rollSeededDie(seed)`
  - `animateCssDice(result, animationSeed)`
  - diceRolled cue
  - resourcesProduced cue
  - blockedProduction cue
- `server.js`
  - `handleRollDice()` payload 확장
  - server seed material 생성
  - 기존 `game.lastDice` 확장
  - `game.lastProduction` viewer-safe 계약 유지
- `styles.css`
  - `.dice-scene`
  - `.dice-cube`
  - `.dice-face`
  - `.dice-rolling`
  - `.dice-settled`
  - `motion-resource-bump`
  - `motion-card-gain`
  - `motion-alert`
  - tile production highlight class

## 상태 확장 기준

현재 코드의 온라인/오프라인 흐름은 `game.lastDice`를 기준으로 hydrate와 렌더링이 이루어진다. 따라서 1차 구현에서는 새 `lastRoll` 객체를 만들기보다 기존 `lastDice`를 확장한다.

권장 형태:

```js
lastDice = {
  die1: 3,
  die2: 4,
  total: 7,
  animationSeed: "server-or-local-animation-seed",
  rollId: "scope-revision-activeSeat-total"
}
```

온라인 서버 state:

- `lastDice.die1`, `lastDice.die2`, `lastDice.total`은 서버 authoritative result이다.
- `lastDice.animationSeed`는 모션 재현용이며 결과 검증의 근거로 사용하지 않는다.
- `lastDice.rollId` 또는 equivalent key는 dice cue dedupe에 사용한다.
- 기존 클라이언트가 추가 field를 몰라도 숫자 표시가 동작해야 한다.

오프라인 state:

- `rollDice()`는 기존 `{ die1, die2, total }`에 `animationSeed`와 `rollId`를 추가하는 방향으로 확장한다.
- 오프라인 결과는 local seedable PRNG를 사용할 수 있지만, 테스트 모드 외에는 `Math.random()` 직접 의존을 줄이고 crypto entropy를 섞는다.

## 온라인 rolling pending 기준

온라인은 명령 전송과 서버 state 반영 사이에 짧은 대기 구간이 있다. 이 구간은 결과가 확정된 것처럼 보이면 안 된다.

```text
roll button pointerup 또는 keyboard confirm
-> canRollOnlineDice() 통과
-> roll command 전송
-> dice panel: rolling pending 표시, button disabled
-> 숫자/total 선표시 금지
-> 서버 state 수신 후 lastDice 기준 settle animation
-> error 수신 시 pending 해제, 기존 lastDice 유지, 오류 안내
```

reconnect/hydrate:

- reconnect 직후 받은 snapshot에서는 과거 dice roll motion을 재생하지 않는다.
- 다만 `lastDice` 숫자와 생산 타일의 정적 상태는 복구한다.
- reconnect 이후 새 revision에서 발생한 dice cue만 모션/사운드 대상으로 삼는다.

## 생산 cue 기준

현재 보드에는 굴린 숫자 타일 강조가 존재하지만, "숫자가 나온 타일"과 "실제로 자원을 받은 대상"은 분리한다.

구분:

```text
rolledNumberTile: 주사위 합계와 숫자가 같은 공개 타일
blockedTile: rolledNumberTile 중 도둑이 있어 생산이 차단된 타일
producingTile: 실제로 하나 이상의 자원을 지급한 타일
resourceRecipient: 실제로 자원을 받은 플레이어/좌석
bankShortage: 은행 재고 부족으로 지급되지 않은 자원 종류
```

오프라인 `produce(total)`은 cue를 위해 지급 결과를 반환하도록 확장한다.

```js
{
  production: [
    { seatIndex, resourceType, amount, tileId }
  ],
  blockedProduction: [
    { tileId, reason: "robber" }
  ],
  bankShortage: [
    { resourceType, requested, available, affectedSeatIndexes }
  ]
}
```

온라인 cue는 서버가 내려주는 viewer-safe `lastProduction` 또는 equivalent view를 사용한다.

viewer별 cue payload:

```text
내 생산: seatIndex, resourceType, amount, tileId
상대 생산: seatIndex, cardDelta 또는 amount, tileId, resourceType 없음
도둑 차단: tileId, reason = robber
은행 부족: resourceType은 공개 가능한 경우에만 사용, 아니면 generic shortage
```

생산 타일 강조는 공개 보드 정보 기준으로 허용하되, 상대 플레이어 카드나 사운드에서 상대의 상세 자원 종류를 유추할 수 없어야 한다.

## 완료 기준

- 온라인 최종 주사위 숫자는 서버 state 이후 표시된다.
- CSS 3D 주사위가 최종 결과와 일치하는 face를 보여준다.
- 버튼 hold duration이 animation seed에 반영되어 같은 결과라도 모션 변주가 가능하다.
- 온라인 결과는 서버 authoritative이다.
- 내 생산과 상대 생산 cue가 구분된다.
- 상대 자원 종류가 cue/sound로 노출되지 않는다.
- 도둑 차단과 은행 부족이 성공 생산과 다르게 보인다.
- roll button hold가 dice panel drag와 충돌하지 않는다.
- 키보드 Space/Enter로도 주사위를 굴릴 수 있다.
- 온라인 오류 또는 reconnect 직후 과거 굴림 모션이 재생되지 않는다.
- `die1`, `die2`, `total`, 3D face, 텍스트 fallback, aria-label이 같은 결과를 가리킨다.

## 테스트 초안

- 온라인 dice command 직후에는 pending, state 이후 결과 표시.
- 짧은 hold와 긴 hold에서 animation seed가 다름.
- 같은 result/animationSeed는 같은 final face를 보여줌.
- 온라인 clientHoldMs 조작이 서버 권위 검증을 우회하지 않음.
- 내 생산 cue에는 resourceType 허용.
- 상대 생산 cue에는 resourceType 미포함.
- 같은 production revision 재수신 시 중복 없음.
- rollButton pointerdown이 dicePanel drag를 시작하지 않음.
- pointerup과 click이 같은 굴림을 중복 실행하지 않음.
- keyboard Space/Enter 굴림에서 holdMs fallback이 적용됨.
- pointercancel/blur에서 pending 상태가 남지 않음.
- 온라인 roll error 수신 시 기존 dice 숫자가 유지되고 rolling pending이 해제됨.
- reconnect hydrate snapshot에서는 dice motion/sound가 재생되지 않음.
- `die1`, `die2`, `total`, final face, aria-label이 일치함.
- rolledNumberTile, blockedTile, producingTile, resourceRecipient cue가 구분됨.

## 세부 구현 단계

### 1. DOM 구조 추가

기존 `dieOne`, `dieTwo` 텍스트 표시를 보존하면서 3D dice DOM을 추가한다.

```text
dicePanel
  diceReadout
    diceScene die-one
    diceScene die-two
    diceTotal
```

텍스트 숫자는 접근성과 reduced-motion fallback으로 유지한다.

### 2. CSS face mapping

각 결과값이 어느 final transform에 해당하는지 표로 고정한다.

```text
1 -> rotateX(0deg) rotateY(0deg)
2 -> rotateY(-90deg)
3 -> rotateX(90deg)
4 -> rotateX(-90deg)
5 -> rotateY(90deg)
6 -> rotateY(180deg)
```

실제 face 배치에 따라 구현 중 조정하되, 테스트 fixture에 mapping을 기록한다.

### 3. Seeded PRNG

1차는 작은 deterministic PRNG helper를 둔다.

```text
hashStringToUint32(seed)
mulberry32(seedInt)
seededRange(seed, min, max)
```

`Math.random()`은 animation seed 재현이 필요한 부분에 직접 사용하지 않는다.

### 4. 온라인 프로토콜 확장

`rollDice` command는 기존 testTotal을 유지하되 아래 optional field를 추가한다.

```text
clientHoldMs?: number
clientEntropy?: string
clientStartedAt?: number
```

서버 state에는 아래 중 하나를 추가한다.

```text
lastDice.animationSeed
lastDice.rollId
lastDice.dice 또는 기존 die1/die2 유지
```

기존 클라이언트가 field를 몰라도 동작해야 한다.

### 5. 입력 이벤트 정리

현재 dice panel은 드래그 가능한 UI이므로 roll button의 pointer 이벤트가 panel drag와 충돌하지 않게 한다.

구현 기준:

- `rollButton`의 `pointerdown`에서 hold 측정을 시작한다.
- `rollButton` 이벤트는 dice panel drag handler가 drag 시작으로 해석하지 않도록 stop 또는 guard 조건을 둔다.
- `pointerup`에서 단일 `commitDiceRoll({ holdMs, inputType })`로 진입한다.
- `click`은 pointer flow가 없는 환경 또는 keyboard fallback만 담당한다.
- 버튼 disabled 상태, pending action, 이미 굴림 완료 상태에서는 hold 측정과 rolling pending을 시작하지 않는다.

### 6. cue dedupe key

dice cue는 FEEL-000 key 규칙을 사용하되, 주사위 전용 detail을 고정한다.

```text
scopeId + revision + diceRolled + activeSeat + die1 + die2
scopeId + revision + resourcesProduced + seatIndex + resourceType/generic
scopeId + revision + blockedProduction + tileId + reason
scopeId + revision + bankShortage + resourceType/generic
```

`animationSeed`만 다른데 같은 서버 revision/result인 경우에는 같은 dice roll로 본다. 같은 state 재수신으로 모션/사운드가 반복되면 안 된다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| CSS 3D face와 결과 불일치 | mapping 정적 테스트와 수동 스크린샷 |
| 온라인 결과 선표시 | pending에는 숫자 표시 금지, 서버 state 이후 settle |
| hold 조작으로 결과 예측 | 서버 crypto entropy 필수 |
| reduced-motion에서 정보 손실 | 텍스트 die와 total 즉시 표시 |
| 모바일 성능 저하 | transform/opacity만 사용, 900ms 이하 제한 |
| rollButton hold와 dicePanel drag 충돌 | button 이벤트 guard와 drag 시작 조건 분리 |
| pointerup/click 중복 굴림 | `commitDiceRoll()` 단일 진입점과 중복 lock |
| 키보드 사용자가 굴릴 수 없음 | Space/Enter fallback과 기본 holdMs |
| 오프라인 생산 cue 정보 부족 | `produce(total)`이 지급/차단/부족 결과 반환 |
| reconnect 후 과거 효과 재생 | hydrate snapshot cue suppression |

## 단계 완료 게이트

- 3D dice final face가 결과와 일치한다.
- 오프라인/온라인 모두 기존 roll flow가 깨지지 않는다.
- server authoritative roll 원칙이 유지된다.
- 생산 cue가 private state를 깨지 않는다.
- hold 입력, click fallback, keyboard fallback이 모두 단일 굴림으로 처리된다.
- 온라인 rolling pending, error, reconnect 상태에서 잘못된 결과 선표시나 과거 모션 재생이 없다.
- 생산 타일 강조와 실제 자원 수령 cue가 구분된다.
