# FEEL-003 행동 성공/실패/승리 피드백 계획

작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

건설, 개발 카드, 교환, 승리 같은 큰 행동 결과를 로그 없이도 즉시 이해하게 한다.

## 범위

- 도로 draw-in
- 마을/도시 pop-in
- 도시 업그레이드 cue
- 개발 카드 구매 generic cue
- 공개 개발 카드 사용 cue
- 교환 성공 swap cue
- 실패 원인별 cue
- 승리 정적/짧은 강조 cue

## 감지 원칙

행동 결과 cue는 오프라인과 온라인의 확정 시점이 다르다.

```text
오프라인: 로컬 함수가 성공을 반환하고 state mutation이 끝난 직후 cue emit
온라인: 서버 command 응답 자체가 아니라 revision 증가 후 state delta에서 cue emit
```

온라인에서 command 전송 직후 성공 cue를 먼저 보여주면 서버 거절, 재접속, 지연 응답에서 잘못된 확정처럼 보일 수 있다. 따라서 온라인 success cue는 `previousState -> nextState` 비교로 만든다.

오프라인 cue 삽입 후보:

```text
buildRoad() 성공 return 직전
buildSettlement() 성공 return 직전
buildCity() 성공 return 직전
buyDevCard() 성공 직후
useDevCard 계열 카드별 성공 직후
bankTrade/playerTrade 로컬 성공 직후
checkWin()에서 winner가 새로 설정된 직후
```

온라인 cue 감지 후보:

```text
roadBuilt / settlementBuilt / cityBuilt command 결과가 반영된 board delta
lastTrade 변경
pendingPlayerTrade 종료 결과 변경
usedDevThisTurn 또는 lastDevCardResult 변경
winner null -> seatIndex 변경
server error response 수신
```

## 실패 그룹

```text
규칙상 불가
자원 부족
네트워크/서버 거절
```

실패는 강한 shake보다 이유 문구와 disabled reason을 우선한다.

### 실패 코드 매핑

서버/클라이언트의 구체적인 실패 코드는 아래 그룹으로 정규화한다.

| 그룹 | 대표 코드/상황 | cue 기준 |
| --- | --- | --- |
| 규칙상 불가 | `INVALID_PLACEMENT`, `ROAD_NOT_CONNECTED`, `EDGE_OCCUPIED`, `VERTEX_OCCUPIED`, `DEV_CARD_NOT_PLAYABLE`, `DEV_CARD_BOUGHT_THIS_TURN`, `TRADE_RESPONSE_REQUIRED`, `NOT_YOUR_TURN`, 이미 굴림/아직 안 굴림 | 관련 버튼/가이드 영역에 이유 표시 |
| 자원 부족 | `NOT_ENOUGH_RESOURCES`, `BANK_RESOURCE_EMPTY`, `NO_PIECES`, 개발 카드 더미 없음 | 비용/보유량 또는 은행 재고 문구 강조 |
| 네트워크/서버 거절 | 연결 끊김, timeout, 알 수 없는 서버 오류, stale trade round | 상태 배너와 재시도/상태 확인 문구 |

행동 전 disabled reason과 행동 후 `commandRejected` cue는 분리한다.

- disabled reason: 사용자가 누르기 전에 왜 비활성인지 알려준다.
- commandRejected: 누른 뒤 서버나 규칙 검증에서 거절된 이유를 알려준다.

## 승리 cue 기준

- 1차는 최종 모달 내부와 승자 카드 주변으로 제한한다.
- viewport 전체 particle/confetti overlay는 제외한다.
- reduced-motion에서는 정적 강조만 사용한다.
- hidden victory point는 승리 확정 후 서버가 공개해도 되는 `winnerSummary` 수준의 정보만 사용한다.
- 승리 cue payload에는 비승자의 손패, 개발 카드 종류, 비공개 자원 정보를 넣지 않는다.
- 승리 모달은 모바일에서 버튼이 항상 보이고, 모션이 버튼을 가리거나 pointer event를 가로채면 안 된다.

## 구현 후보

- `script.js`
  - build완료d cue
  - trade완료d cue
  - bankTrade완료d cue
  - playerTrade완료d / playerTradeInvalidated cue
  - devCardBought / devCardPlayed cue
  - winnerDeclared cue
  - commandRejected cue
