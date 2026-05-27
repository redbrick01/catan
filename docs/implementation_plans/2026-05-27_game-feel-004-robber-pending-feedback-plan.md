# FEEL-004 도둑/7/Pending 피드백 계획

작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

7, 도둑 이동, 자원 버리기, 약탈 대상 선택이 일반 턴과 확실히 구분되게 한다.

## 범위

- 7 발생 alert cue
- discard pending started cue
- robber move pending started cue
- 도둑 이동 가능 타일 강조
- 현재 도둑 위치 구분
- 도둑 이동 완료 cue
- discard 선택량 progress
- 약탈 대상 hover/focus/선택 cue
- actor/victim/제3자별 약탈 결과 cue

## private state 기준

- actor/victim만 실제 약탈 자원 cue를 본다.
- 제3자는 generic robbery happened cue만 본다.
- 사운드도 같은 기준을 따른다.
- victim picker는 대상별 보유 자원 수만 보여주고, 자원 종류는 보여주지 않는다.
- discardForSeven에서 다른 플레이어가 어떤 자원을 버렸는지 cue/log/sound로 노출하지 않는다.

## Pending 상태 전환 흐름

7과 도둑은 하나의 흐름이지만, cue는 상태 전환 단위로 분리한다.

```text
dice total 7
-> sevenRolled alert
-> discard 대상 있음?
   -> 있음: discardForSeven pending
      -> 모든 discarder 완료
      -> moveRobber pending
   -> 없음: moveRobber pending
-> actor가 robber tile 선택
-> victim 후보 수 확인
   -> 0명: robberResult(reason = NO_VICTIM)
   -> 1명: 자동 약탈 후 robberResult
   -> 2명 이상: chooseRobberVictim pending
      -> actor가 victim 선택
      -> robberResult
```

각 단계는 별도 eventType을 사용한다.

```text
sevenRolled
discardPendingStarted
discardSubmitted
robberMovePendingStarted
robberMoved
robberVictimPendingStarted
robberResult
```

`sevenRolled`는 주사위 결과에 대한 짧은 alert이고, `discardPendingStarted`와 `robberMovePendingStarted`는 실제로 사용자의 행동을 기다리는 pending 상태 cue이다.

## pendingActionView role matrix

서버는 viewer 기준으로 pending view를 내려준다. 1차 구현은 이 계약을 유지한다.

| pending type | viewer role | viewer에게 보이는 정보 | cue 기준 |
| --- | --- | --- | --- |
| `discardForSeven` | `discarder` | `needed`, `remainingCount`, 본인 보유 자원 | `is-action-required`, discard modal, progress |
| `discardForSeven` | `waiting` | `remainingCount` | waiting badge, 모션/사운드 최소화 |
| `moveRobber` | `actor` | `actorSeatIndex`, `fromTileId` | target tile highlight, action-required |
| `moveRobber` | `waiting` | `actorSeatIndex`, `fromTileId` | actor 진행 중 표시 |
| `chooseRobberVictim` | `actor` | `tileId`, victim `seatIndex/name/resourceCount` | victim picker focus/selected cue |
| `chooseRobberVictim` | `waiting` | `tileId`, actor 정보 | actor 진행 중 표시 |

FEEL-001의 current focus 계산과 연결한다.

```text
discardForSeven: !discarded discards seat들이 pendingActors
moveRobber: actorSeatIndex 1명
chooseRobberVictim: actorSeatIndex 1명
robberResult: pending actor 없음, 결과 cue만 표시
```

다중 discarder가 있을 때:

- viewer가 discarder이면 상단 문구는 `내가 행동할 차례입니다`.
- viewer가 discarder가 아니면 상단 문구는 `여러 플레이어가 행동해야 합니다` 또는 `카드 버리기 대기 중입니다`.
- discarder 좌석 카드는 `is-pending-actor`, viewer 본인은 `is-action-required`를 받는다.

## 온라인/오프라인 cue 기준

