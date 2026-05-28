# FEEL-000 기반 구조와 이벤트 Cue 버스 계획
 

## 2026-05-27 구현 범위 업데이트

- `script.js`
  - `DEFAULT_FEEL_SETTINGS`, cue key generation, cue scope helpers, played cue key storage, hydrate suppression, raw cue creation, viewer sanitization, cue filtering, and `emitGameCue`/`dispatchGameCue`. 추가.
  - `window.__catanFeelTest` hooks for static and browser smoke validation. 추가.
  - offline cue scope reset on offline game start/reset. 추가.
  - online hydrate suppression for room create/join/reconnect and game start snapshots. 추가.
- `styles.css`
  - shared motion duration/easing tokens and reduced-motion CSS guardrails. 추가.
- `scripts/game-feel-cue-dedupe-static-test.js`
  - a focused Node static/helper test for dedupe, detail-key separation, hydrate suppression, and private-state sanitization. 추가.

구현은 FEEL-000 기반 범위 안에 머물렀다. eventType별 애니메이션, 사운드 재생, UI 설정 control은 추가하지 않았고 해당 작업은 FEEL-001~007에 남겼다.
작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

게임성 피드백 효과를 각 기능에 흩뿌리지 않고, 상태 변화 기반 cue로 관리하기 위한 기반 구조를 만든다.

## 범위

- cue dispatcher
- dedupe key 생성
- viewer 기준 private-safe cue 분기
- motion/sound 설정 모델 초안
- 테스트 가능한 helper 함수 분리

## 구현 후보

- `script.js`
  - `makeCueKey(roomId, revision, eventType, entityId, detailKey)`
  - `makeCueScopeId()`
  - `hasPlayedCue(key)`
  - `markCuePlayed(key, result)`
  - `makeRawCueCandidate(type, data)`
  - `sanitizeCueForViewer(rawCue, viewerState)`
  - `emitGameCue(cue)`
  - `shouldPlayCue(cue, settings, viewerState)`
- `styles.css`
  - 공통 motion token
  - reduced-motion class

## 핵심 규칙

```text
roomId + revision + eventType + entityId + detailKey
```

- 같은 key는 한 세션에서 1회만 재생한다.
- reconnect 직후 과거 state는 정적 복구만 한다.
- private state로 볼 수 없는 정보는 cue payload에도 넣지 않는다.

오프라인에서는 `roomId`와 `revision`을 아래 값으로 대체한다.

```text
scopeId = online roomId || offlineGameId || "offline-session"
revision = online revision || offlineActionCounter || turnIndex/actionCounter
```

`offlineActionCounter`는 새 게임마다 0으로 초기화하고, 주사위/건설/교환/턴 전환처럼 cue를 만들 수 있는 행동이 확정될 때 증가시킨다.

## Cue 가시성 모델

`visibility` 값은 아래 셋만 사용한다.

```text
public
viewerOnly
roleScoped
```

| 값 | 의미 | 필수 추가 정보 |
| --- | --- | --- |
| `public` | 모든 viewer에게 같은 cue를 보여도 안전 | 없음 |
| `viewerOnly` | 현재 viewer에게만 의미가 있는 cue | `viewerSeatIndex` |
| `roleScoped` | actor/victim/observer 등 역할별로 다른 cue | `viewerRole` |

`private`라는 값은 사용하지 않는다. 비공개 정보는 cue visibility가 아니라 sanitize 단계에서 제거한다.

## 완료 기준

- cue key 생성 helper가 있다.
- 중복 cue를 차단할 수 있다.
- cue payload가 viewer 기준으로 안전한지 검토 가능하다.
- 후속 FEEL 단계가 같은 dispatcher를 사용할 수 있다.

## 테스트 초안

- 같은 cue key 2회 emit 시 1회만 처리.
- detailKey가 다르면 같은 revision에서도 서로 다른 cue로 처리.
- reconnect 복구 상태에서는 motion/sound cue가 재생되지 않음.
- private cue payload에 상대 자원 종류가 포함되지 않음.

## 세부 설계

### Cue 객체 형태

```js
{
  type: "diceRolled",
  scopeId: "abc123",
  revision: 42,
  entityId: "seat-0",
  detailKey: "die-1",
  visibility: "public" | "viewerOnly" | "roleScoped",
  viewerRole: null,
  source: "stateDelta" | "userAction" | "system",
  debugLabel: "dice rolled for seat 0",
  payload: {},
  channels: {
    visual: true,
    sound: false,
    log: true
  }
}
```

### 이벤트별 payload schema

Raw cue 후보는 더 많은 정보를 가질 수 있지만, dispatcher에는 아래 schema로 sanitize된 cue만 전달한다.

| type | 허용 payload | 금지 payload |
| --- | --- | --- |
| `diceRolled` | `dice`, `total`, `animationSeed` | 없음 |
| `resourcesProduced` viewer | `seatIndex`, `resourceType`, `amount` | 상대 상세 자원 |
| `resourcesProduced` observer | `seatIndex`, `cardDelta` | `resourceType` |
| `build완료d` | `seatIndex`, `buildType`, `targetId` | 없음 |
| `trade완료d` | 공개 제안 자원, 응답자 요약 | 비공개 보유량 |
| `devCardBought` | `seatIndex`, `cardDelta` | 구매한 카드 종류 |
| `devCardPlayed` | 공개된 카드 종류 | 비공개 손패 |
| `robberResult` actor/victim | `viewerRole`, `resourceType` | 제3자에게 resourceType |
| `robberResult` observer | `viewerRole`, generic result | `resourceType` |
| `winnerDeclared` | `winnerSeatIndex`, `winnerName` | 없음 |