- `styles.css`
  - `motion-build-pop`
  - `motion-road-draw`
  - `motion-trade-swap`
  - `motion-win-highlight`

## 이벤트 매핑

### 서버/로컬 결과 -> cue type

| 결과 source | cue type | detailKey 후보 |
| --- | --- | --- |
| `roadBuilt` / 오프라인 `buildRoad()` 성공 | `build완료d` | `road:${edgeId}` |
| `settlementBuilt` / 오프라인 `buildSettlement()` 성공 | `build완료d` | `settlement:${vertexId}` |
| `cityBuilt` / 오프라인 `buildCity()` 성공 | `build완료d` | `city:${vertexId}` |
| `bankTraded` / 은행·항구 교환 성공 | `bankTrade완료d` | `seatIndex:give:get:createdAt/revision` |
| `playerTradeChosen` | `playerTrade완료d` | `tradeId:round:targetPlayerId` |
| `playerTradeInvalidated` | `playerTradeInvalidated` | `tradeId:round:reason` |
| `devCardBought` | `devCardBought` | `seatIndex:revision` |
| `devCardPlayed` | `devCardPlayed` | `seatIndex:cardType:revision` |
| `winner` null -> seatIndex | `winnerDeclared` | `winnerSeatIndex:revision/finalScore` |
| sendError / local validation fail | `commandRejected` | `commandName:errorCode:targetId/requestId` |

온라인에서는 command accepted type만으로 cue를 확정하지 않고, 가능한 한 next state에서 실제 board/player 상태 변화를 확인한다.

### DOM motion target 기준

| 대상 | motion 적용 대상 | 금지 대상 |
| --- | --- | --- |
| 도로 | `.road-token` 내부 시각 요소 또는 새로 생성된 road group | `.road-target`, edge hit area, pointer target |
| 마을/도시 | `.vertex.building` 내부 badge/icon | open vertex hit target, 좌표 transform 기준점 |
| 도시 업그레이드 | 기존 settlement가 city로 바뀐 vertex의 building visual | vertex click area |
| 개발 카드 구매 | 현재 플레이어 패널의 generic card/count 영역 | 카드 종류 텍스트/아이콘 |
| 교환 성공 | 관련 player card resource count 또는 trade modal review | 비공개 보유량 상세 |
| 승리 | winner card, final modal 내부 제목/요약 | 전체 viewport particle overlay |

보드 hit target은 모션 때문에 이동하거나 크기가 바뀌면 안 된다. transform은 child visual에만 적용한다.

## 완료 기준

- 성공 행동은 보드 또는 관련 패널에서 즉시 보인다.
- 실패는 원인별로 다르게 안내된다.
- 승리 순간은 사운드 없이도 명확하다.
- 보드 hit target 위치가 모션으로 흔들리지 않는다.
- 온라인 success cue는 서버 state delta 이후에만 재생된다.
- 개발 카드 구매 cue는 카드 종류를 노출하지 않는다.
- 교환 cue는 은행/항구 교환과 플레이어 교환을 구분한다.
- 실패 cue는 disabled reason과 commandRejected를 구분한다.

## 테스트 초안

- 건설 성공 cue 중복 방지.
- 개발 카드 구매 cue가 카드 종류를 노출하지 않음.
- 승리 모달 버튼이 모바일에서 가려지지 않음.
- 도로/마을/도시 각각 성공 시 targetId 기준으로 cue가 1회만 재생됨.
- 도로 draw motion 후에도 road hit target이 클릭 가능한 위치를 유지함.
- 도시 업그레이드는 settlement pop과 구분되는 cue를 사용함.
- 은행/항구 교환 성공 cue가 `lastTrade` 기준으로 dedupe됨.
- 플레이어 교환 완료와 무효화가 서로 다른 cue와 문구를 사용함.
- 개발 카드 사용 cue가 공개 가능한 카드 종류만 표시함.
- monopoly 결과가 observer에게 선택 자원 종류를 노출하지 않음.
- 서버 `NOT_ENOUGH_RESOURCES`는 자원 부족 그룹으로 표시됨.
- 서버 `INVALID_PLACEMENT`는 규칙상 불가 그룹으로 표시됨.
- 연결 오류는 네트워크/서버 거절 그룹으로 표시됨.
- winner null -> seatIndex 변경 시 `winnerDeclared`가 1회만 재생됨.
- reduced-motion에서 build/trade/win motion이 정적 강조로 대체됨.