오프라인:

- `roll()`에서 7이 나온 직후 `sevenRolled` cue를 만든다.
- `startDiscardForSeven()`이 discard 대상을 만들면 `discardPendingStarted` cue를 만든다.
- discard 대상이 없으면 `robberMovePendingStarted`로 바로 이어진다.
- `moveRobber(tileId)` 성공 직후 `robberMoved` cue를 만든다.
- victim 0/1/2+ 분기에 따라 `robberResult` 또는 `robberVictimPendingStarted` cue를 만든다.

온라인:

- command 전송 직후 success cue를 만들지 않는다.
- `previousState -> nextState`에서 pendingActionView type/source/createdAt 또는 robberTile/lastRobberResult 변화를 감지해 cue를 만든다.
- reconnect hydrate snapshot에서는 모션/사운드 cue를 만들지 않고, 현재 pending modal과 정적 상태만 복구한다.
- 같은 `lastRobberResult.id`는 viewer별로 1회만 보여준다.

## eventType 및 dedupe key 기준

FEEL-000 key 규칙을 사용하되, 도둑/pending 전용 detail을 고정한다.

```text
sevenRolled: scopeId + revision + activeSeat + diceTotal
discardPendingStarted: scopeId + revision + pendingId/source + remainingCount
discardSubmitted: scopeId + revision + seatIndex + pendingId
robberMovePendingStarted: scopeId + revision + actorSeatIndex + fromTileId
robberMoved: scopeId + revision + actorSeatIndex + fromTileId + toTileId
robberVictimPendingStarted: scopeId + revision + actorSeatIndex + tileId
robberResult: scopeId + viewerId + result.id
```

`pendingId`는 서버의 `pendingAction.createdAt`, type, source, actorSeatIndex를 조합한다. 같은 revision 재수신, 모달 재렌더, reconnect snapshot으로 같은 cue가 반복되면 안 된다.

## robberResult payload schema

| viewerRole | 허용 payload | 금지 payload |
| --- | --- | --- |
| actor | `actorSeatIndex`, `victimSeatIndex`, `resource`, `reason`, `result.id` | 없음 |
| victim | `actorSeatIndex`, `victimSeatIndex`, `resource`, `reason`, `result.id` | 없음 |
| observer | `actorSeatIndex`, `victimSeatIndex`, `resource: null`, `reason`, `result.id` | 실제 resource type |

표시 문구:

```text
actor/victim: 플레이어A가 플레이어B에게서 목재 1장을 가져왔습니다.
observer: 플레이어A가 플레이어B에게서 자원 1장을 가져왔습니다.
NO_VICTIM: 도둑이 이동했지만 빼앗을 수 있는 자원이 없습니다.
```

사운드도 같은 분기를 따른다. observer에게 자원 종류별 사운드를 재생하지 않는다.

## 구현 후보

- `script.js`
  - pending action role/pendingActors helper
  - sevenRolled cue
  - pendingStarted cue
  - discardSubmitted cue
  - robberMoved cue
  - robberResult cue
  - discard progress update
  - victim picker focus/keyboard cue
- `styles.css`
  - `motion-alert`
  - `motion-robber-move`
  - robber target highlight class
  - `is-robber-target`
  - `is-robber-current`
  - `is-discard-progress-complete`

## 완료 기준

- 7/pending 상태가 일반 턴과 명확히 다르다.
- 도둑 이동 가능/불가능 타일이 reduced-motion에서도 구분된다.
- private state 정책을 cue가 깨지 않는다.
- 다중 discarder에서 내가 행동해야 하는지 즉시 알 수 있다.
- victim 후보 0/1/2+명 분기가 서로 다른 흐름으로 보인다.
- reconnect 후 pending modal은 복구되지만 과거 alert/motion/sound는 재생되지 않는다.

## 테스트 초안

