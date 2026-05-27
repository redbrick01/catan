# FEEL-001 턴/내 차례 피드백 계획
 

## 2026-05-27 구현 범위 업데이트

- `script.js`
  - `makeTurnFeedbackCue()` and `pulseTurnFeedback()`. 추가.
  - Connected current focus/pending actor state to FEEL-000 `turnChanged` and `pendingStarted` cues.
  - one-shot `motion-turn-pulse` targeting the focused seat, player row, current player label, and dice panel. 추가.
  - stable `data-player-id` on player rows for motion targeting. 추가.
- `styles.css`
  - `motion-turn-pulse` animation and reduced-motion suppression. 추가.
- `scripts/game-feel-turn-state-static-test.js`
  - static coverage for turn/pending cue wiring, state classes, and reduced-motion pulse suppression. 추가.

The existing current turn, pending actor, and bot-turn state classes are preserved and reused. FEEL-001 does not add dice, production, action-result, or robber-specific effects.
작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

현재 진행자와 내 차례 도착을 즉시 알아볼 수 있게 한다.

## 범위

- 현재 진행 플레이어 카드 강조
- 내 차례 1회성 pulse
- pending actor 우선 강조
- 봇 진행 중 cue
- reduced-motion 대응

## 구현 후보

- `script.js`
  - current focus player 계산 결과와 cue 연결
  - turnChanged cue emit
  - pending actor cue emit
- `styles.css`
  - `motion-turn-pulse`
  - `is-current-turn`
  - `is-my-turn`
  - `is-action-required`
  - `is-pending-actor`
  - `is-bot-turn`

## 문구 기준

- 온라인 내 차례: `내 차례입니다`
- 온라인 pending actor: `내가 행동할 차례입니다`
- 온라인 상대 차례: `현재 진행: 플레이어명`
- 온라인 다중 pending: `여러 플레이어가 행동해야 합니다`
- 온라인 봇 pending: `봇 이름이 행동을 처리 중입니다`
- 오프라인: `플레이어명 차례입니다`

## 완료 기준

- 턴 변경 시 현재 진행 플레이어가 3초 안에 식별된다.
- 내 차례 pulse는 1회만 재생된다.
- pending actor가 active player보다 우선 강조된다.
- reduced-motion에서는 정적 강조만 남는다.

## 테스트 초안

- 온라인 내 턴/상대 턴/봇 턴 상태별 class 확인.
- 오프라인 문구가 `내 차례`가 아닌 플레이어명 기준인지 확인.
- 같은 revision 재수신 시 pulse 중복 없음.
- 다중 pendingActors 상태에서 내 행동 필요 여부와 다른 actor 강조가 함께 보이는지 확인.
- 화면 진입 후 3초 안에 진행자와 내 행동 여부를 말할 수 있는지 확인.

## 세부 상태 매트릭스

| 상태 | 상단 문구 | 플레이어 카드 | 모션 | 사운드 |
| --- | --- | --- | --- | --- |
| 온라인 내 턴 | 내 차례입니다 | 내 카드 `is-my-turn` | 1회 pulse | 설정 켜짐 시 선택 |
| 온라인 상대 턴 | 현재 진행: 이름 | 상대 카드 `is-current-turn` | 약한 border transition | 없음 |
| 온라인 내가 pending actor | 내가 행동할 차례입니다 | 내 카드 `is-action-required is-pending-actor` | 강한 highlight | cue emit만 |
| 온라인 상대 pending actor | 이름님이 행동 중입니다 | 상대 카드 `is-pending-actor` | 약한 highlight | 없음 |
| 온라인 다중 pendingActors에 내가 포함 | 내가 행동할 차례입니다 | 내 카드 `is-action-required`, 다른 actor `is-pending-actor` | 내 카드 강한 highlight | cue emit만 |
| 온라인 다중 pendingActors에 내가 미포함 | 여러 플레이어가 행동해야 합니다 | actor 카드들 `is-pending-actor` | 약한 highlight | 없음 |
| 봇 턴 | 봇 이름 진행 중 | 봇 카드 `is-bot-turn` | reduced-motion 대응 shimmer | 없음 또는 generic |
| 봇 pending actor | 봇 이름이 행동을 처리 중입니다 | 봇 카드 `is-bot-turn is-pending-actor` | reduced-motion 대응 shimmer 또는 정적 badge | 없음 |
| 오프라인 | 이름 차례입니다 | 해당 카드 `is-current-turn` | active transition | 없음 |