## 이벤트별 세부 계획

| 이벤트 | cue | 대상 UI | private 기준 |
| --- | --- | --- | --- |
| 도로 건설 | road draw | board edge | 공개 정보 |
| 마을 건설 | build pop | vertex building | 공개 정보 |
| 도시 업그레이드 | upgrade pop | vertex building | 공개 정보 |
| 개발 카드 구매 | generic card gain | 현재 플레이어 패널 | 카드 종류 비공개 |
| 개발 카드 사용 | card type cue | 로그/가이드/카드 영역 | 사용 후 공개된 카드만 |
| 은행/항구 교환 성공 | trade swap | trade modal/log/player cards | 본인 교환 상세, 타인은 공개 가능한 요약 |
| 플레이어 교환 성공 | trade swap | trade modal/log/player cards | 제안/수락으로 공개된 자원만 |
| 플레이어 교환 무효화 | stale trade notice | trade modal/status | 비공개 보유량 미노출 |
| 승리 | win highlight | winner card/final modal | 공개 정보 |

## 개발 카드 private 기준

개발 카드는 구매와 사용의 정보 공개 수준이 다르다.

| 이벤트 | 허용 payload | 금지 payload |
| --- | --- | --- |
| 구매 | `seatIndex`, `cardDelta`, `createdAt/revision` | 구매한 카드 종류 |
| 기사 사용 | `seatIndex`, `cardType: knight`, 공개된 largest army 변화 | 비공개 손패 |
| 도로 건설 카드 사용 | `seatIndex`, `cardType: roadBuilding`, pendingFreeRoads count | 비공개 손패 |
| 풍년 사용 | actor에게 선택 자원 표시 가능, observer에게는 generic gain | 상대가 유추할 수 없는 상세 손패 |
| 독점 사용 | 공개 카드 종류와 획득 수량 요약 | observer에게 선택 자원 종류를 불필요하게 노출 |
| 승점 카드 | 승리 전 사용 cue 없음 | hidden victory card 종류/수량 |

온라인에서 `devCardPlayed` cue를 안정적으로 만들려면 서버 state에 dedupe 가능한 `lastDevCardResult` view가 필요하다. 1차 구현에서 state 확장이 부담되면 `usedDevThisTurn` 변화와 공개 pending state를 조합하되, 카드 종류를 확정할 수 없는 경우 generic `devCardPlayed` cue로 낮춘다.

권장 `lastDevCardResult` view:

```js
{
  id: "dev-result-revision-seat",
  seatIndex,
  type: "knight" | "roadBuilding" | "yearPlenty" | "monopoly" | "generic",
  publicSummary,
  createdAt
}
```

이 view도 viewer 기준 sanitize를 통과해야 한다.

## 교환 result 기준

은행/항구 교환과 플레이어 교환은 cue를 분리한다.

은행/항구 교환:

```text
source: lastTrade
payload: seatIndex, ratio, give, get, createdAt
타 플레이어에게도 give/get은 공개 행동 로그 수준으로 허용
```

플레이어 교환 완료:

```text
source: pendingPlayerTrade 종료 결과 또는 lastPlayerTradeResult
payload: requesterPlayerId, targetPlayerId, offer, request, resultType = completed
공개된 제안/수락 자원만 사용
```

플레이어 교환 무효화:

```text
payload: requesterPlayerId, targetPlayerId, resultType = invalidated, reason = staleResources/generic
비공개 보유량이나 어느 자원이 부족했는지는 노출하지 않는다.
```

`lastPlayerTradeResult`가 없다면 1차 구현에서는 기존 모달/로그를 유지하고, player trade cue는 state 확장 후 연결한다.

## 구현 순서