- actor/victim/제3자 robberResult cue payload 비교.
- pending state 복구 시 과거 alert 재생 없음.
- discard progress가 선택량과 일치.
- `discardForSeven`에서 viewer가 discarder일 때 `is-action-required`와 modal이 표시됨.
- `discardForSeven`에서 viewer가 waiting일 때 remainingCount만 표시되고 타인의 discard 자원은 노출되지 않음.
- 다중 discarder 중 일부 완료 시 remainingCount와 pendingActors가 갱신됨.
- discard 대상 0명인 7에서 바로 `moveRobber` pending으로 전환됨.
- victim 후보 0명일 때 `NO_VICTIM` result가 표시됨.
- victim 후보 1명일 때 선택 모달 없이 자동 robberResult가 표시됨.
- victim 후보 2명 이상일 때 actor에게만 victim picker가 표시됨.
- victim picker는 keyboard focus와 Enter/Space 선택이 가능함.
- observer robberResult payload에는 `resource`가 null임.
- 같은 `lastRobberResult.id` 재수신 시 모달/cue가 반복되지 않음.
- 온라인 `moveRobber` command 직후가 아니라 state delta 이후 `robberMoved` cue가 재생됨.
- reduced-motion에서 target tile이 outline/label로 구분됨.

## Pending 유형별 계획

| pending 유형 | actor | 시각 cue | 사운드 | 비고 |
| --- | --- | --- | --- | --- |
| discardForSeven | 여러 명 | progress, selected count | 내 actor만 선택 | 남은 인원 표시 |
| moveRobber | active player | target tile highlight | actor만 선택 | 현재 도둑 위치 구분 |
| chooseRobberVictim | active player | victim card focus | actor만 선택 | 자원 0명 disabled |
| robberResult | actor/victim/제3자 | viewer별 result cue | viewer별 | private 분기 |

세부 기준:

- `discardForSeven`의 actor는 active player가 아니라 discard가 필요한 모든 seat이다.
- `moveRobber`와 `chooseRobberVictim`의 actor는 `pendingAction.actorSeatIndex`이다.
- 봇이 actor인 경우 FEEL-001의 `is-bot-turn is-pending-actor` 기준을 따른다.
- `robberResult`는 pending 상태가 아니라 결과 이벤트이다.

## target tile 조건

도둑 이동 가능 타일 강조 조건은 오프라인/온라인을 분리한다.

```text
오프라인: selectedAction === "robber" && tile.id !== robberTile
온라인: pendingActionView.type === "moveRobber" && role === "actor" && tile.id !== robberTile
```

현재 도둑 위치는 항상 별도 class로 구분한다.

```text
is-robber-current
is-robber-target
is-robber-disabled-target
```

타일 강조는 polygon/texture의 visual class로만 처리하고, click/pointer hit area를 가리거나 이동시키지 않는다.

## victim picker 접근성 기준

- victim card는 `button`으로 유지한다.
- hover와 focus가 같은 수준의 시각 강조를 가진다.
- Enter/Space로 선택 가능해야 한다.
- request in flight 상태에서는 모든 victim button을 disabled하고 상태 문구를 표시한다.
- victim card에는 `name`, `resourceCount`, generic 설명만 표시한다.
- victim card에는 실제 resource type, 추정 가능한 자원 아이콘, 손패 상세를 넣지 않는다.

## 구현 순서

1. pending action view에서 actor/pendingActors 추출 helper 확인.
2. discard progress UI에 motion token 적용.
3. robber target tile highlight class 정리.
4. robber moved cue dedupe 적용.
5. victim picker focus/selected cue 적용.
6. robberResult cue를 viewerRole별로 sanitize.

세부 순서:

1. `pendingActionView`를 FEEL-001 current focus helper와 연결한다.
2. `discardForSeven` role matrix와 remainingCount 표시를 정리한다.
3. `sevenRolled`, `discardPendingStarted`, `robberMovePendingStarted` eventType을 분리한다.
4. 오프라인 target tile 조건과 온라인 target tile 조건을 공통 helper로 묶는다.
5. 현재 도둑 위치와 이동 가능 타일 class를 분리한다.
6. victim 후보 0/1/2+명 분기별 cue를 연결한다.
7. `lastRobberResult.id` 기준 viewer별 dedupe를 FEEL-000 key와 연결한다.
8. reconnect hydrate snapshot에서 static restore만 수행하는지 확인한다.

## reduced-motion 기준

- 도둑 이동 애니메이션 대신 새 위치 정적 강조.
- target tile highlight는 색상과 라벨/outline으로 유지.
- alert는 pulse 대신 정적 badge로 대체.
- discard progress는 width animation 대신 즉시 width/텍스트 변경으로 대체.
- victim picker focus는 scale 대신 outline/background로 대체.
- robberResult는 모션 없이 viewer별 문구와 badge로 표시.

## reconnect/static restore 기준

reconnect 또는 새로고침 복구 snapshot에서는 현재 상태를 복구하되 과거 효과를 재생하지 않는다.

허용:

- 현재 pending modal 복구
- waiting modal 복구
- discard progress 정적 복구
- target tile/current robber tile 정적 class 복구
- 아직 보지 않은 `lastRobberResult`의 정적 모달 표시

금지:

- seven alert sound/motion 재생
- robber move animation 재생
- 과거 discard 완료 sound 재생
- 같은 `lastRobberResult.id` result modal 반복 표시

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 제3자에게 약탈 자원 노출 | viewerRole 기반 payload sanitize |
| pending 복구 시 경고 반복 | reconnect/static restore에서는 cue emit 금지 |
| 타일 강조가 클릭 hit area 방해 | visual class만 변경, pointer target 유지 |
| discard actor 계산 오류 | `pending.discards.filter(!discarded)`를 pendingActors로 사용 |
| 7 alert와 robber pending 혼동 | eventType을 `sevenRolled`와 `robberMovePendingStarted`로 분리 |
| victim 자동 처리 누락 | 후보 0/1/2+명 분기 테스트 추가 |
| result modal 반복 | viewer별 `lastRobberResult.id` dedupe |
| 온라인 target tile 미표시 | `pendingActionView.type/role` 조건을 selectedAction 조건과 분리 |

## 단계 완료 게이트

- 모든 pending 유형에서 actor와 대기자 cue가 구분된다.
- private state 분기 테스트 통과.
- reduced-motion에서도 선택 가능성이 명확하다.
- 7 -> discard -> moveRobber -> victim/result 전환이 각각 다른 cue로 구분된다.
- 다중 discarder와 봇 pending actor가 FEEL-001 상태 표시와 일치한다.
- victim 후보 0/1/2+명 흐름이 모두 처리된다.
- reconnect snapshot에서 pending UI는 복구되고 과거 모션/사운드는 반복되지 않는다.
- robberResult는 viewer별 payload sanitize와 dedupe를 모두 통과한다.

## 2026-05-27 implementation alignment note

Before coding, the completed FEEL-000, FEEL-007, FEEL-006A, FEEL-001, and FEEL-002 final reports were reviewed. The actual code already had the FEEL-000 cue bus, FEEL-007 settings/reduced-motion datasets, FEEL-006A sound foundation, FEEL-001 `pendingActionView` turn focus, FEEL-002 `sevenRolled` dice cue, and server-side `makePendingActionView()` / `makeRobberResultView()` role and privacy matrix.

The implementation is therefore additive: reuse the existing cue bus for `discardPendingStarted`, `robberMovePendingStarted`, `robberVictimPendingStarted`, `robberMoved`, and `robberResult`; apply short 7 alert cues to dice/guide areas; restore current blocking state through DOM attributes while hydrate/session dedupe prevents replay; split robber target/current/waiting tile classes; add discard progress semantics; keep concrete stolen resources limited to actor/victim sanitized views; and use focus-visible/reduced-motion static emphasis for victim selection.