사운드는 이 단계에서 cue를 emit할 수 있지만, 실제 재생 연결은 FEEL-006B에서 처리한다.

## currentFocusPlayer 계산 기준

우선순위:

```text
blocking connection/room ended
> pendingActors 또는 actingPlayer
> activePlayer
> none
```

반환 후보:

```js
{
  focusType: "blocked" | "pending" | "turn" | "none",
  activeSeatIndex,
  actingSeatIndex,
  pendingActorSeatIndexes: [],
  viewerMustAct: false,
  viewerIsActive: false,
  isBotFocus: false
}
```

`pendingActorSeatIndexes`가 여러 명이면 카드 강조는 여러 명에게 적용하되, 상단 문구는 viewer가 포함되는지 여부에 따라 나눈다.

## 구현 순서

1. current focus player 계산 결과를 FEEL-000 cue helper와 연결.
2. `renderPlayers()`와 `renderSeats()`에서 상태 class 부여.
3. `currentPlayerLabel` 또는 상단 영역에 상태 badge 추가.
4. 내 차례 전환 시 `turnChanged` cue emit.
5. pending actor 전환 시 `pendingStarted` 또는 `pendingActorChanged` cue emit.
6. reduced-motion일 때 pulse/shimmer 제거.

좌석 카드와 플레이어 리스트 모두 상태 class를 받는다. 다만 메인 시각 강조와 모바일 우선순위는 좌석 카드 기준으로 한다.

## DOM/CSS 기준

권장 class:

```text
is-current-turn
is-my-turn
is-action-required
is-waiting-turn
is-bot-turn
is-pending-actor
motion-turn-pulse
```

상태 class는 지속 상태, `motion-*` class는 1회성 효과로 사용한다. 1회성 class는 animation 종료 후 제거한다.

### 상태 class 우선순위

시각 우선순위:

```text
is-action-required
> is-pending-actor
> is-my-turn
> is-current-turn
> is-bot-turn
> is-waiting-turn
```

`is-my-turn`과 `is-action-required`는 동시에 붙을 수 있다. 이 경우 `is-action-required`를 더 강하게 표시한다.

### reduced-motion 대체 cue

모션 감소 상태에서는 animation을 제거하고 아래 정적 cue를 유지한다.

- border 두께 또는 outline
- 배경 tint
- `내 차례`, `행동 필요`, `진행 중` 텍스트 badge
- 현재 진행자 이름 표시

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| active player와 pending actor 혼동 | currentFocusPlayer 우선순위 사용 |
| 오프라인에서 "내 차례" 오해 | 오프라인은 항상 플레이어명 기준 문구 |
| pulse 반복 | FEEL-000 cue key에 `scopeId + revision + turnChanged + activeSeat + round/turnIndex` 사용 |
| 모바일에서 상단 상태가 안 보임 | UX-005와 연동해 모바일 current status block 고정 검토 |
| 다중 pending actor 표시 혼란 | viewer 포함 여부를 기준으로 상단 문구 분리 |
| 봇 턴과 봇 pending 혼동 | `is-bot-turn`과 `is-pending-actor`를 함께 부여하고 문구 분리 |

## 단계 완료 게이트

- 화면 진입 후 3초 안에 현재 진행자를 말할 수 있다.
- 온라인/오프라인 문구가 분리된다.
- 같은 revision 재수신으로 pulse가 반복되지 않는다.
- 다중 pendingActors에서 viewer가 행동해야 하는지 명확하다.
- 봇 턴과 봇 pending actor 상태가 구분된다.
- reduced-motion에서도 정적 badge와 outline으로 상태를 알 수 있다.