1. FEEL-000 cue bus에 action result eventType 연결.
2. board entity에 일회성 motion class를 붙이는 helper 추가.
3. build success cue 적용.
4. trade success cue 적용.
5. dev card generic/public cue 분리.
6. win highlight cue 적용.
7. 실패 그룹별 message/cue 정리.

세부 순서:

1. 오프라인 build success cue부터 연결해 board motion target 검증.
2. 온라인 board delta 기반 build cue 연결.
3. 은행/항구 교환 cue 연결.
4. 플레이어 교환은 기존 state로 가능한 범위 확인 후, 필요 시 `lastPlayerTradeResult` 추가 계획으로 분리.
5. 개발 카드 구매 generic cue 연결.
6. 개발 카드 사용 cue는 private-safe result view 기준으로 연결.
7. winnerDeclared cue와 모바일 final modal 확인.
8. commandRejected/disabled reason mapping 정리.

## 실패 피드백 문구 기준

```text
규칙상 불가: 이 위치에는 지을 수 없습니다.
자원 부족: 필요한 자원이 부족합니다.
네트워크/서버 거절: 서버가 요청을 처리하지 못했습니다. 상태를 다시 확인하세요.
```

실패 cue는 빨간 흔들림보다 reason text와 focus 이동을 우선한다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 개발 카드 종류 노출 | 구매는 항상 generic cue |
| 보드 hit target 이동 | transform은 child visual에만 적용 |
| 승리 효과가 모달 버튼을 가림 | 전체 overlay particle 제외 |
| 같은 build cue 반복 | `buildType + targetId` detailKey 사용 |
| 온라인 command ack를 성공으로 오인 | state delta 확인 후 cue emit |
| 은행 교환과 플레이어 교환 혼동 | `bankTrade완료d`, `playerTrade완료d` 분리 |
| 개발 카드 사용 결과 dedupe 불가 | `lastDevCardResult.id` 또는 revision 기반 key 사용 |
| 실패 안내 중복 | disabled reason과 commandRejected 표시 위치 분리 |
| 승점 개발 카드 정보 조기 노출 | winner 확정 전 hidden victory cue 금지 |

## dedupe key 기준

```text
build완료d: scopeId + revision + buildType + targetId
bankTrade완료d: scopeId + revision + seatIndex + give + get + createdAt/generic
playerTrade완료d: scopeId + revision + tradeId + round + targetPlayerId
playerTradeInvalidated: scopeId + revision + tradeId + round + "invalidated"
devCardBought: scopeId + revision + seatIndex + "generic"
devCardPlayed: scopeId + revision + seatIndex + publicCardType/generic
winnerDeclared: scopeId + revision + winnerSeatIndex
commandRejected: scopeId + requestId/errorCode + commandName + targetId/generic
```

같은 revision 재수신, 모달 재렌더, reconnect hydrate로 같은 cue가 반복되면 안 된다.

## 단계 완료 게이트

- build/trade/dev/win cue가 각각 dedupe된다.
- 실패 이유가 행동 전/후 최소 한 곳에 표시된다.
- 모바일에서 승리 모달 조작 가능.
- 오프라인 cue는 성공 반환 직후, 온라인 cue는 state delta 이후에만 발생한다.
- build motion이 board hit target을 움직이지 않는다.
- 개발 카드 구매/승점 카드/monopoly 관련 private state가 노출되지 않는다.
- 은행/항구 교환과 플레이어 교환 완료/무효화가 구분된다.
- reduced-motion에서도 성공/실패/승리를 텍스트와 정적 강조로 이해할 수 있다.

## 2026-05-27 implementation alignment note

The actual code already included action command paths for offline and online builds, bank/player trades, development cards, command errors, and winner calculation. FEEL-003 is implemented additively by routing confirmed outcomes through the FEEL cue bus after local state mutation or online state delta, not from optimistic command submission.

Implemented scope: `build완료d`, `bankTrade완료d`, `playerTrade완료d`, `playerTradeInvalidated`, `devCardBought`, `devCardPlayed`, `winnerDeclared`, and `commandRejected` cues; temporary DOM motion classes for road/build/trade/win/rejection; local validation rejection grouping; online command rejection context; and reduced-motion static outlines for action result cues. Development card purchase remains generic and card type is removed by the existing cue sanitizer.