### Cue 처리 단계

```text
1. state delta 또는 user action에서 raw cue 후보 생성
2. viewer 기준 payload sanitize
3. makeCueKey()로 dedupe key 생성
4. hasPlayedCue() 확인
5. settings와 reduced-motion 기준으로 channel filter
6. visual/sound/log handler 호출
7. markCuePlayed(key, result)
```

Raw cue 후보는 visual/sound/log handler로 직접 전달하지 않는다. 반드시 `sanitizeCueForViewer()`를 통과한 cue만 dispatcher에 들어간다.

## Channel 정책

- Dedupe는 cue 전체 기준으로 수행한다.
- 설정 때문에 꺼진 channel은 나중에 소급 재생하지 않는다.
- 예: sound off 상태에서 발생한 `turnChanged` cue는 visual만 실행되고, 이후 sound on으로 바꿔도 과거 turn sound는 재생하지 않는다.
- handler 실패가 발생해도 게임 진행은 중단하지 않는다.
- `markCuePlayed(key, result)`에는 channel별 처리 결과를 남긴다.

예:

```js
{
  visual: "played" | "skipped" | "failed",
  sound: "played" | "skipped" | "failed",
  log: "played" | "skipped" | "failed"
}
```

### 파일/함수 배치

현재 프로젝트는 단일 `script.js` 중심이므로 1차 구현은 별도 번들 없이 `script.js` 내부에 작은 섹션으로 둔다.

권장 섹션:

```text
Feel settings
Feel cue helpers
Feel visual handlers
Feel sound handlers
Feel static tests hooks
```

추후 파일 분리가 필요하면 `scripts` 테스트와 브라우저 로드 방식을 먼저 정리한 뒤 진행한다.

## 구현 순서

1. 공통 settings 기본 객체 추가.
2. `makeCueKey()`와 `playedCueKeys` 저장소 추가.
3. `emitGameCue()`와 channel dispatch stub 추가.
4. `sanitizeCueForViewer()` 추가.
5. 오프라인 `offlineActionCounter` 또는 equivalent counter 추가.
6. 온라인 reconnect 직후 cue suppression flag 추가.
7. 정적 테스트 hook 또는 test mode helper 추가.

## Reconnect/Hydrate Suppression

온라인 reconnect 또는 새로고침 복구 시 받은 첫 state snapshot은 과거 상태 복구로 간주한다.

```text
1. reconnected/roomJoined 이후 hydrate state 수신
2. 해당 snapshot으로 UI는 정적 복구
3. 이 snapshot에서는 cue emit 금지
4. 이후 revision 증가분부터 cue emit 허용
```

예외:

- 현재 사용자가 반드시 처리해야 하는 blocking pending action은 모션/사운드 없이 정적 모달/상태만 복구한다.
- room ended 상태도 효과 없이 정적 안내만 복구한다.

## playedCueKeys reset 기준

`playedCueKeys`는 아래 상황에서 reset한다.

- 오프라인 새 게임 시작
- 온라인 방 나가기
- 온라인 새 방 참가
- roomId 변경
- 같은 방에서 final leave/end 이후 새 게임이 시작되는 경우

같은 roomId에서 reconnect만 발생한 경우에는 sessionStorage 기반 dedupe를 유지해 과거 cue가 반복되지 않게 한다.

## 테스트 hook 기준

1차 구현은 별도 파일 분리 없이 아래 test hook을 제공한다.

```js
window.__catanFeelTest = {
  makeCueKey,
  sanitizeCueForViewer,
  shouldPlayCue,
  resetPlayedCueKeys,
  getPlayedCueKeys
}
```

순수 함수로 분리 가능한 helper는 DOM 없이 Node 정적 테스트에서 검증 가능하게 작성한다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| cue 시스템이 기존 로그/모달과 중복됨 | 1차는 기존 로직을 대체하지 않고 보조 cue만 연결 |
| reconnect 후 과거 이벤트가 재생됨 | reconnect hydrate 구간에서는 static restore만 허용 |
| private payload leak | raw cue 후보를 직접 dispatch하지 않고 sanitize된 cue만 emit |
| 메모리 증가 | played key는 방 단위로 reset하고 최대 개수 제한 검토 |
| 오프라인 key 충돌 | offlineActionCounter를 새 게임마다 초기화 |
| channel 실패가 게임을 막음 | handler 예외를 잡고 result에 `failed` 기록 |

## 단계 완료 게이트

- FEEL-001~006이 import 없이 사용할 수 있는 cue helper가 준비된다.
- cue helper가 없어도 기존 게임 진행은 영향받지 않는다.
- test mode에서 cue key/dedupe 결과를 확인할 수 있다.
- 오프라인과 온라인 모두 cue key를 만들 수 있다.
- raw cue가 sanitize 없이 handler에 전달되지 않는다.
- reconnect hydrate snapshot에서 cue가 재생되지 않는다.
