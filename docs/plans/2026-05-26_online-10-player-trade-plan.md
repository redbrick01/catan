# 온라인 10 플레이어 간 교환 구현 계획

작성일: 2026-05-26

## 2026-05-26 작업 전 갱신

이번 작업은 기존 계획의 범위 안에서 다음 파일을 수정한다.

```text
server.js
script.js
styles.css
scripts/online-10-player-trade-ws-test.js
docs/tests/2026-05-26_online-10-player-trade-test-plan.md
docs/reports/2026-05-26_online-10-player-trade-final-report.md
```

구현 방향:

```text
room.pendingPlayerTrade를 서버 권위 상태로 추가하고 viewer별 pendingPlayerTrade view를 makeRoomState에서 내려준다.
openPlayerTrade는 active player + rolled=true + pending 없음 조건에서만 허용한다.
respond/choose/update/cancel은 pending trade 전용 command로 처리하고, tradeId/round를 검증한다.
pending trade 중 endTurn/buildRoad/buildSettlement/buildCity/bankTrade/openPlayerTrade는 INVALID_ACTION 또는 TRADE_ALREADY_PENDING으로 거절한다.
거래 확정 시점에 요청자 offer와 선택된 응답자의 request를 재검증한 뒤 자원을 이동한다.
응답자 counter는 자동 확정 대상이 아니라 requester가 updatePlayerTradeOffer로 재요청할 수 있는 제안으로만 처리한다.
클라이언트는 온라인 play phase에서 플레이어 교환 버튼을 활성화하고, pendingPlayerTrade view에 따라 요청자/응답자/제3자 모달을 다르게 렌더링한다.
오프라인 플레이어 교환은 기존 로컬 showPlayerTradeModal 경로를 유지한다.
```

검증 방향:

```text
node --check server.js
node --check script.js
WebSocket 자동 테스트로 open/respond/counter/update/choose/cancel/차단/private view를 검증한다.
온라인 3브라우저 수동 테스트와 오프라인 기존 교환 확인 항목은 테스트 계획/최종 보고서에 명시한다.
```

## 목적

온라인 모드에서 플레이어 간 교환 요청, 전체 응답, 최종 선택, 재요청, 취소를 서버 권위 방식으로 구현한다.

9단계까지 완료되면 은행/항구 교환은 오프라인/온라인 공용 모달로 동작하고, 온라인에서는 서버 `bankTrade` command로만 처리된다. 10단계의 목표는 현재 온라인에서 비활성화되어 있는 플레이어 간 교환을 서버 pending state 기반으로 열어, 거래 요청자가 원하는 교환 조건을 모든 유저에게 제시하고 각 유저의 응답을 모아 최종 거래 상대를 선택할 수 있게 만드는 것이다.

이 프로젝트는 친구끼리 LAN/소규모 온라인 방에서 개인적으로 쓰는 용도이므로, 채팅형 복잡 협상보다 “전체 요청 -> 수락/거절/흥정 응답 -> 최종 선택 또는 재요청” 흐름이 명확하게 동작하는 것을 우선한다.

## 전제

```text
1~5-2단계가 완료되어 온라인 방 생성/참가/재접속/방 종료 정책이 동작한다.
6단계가 완료되어 초기 배치가 서버 기준으로 끝나고 play phase로 진입한다.
7단계가 완료되어 rollDice/endTurn이 서버 기준으로 동작한다.
8단계가 완료되어 기본 건설이 서버 기준으로 동작한다.
9단계가 완료되어 은행/항구 교환이 서버 기준으로 동작한다.
오프라인 플레이어 간 교환은 기존 로컬 모달/로직을 유지한다.
```

9단계에서 남은 항구 3:1/2:1 전용 성공 검증은 10단계 구현과 직접 충돌하지 않지만, 최종 안정화 전에는 별도 확인해야 한다.

## 범위

포함:

```text
openPlayerTrade command
respondPlayerTrade command
choosePlayerTradeResponse command
updatePlayerTradeOffer command
cancelPlayerTrade command
서버 pending player trade round state
거래 요청자 조건 편집 UI
전체 유저 거래 요청 모달
나머지 유저 수락/거절/흥정 응답 UI
거래 요청자에게 유저별 응답 목록 표시
다른 플레이어에게는 상세 자원 미노출
최종 선택 시점 양쪽 자원 재검증
최종 선택 시 자원 이동
거절/흥정/취소/재요청 처리
턴 종료/방 종료/재접속 대기 상태와의 충돌 방지
WebSocket 자동 테스트
최종 보고서 작성
```

제외:

```text
채팅
동시 다중 거래 요청
자유 입력 채팅식 카운터 오퍼
시간 제한 타이머
교환 히스토리 상세 공개
비동기 장기 협상
AI 추천 교환
배포용 보안/계정/영구 저장
```

## 핵심 정책

```text
온라인 플레이어 간 교환은 서버 pending trade round state로만 관리한다.
거래 요청자가 현재 차례이고 주사위를 굴린 뒤에만 거래 요청을 열 수 있다.
거래 요청자가 플레이어 교환 버튼을 누르면 모든 유저에게 거래 모달이 열린다.
거래 요청자는 좌측에서 자신이 지불할 자원과 받을 자원의 종류와 개수를 조절한다.
거래 요청자의 우측에는 나머지 유저들의 응답 상태가 표시된다.
나머지 유저들은 거래 요청 내역을 보고 수락/거절/흥정으로 응답한다.
모든 나머지 유저가 응답하면 거래 요청자는 수락한 유저 중 하나를 선택해 거래를 확정할 수 있다.
거래 요청자는 흥정 응답을 참고해 지불/요청 자원을 변경하고 재요청할 수 있다.
거래 요청자는 언제든 거래를 취소할 수 있다.
한 방에는 동시에 pending player trade round를 1개만 허용한다.
최종 거래 선택 시점에 양쪽 자원을 다시 검증한다.
거래 확정 전에는 어떤 자원도 이동하지 않는다.
거래 확정/취소 후 pending trade round는 제거한다.
상대 또는 제3자에게 플레이어의 전체 자원 상세를 노출하지 않는다.
```

한 방에 pending trade round 1개만 허용하는 이유:

```text
개인용 소규모 게임에서는 동시 협상보다 명확한 흐름이 중요하다.
동시 pending을 허용하면 같은 자원을 여러 제안에 묶는 문제와 수락 순서 문제가 생긴다.
10단계에서는 단순하고 안정적인 1개 pending 정책을 우선한다.
```

응답 정책:

```text
수락: 현재 조건 그대로 거래할 의사가 있음을 표시한다.
거절: 현재 조건으로는 거래하지 않겠다는 의사를 표시한다.
흥정: 응답자가 자신이 원하는 거래 조건을 직접 지정해서 응답한다.
흥정은 10단계에서 자유 채팅이 아니라 counterOffer/counterRequest 자원 조합으로 처리한다.
흥정 응답에는 응답자가 원하는 자원 조합을 counterOffer/counterRequest 형태로 담되, 자동 확정은 하지 않는다.
거래 요청자가 흥정 내용을 보고 조건을 수정해 재요청해야 한다.
```

## 서버 데이터 모델

room 또는 matchState에 다음 pending trade round를 둔다.

권장 위치:

```text
room.pendingPlayerTrade
```

예시:

```json
{
  "id": "trade_abc123",
  "round": 1,
  "status": "collecting",
  "requesterPlayerId": "p_host",
  "requesterSeatIndex": 0,
  "offer": {
    "forest": 1,
    "hill": 0,
    "pasture": 0,
    "field": 0,
    "mountain": 0
  },
  "request": {
    "forest": 0,
    "hill": 0,
    "pasture": 0,
    "field": 1,
    "mountain": 0
  },
  "responses": {
    "p_guest_a": {
      "playerId": "p_guest_a",
      "seatIndex": 1,
      "type": "accept",
      "createdAt": 1760000001000
    },
    "p_guest_b": {
      "playerId": "p_guest_b",
      "seatIndex": 2,
      "type": "counter",
      "counterOffer": {
        "forest": 0,
        "hill": 1,
        "pasture": 0,
        "field": 0,
        "mountain": 0
      },
      "counterRequest": {
        "forest": 0,
        "hill": 0,
        "pasture": 1,
        "field": 0,
        "mountain": 0
      },
      "createdAt": 1760000002000
    },
    "p_guest_c": {
      "playerId": "p_guest_c",
      "seatIndex": 3,
      "type": "reject",
      "createdAt": 1760000003000
    }
  },
  "createdAt": 1760000000000,
  "updatedAt": 1760000003000,
  "createdRevision": 42
}
```

필드 정책:

```text
requesterPlayerId는 거래 요청자다.
offer는 거래 요청자가 주는 자원이다.
request는 거래 요청자가 받고 싶은 자원이다.
responses는 거래 요청자를 제외한 플레이어별 응답이다.
response.type은 accept, reject, counter 중 하나다.
counterOffer는 응답자가 주고 싶은 자원이다.
counterRequest는 응답자가 받고 싶은 자원이다.
각 resource 값은 0 이상의 정수다.
offer와 request는 각각 최소 1개 이상이어야 한다.
counterOffer/counterRequest도 counter 응답에서는 각각 최소 1개 이상이어야 한다.
음수, 소수, 문자열 숫자는 정수로 정규화하거나 거부한다. 권장: 거부.
round는 재요청할 때마다 1씩 증가한다.
재요청 시 기존 responses는 초기화한다.
```

## Command 규격

### openPlayerTrade

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "openPlayerTrade",
    "offer": {
      "forest": 1
    },
    "request": {
      "field": 1
    }
  }
}
```

호환 정책:

```text
기존 오프라인 UI 용어가 give/receive라면 클라이언트 내부에서 offer/request로 변환한다.
서버 command는 offer/request 이름을 우선한다.
과거 계획서의 give/receive 명칭은 혼동을 줄이기 위해 10단계부터 offer/request로 통일한다.
기존 proposePlayerTrade라는 이름은 1:1 지정 제안처럼 보이므로, 전체 공개 요청 흐름에서는 openPlayerTrade를 사용한다.
```

### respondPlayerTrade: 수락

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_guest",
  "playerToken": "secret",
  "payload": {
    "name": "respondPlayerTrade",
    "tradeId": "trade_abc123",
    "round": 1,
    "response": "accept"
  }
}
```

### respondPlayerTrade: 거절

```json
{
  "type": "command",
  "requestId": "r3",
  "roomId": "abc123",
  "playerId": "p_guest",
  "playerToken": "secret",
  "payload": {
    "name": "respondPlayerTrade",
    "tradeId": "trade_abc123",
    "round": 1,
    "response": "reject"
  }
}
```

### respondPlayerTrade: 흥정

```json
{
  "type": "command",
  "requestId": "r4",
  "roomId": "abc123",
  "playerId": "p_guest",
  "playerToken": "secret",
  "payload": {
    "name": "respondPlayerTrade",
    "tradeId": "trade_abc123",
    "round": 1,
    "response": "counter",
    "counterOffer": {
      "hill": 1
    },
    "counterRequest": {
      "pasture": 1
    }
  }
}
```

### choosePlayerTradeResponse

```json
{
  "type": "command",
  "requestId": "r5",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "choosePlayerTradeResponse",
    "tradeId": "trade_abc123",
    "round": 1,
    "targetPlayerId": "p_guest"
  }
}
```

정책:

```text
choose는 accept 응답을 보낸 플레이어만 선택할 수 있다.
counter 응답은 자동 거래 대상이 아니며, 요청자가 조건을 수정해 재요청해야 한다.
```

### updatePlayerTradeOffer

```json
{
  "type": "command",
  "requestId": "r6",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "updatePlayerTradeOffer",
    "tradeId": "trade_abc123",
    "round": 1,
    "offer": {
      "forest": 2
    },
    "request": {
      "field": 1
    }
  }
}
```

정책:

```text
update는 거래 요청자만 할 수 있다.
update 성공 시 round를 1 증가시키고 모든 응답을 초기화한다.
모든 유저에게 수정된 거래 요청 모달을 다시 표시한다.
```

### cancelPlayerTrade

```json
{
  "type": "command",
  "requestId": "r7",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "cancelPlayerTrade",
    "tradeId": "trade_abc123",
    "round": 1
  }
}
```

## 서버 구현 계획

### 1. 공통 검증

거래 요청을 여는 command는 8~9단계의 play command 검증을 따른다.

openPlayerTrade 검증:

```text
room이 존재해야 한다.
room.status === "playing"이어야 한다.
room.status === "ended"이면 ROOM_ENDED로 거부한다.
요청 playerId/playerToken 인증이 성공해야 한다.
요청 플레이어가 left 상태이면 PLAYER_LEFT로 거부한다.
요청 플레이어가 connected=false이면 PLAYER_DISCONNECTED로 거부한다.
다른 참가자 중 left=false이고 connected=false인 플레이어가 있으면 ROOM_NOT_READY로 거부한다.
matchState가 존재해야 한다.
game.phase === "play"여야 한다.
winner가 없어야 한다.
요청자가 현재 active player여야 한다.
game.rolled === true여야 한다.
pending discard/robber/freeRoad 등 다른 pending action이 없어야 한다.
room.pendingPlayerTrade가 없어야 한다.
거래 요청자를 제외한 응답 가능 플레이어가 1명 이상 있어야 한다.
응답 가능 플레이어는 left=false, connected=true여야 한다.
offer/request 자원 객체가 유효해야 한다.
거래 요청자가 offer 자원을 충분히 가지고 있어야 한다.
```

respond/choose/update/cancel command는 active player 검증을 그대로 쓰면 안 된다.

respond/choose/update/cancel 공통 검증:

```text
room이 존재해야 한다.
room.status === "playing"이어야 한다.
room.status === "ended"이면 ROOM_ENDED로 거부한다.
요청 playerId/playerToken 인증이 성공해야 한다.
요청 플레이어가 left 상태이면 PLAYER_LEFT로 거부한다.
요청 플레이어가 connected=false이면 PLAYER_DISCONNECTED로 거부한다.
room.pendingPlayerTrade가 존재해야 한다.
payload.tradeId가 pending trade id와 일치해야 한다.
payload.round가 있으면 pending trade round와 일치해야 한다.
game.phase === "play"여야 한다.
winner가 없어야 한다.
다른 참가자 중 disconnected가 있으면 ROOM_NOT_READY로 거부한다.
```

권한:

```text
respondPlayerTrade는 거래 요청자를 제외한 플레이어만 가능하다.
respondPlayerTrade는 같은 round에서 플레이어당 1개의 최신 응답만 유지한다.
choosePlayerTradeResponse는 requesterPlayerId만 가능하다.
choosePlayerTradeResponse는 accept 응답을 보낸 플레이어만 선택할 수 있다.
updatePlayerTradeOffer는 requesterPlayerId만 가능하다.
cancelPlayerTrade는 requesterPlayerId만 가능하다.
```

### 2. 자원 객체 검증

서버 helper:

```text
normalizeTradeResources(value)
hasAnyResource(resourceMap)
hasResources(player, resourceMap)
moveResources(fromPlayer, toPlayer, resourceMap)
```

검증 규칙:

```text
허용 resource id만 받는다.
누락된 resource는 0으로 취급한다.
값은 0 이상의 정수여야 한다.
알 수 없는 key가 있으면 INVALID_RESOURCE로 거부한다.
offer와 request 모두 최소 1개 이상의 총량이 있어야 한다.
counter 응답에서는 counterOffer와 counterRequest 모두 최소 1개 이상의 총량이 있어야 한다.
open/update 시점에 거래 요청자의 offer 자원이 충분해야 한다.
choose 시점에 거래 요청자의 offer와 선택된 응답자의 request를 다시 검증한다.
```

수락 시점 재검증이 필요한 이유:

```text
거래 요청 후 요청자가 은행 교환/건설 등으로 자원을 써버릴 수 있다.
향후 단계에서 개발 카드나 7 처리로 자원 상태가 바뀔 수 있다.
따라서 pending 생성 시점 검증만으로는 부족하다.
```

### 3. open 처리 순서

```text
1. open 공통 검증을 통과한다.
2. offer/request를 정규화한다.
3. offer/request가 비어 있지 않은지 확인한다.
4. 거래 요청자가 offer 자원을 충분히 갖고 있는지 확인한다.
5. 거래 요청자를 제외한 응답 대상 플레이어 목록을 계산한다.
6. room.pendingPlayerTrade를 생성한다.
7. room.revision += 1
8. room.updatedAt 갱신
9. 거래 요청자에게 playerTradeOpened ack 전송
10. 방 전체에 viewer별 state broadcast
```

주의:

```text
pending 생성 시 자원을 미리 차감하지 않는다.
거래 요청자는 pending 중에도 취소할 수 있다.
거래 요청자는 모든 유저 응답 후 또는 중간에도 조건을 수정해 재요청할 수 있다.
단, pending 중에는 턴 종료와 다른 게임 진행 command를 어떻게 막을지 정책을 정해야 한다.
```

권장 정책:

```text
pending player trade가 있으면 요청자의 endTurn/build/bankTrade/openPlayerTrade를 막는다.
요청자가 턴을 끝내고 싶으면 먼저 거래를 취소하거나 확정해야 한다.
```

### 4. respond 처리 순서

```text
1. respond 공통 검증을 통과한다.
2. 요청자가 pending.requesterPlayerId가 아닌지 확인한다.
3. response가 accept/reject/counter 중 하나인지 확인한다.
4. counter라면 counterOffer/counterRequest를 검증한다.
5. pending.responses[playerId]를 현재 응답으로 갱신한다.
6. room.revision += 1
7. room.updatedAt 갱신
8. playerTradeResponded ack 전송
9. 방 전체에 viewer별 state broadcast
```

응답 완료 판정:

```text
거래 요청자를 제외한 left=false 플레이어가 모두 응답하면 status를 "readyToChoose"로 바꿀 수 있다.
status 필드는 UI 보조용이며, choose는 accept 응답이 1개 이상 있을 때만 가능하다.
모든 유저가 응답하기 전에도 요청자가 취소하거나 재요청할 수 있다.
```

### 5. choose 처리 순서

```text
1. choose 공통 검증을 통과한다.
2. 요청자가 pending.requesterPlayerId인지 확인한다.
3. 거래 요청자를 제외한 응답 대상 플레이어가 모두 응답했는지 확인한다.
4. targetPlayerId가 accept 응답을 보냈는지 확인한다.
5. 거래 요청자와 선택된 응답자의 현재 game player를 찾는다.
6. 거래 요청자의 offer 자원이 충분한지 다시 확인한다.
7. 선택된 응답자의 request 자원이 충분한지 확인한다.
8. 거래 요청자 -> 선택된 응답자 방향으로 offer 자원을 이동한다.
9. 선택된 응답자 -> 거래 요청자 방향으로 request 자원을 이동한다.
10. lastPlayerTradeResult completed 이벤트를 기록한다.
11. room.pendingPlayerTrade를 제거한다.
12. room.revision += 1
13. room.updatedAt 갱신
14. playerTradeChosen ack 전송
15. 방 전체에 viewer별 state broadcast
```

실패 시:

```text
자원 부족이면 TRADE_RESOURCES_CHANGED 또는 NOT_ENOUGH_RESOURCES로 거부한다.
실패한 pending trade round를 유지할지 제거할지 정책을 정한다.
권장: choose 시점 자원 부족이면 pending trade를 제거하고 broadcast한다.
이유: 더 이상 성립할 수 없는 거래 요청을 계속 띄우면 반복 실패한다.
```

### 6. update 처리 순서

```text
1. update 공통 검증을 통과한다.
2. 요청자가 pending.requesterPlayerId인지 확인한다.
3. offer/request를 정규화한다.
4. 거래 요청자의 offer 자원이 충분한지 확인한다.
5. pending.offer/request를 새 값으로 교체한다.
6. pending.round += 1
7. pending.responses = {}
8. pending.status = "collecting"
9. room.revision += 1
10. room.updatedAt 갱신
11. playerTradeUpdated ack 전송
12. 방 전체에 viewer별 state broadcast
```

### 7. cancel 처리 순서

```text
1. cancel 공통 검증을 통과한다.
2. 요청자가 pending.requesterPlayerId인지 확인한다.
3. lastPlayerTradeResult canceled 이벤트를 기록한다.
4. room.pendingPlayerTrade를 제거한다.
5. room.revision += 1
6. room.updatedAt 갱신
7. playerTradeCanceled ack 전송
8. 방 전체에 viewer별 state broadcast
```

### 8. 다른 command와의 상호작용

pendingPlayerTrade가 있을 때 막을 command:

```text
endTurn
bankTrade
buildRoad
buildSettlement
buildCity
openPlayerTrade
향후 개발 카드 구매/사용
향후 7/강도 처리
```

허용할 command:

```text
respondPlayerTrade
choosePlayerTradeResponse
updatePlayerTradeOffer
cancelPlayerTrade
leaveRoom
reconnect
```

방 종료/연결 끊김:

```text
leaveRoom으로 방이 ended 되면 pending trade는 의미가 없으므로 제거하거나 ended state에서 무시한다.
WebSocket close로 connected=false가 되면 pending trade는 유지해도 되지만, 다른 진행 command는 ROOM_NOT_READY로 막는다.
응답자가 재접속하면 같은 pending trade 수락/거절/흥정 UI가 복구되어야 한다.
요청자가 재접속하면 조건 편집/응답 목록 UI가 복구되어야 한다.
```

## State View 설계

서버는 viewer별로 pending trade view를 다르게 내려야 한다.

거래 라운드가 확정/취소/무효화되면 pending trade는 제거되지만, 각 클라이언트가 결과 알림 모달을 띄울 수 있도록 짧은 결과 이벤트를 내려야 한다.

권장 위치:

```text
state.lastPlayerTradeResult
```

결과 이벤트 예:

```json
{
  "lastPlayerTradeResult": {
    "id": "trade_abc123",
    "type": "completed",
    "requesterPlayerId": "p_host",
    "requesterName": "Host",
    "partnerPlayerId": "p_guest",
    "partnerName": "Guest",
    "offer": { "forest": 2 },
    "request": { "field": 1 },
    "createdAt": 1760000005000
  }
}
```

취소 이벤트 예:

```json
{
  "lastPlayerTradeResult": {
    "id": "trade_abc123",
    "type": "canceled",
    "requesterPlayerId": "p_host",
    "requesterName": "Host",
    "reason": "requesterCanceled",
    "createdAt": 1760000005000
  }
}
```

주의:

```text
lastPlayerTradeResult는 UI 알림용 짧은 이벤트다.
영구 히스토리나 로그 저장 기능은 10단계 범위가 아니다.
같은 result id는 클라이언트에서 한 번만 모달로 표시한다.
```

거래 요청자 view:

```json
{
  "pendingPlayerTrade": {
    "id": "trade_abc123",
    "role": "requester",
    "round": 1,
    "requesterPlayerId": "p_host",
    "offer": { "forest": 1 },
    "request": { "field": 1 },
    "responses": [
      {
        "playerId": "p_guest_a",
        "name": "Guest A",
        "type": "accept"
      },
      {
        "playerId": "p_guest_b",
        "name": "Guest B",
        "type": "counter",
        "counterOffer": { "hill": 1 },
        "counterRequest": { "pasture": 1 }
      }
    ],
    "createdAt": 1760000000000
  }
}
```

응답자 view:

```json
{
  "pendingPlayerTrade": {
    "id": "trade_abc123",
    "role": "responder",
    "round": 1,
    "requesterPlayerId": "p_host",
    "requesterName": "Host",
    "offer": { "forest": 1 },
    "request": { "field": 1 },
    "myResponse": "accept",
    "createdAt": 1760000000000
  }
}
```

제3자 view:

```json
{
  "pendingPlayerTrade": {
    "id": "trade_abc123",
    "role": "observer",
    "requesterPlayerId": "p_host",
    "requesterName": "Host",
    "createdAt": 1760000000000
  }
}
```

제3자에게 상세 자원 정보를 숨기는 이유:

```text
offer/request 상세를 보면 양쪽 자원 보유 상황을 추론할 수 있다.
Catan에서는 자원 총량은 공개될 수 있어도 상세 종류는 비공개로 유지해야 한다.
개인용 게임이어도 기존 online private view 정책과 맞추는 것이 안전하다.
```

정책 선택:

```text
거래 요청자와 응답자에게는 현재 요청의 offer/request 상세를 보여준다.
거래 요청자에게는 각 유저의 응답 상태와 흥정 상세를 보여준다.
제3자에게는 "교환 협상 중" 정도만 보여준다.
거래 진행 중에는 제3자에게 상세 자원을 숨긴다.
거래 완료 후 결과 알림 모달에는 모든 유저에게 거래 내역을 표시한다.
공개 로그에는 상세 자원을 남기지 않거나 "거래가 완료되었습니다" 정도로 축약한다.
본인 로그에는 상세를 보여줘도 된다.
```

## 클라이언트 구현 계획

### 1. 온라인 플레이어 교환 버튼 활성화

현재 온라인 play phase에서 `playerTrade` 버튼이 비활성화되어 있다면 10단계에서 활성화한다.

활성 조건:

```text
onlineSession.state.status === "playing"
game.phase === "play"
내 차례
game.rolled === true
winner 없음
재접속 대기 중인 플레이어 없음
다른 pending action 없음
pendingPlayerTrade 없음
```

오프라인:

```text
기존 플레이어 교환 모달/로직을 유지한다.
오프라인 UI가 이번 단계에서 깨지지 않아야 한다.
```

### 2. 거래 요청자 모달

온라인에서 현재 차례 플레이어가 `플레이어 교환` 버튼을 누르면 모든 유저에게 플레이어 교환 모달이 열린다.

거래 요청자의 모달은 좌측 조건 편집 영역과 우측 응답 목록 영역으로 구성한다.

모달 구성:

```text
좌측: 내가 지불할 자원 수량 선택
좌측: 내가 받을 자원 수량 선택
좌측: 현재 거래 요청 요약
우측: 나머지 유저들의 응답 상태 목록
우측: 수락한 유저 선택 버튼
우측: 흥정 응답 내용 표시
재요청 버튼
거래 확정 버튼
취소 버튼
```

거래 요청 모달 규칙:

```text
offer는 내 보유 수량을 초과할 수 없다.
request는 상대의 상세 자원을 모르므로 상대 보유량 기준으로 제한하지 않는다.
offer/request가 모두 0이면 제안 버튼 disabled
open 또는 update 요청 중에는 버튼 disabled
서버 거부 시 모달 안 또는 로그에 오류 표시
```

자원 개수 조절 UI:

```text
offer와 request는 자원별로 0개 이상 선택할 수 있다.
각 자원에는 - 버튼, 현재 수량, + 버튼을 제공한다.
직접 숫자 입력을 제공해도 되지만, 0 이상의 정수만 허용한다.
offer의 + 버튼은 내가 가진 수량을 넘으면 disabled 처리한다.
request의 + 버튼은 상대 보유량을 모르므로 상한을 두지 않되, 과도한 숫자를 막기 위해 현실적인 상한을 둔다.
권장 request 상한: 19 또는 은행/총 자원 수 정책에 맞춘 최대값
수량이 0인 자원은 요약에서 생략한다.
offer 총합과 request 총합이 각각 1 이상이어야 요청/재요청 버튼이 활성화된다.
```

요약 표시 예:

```text
내가 줌: 나무 2, 벽돌 1
내가 받음: 양 1, 철 1
```

우측 응답 목록:

```text
응답 전: 대기 중
수락: 수락
거절: 거절
흥정: 흥정 요청
```

모든 유저가 응답한 뒤:

```text
수락한 유저가 있으면 그중 1명을 선택해 거래 확정 가능
수락한 유저가 없으면 조건을 바꿔 재요청하거나 취소
흥정 응답이 있으면 해당 조건을 참고해 좌측 조건을 수정하고 재요청 가능
```

재요청:

```text
좌측 offer/request를 수정한다.
재요청 버튼 -> updatePlayerTradeOffer command
성공 시 round가 증가하고 기존 응답은 초기화된다.
모든 응답자 모달에 새 조건이 표시된다.
```

취소:

```text
취소 버튼 -> cancelPlayerTrade command
성공 시 모든 유저의 거래 모달을 닫거나 취소 상태를 표시한다.
```

### 3. 응답자 수락/거절/흥정 UI

pendingPlayerTrade.role === "responder"이면 거래 요청자를 제외한 모든 유저에게 응답 UI를 보여준다.

권장:

```text
모달로 "Host가 거래를 요청했습니다" 표시
요청자가 주는 자원과 요청자가 받고 싶은 자원 표시
수락 버튼
거절 버튼
흥정 버튼
```

수락 버튼 상태:

```text
내 현재 resources 기준으로 request를 낼 수 없으면 수락 버튼 disabled 또는 서버 거부를 보여준다.
단, 최종 검증은 서버가 한다.
```

버튼 동작:

```text
수락 버튼 -> respondPlayerTrade response=accept
거절 버튼 -> respondPlayerTrade response=reject
흥정 버튼 -> 흥정 조건 입력 UI 표시 후 respondPlayerTrade response=counter
응답 후에도 모달은 닫지 않고 "응답 완료" 상태를 보여준다.
거래 요청자가 재요청하면 새 round 조건으로 다시 응답 가능 상태가 된다.
```

흥정 UI:

```text
내가 줄 수 있는 자원 수량 선택
내가 받고 싶은 자원 수량 선택
흥정 요약 표시
흥정 보내기 버튼
```

흥정 자원 개수 조절 UI:

```text
counterOffer와 counterRequest도 자원별 - / 수량 / + 조절 UI를 사용한다.
counterOffer의 + 버튼은 응답자 본인이 가진 수량을 넘으면 disabled 처리한다.
counterRequest는 요청자의 상세 자원을 모르므로 요청자 보유량 기준으로 제한하지 않는다.
counterOffer 총합과 counterRequest 총합이 각각 1 이상이어야 흥정 보내기 버튼이 활성화된다.
수량이 0인 자원은 흥정 요약에서 생략한다.
```

### 4. 제3자 UI

pendingPlayerTrade.role === "observer"인 플레이어에게는 상세 자원을 보여주지 않는다.

표시 예:

```text
Host와 Guest가 교환을 협상 중입니다.
```

제3자는 버튼 없이 보기만 한다.

주의:

```text
3~4인 게임에서는 거래 요청자를 제외한 모든 플레이어가 응답자이므로 observer가 없을 수 있다.
다만 향후 관전자나 비참여 상태가 생겨도 상세 자원은 숨기도록 view를 분리한다.
```

### 5. 새로고침/재접속 복구

```text
요청자 새로고침 후 재접속 -> 조건 편집/응답 목록 UI 복구
응답자 새로고침 후 재접속 -> 수락/거절/흥정 UI와 기존 응답 상태 복구
제3자 새로고침 후 재접속 -> 협상 중 표시 복구
pending 중 누군가 연결 끊김 -> 재접속 대기 모달 우선 표시
재접속 대기 해소 후 pending trade UI 복구
```

모달 우선순위:

```text
room-ended 모달
reconnect-waiting 모달
player-trade pending 모달
일반 action 모달
```

## 오류 코드

권장 오류 코드:

```text
TRADE_ALREADY_PENDING
TRADE_NOT_FOUND
TRADE_NOT_REQUESTER
TRADE_NOT_RESPONDER
TRADE_RESPONSE_REQUIRED
TRADE_RESPONSE_NOT_ACCEPT
TRADE_ROUND_CHANGED
INVALID_TRADE_RESOURCES
NOT_ENOUGH_RESOURCES
TRADE_RESOURCES_CHANGED
ROOM_NOT_READY
ROOM_ENDED
ROLL_REQUIRED
NOT_YOUR_TURN
INVALID_ACTION
```

사용자 메시지 예:

```text
TRADE_ALREADY_PENDING: 이미 진행 중인 교환 제안이 있습니다.
TRADE_NOT_REQUESTER: 이 거래 요청을 수정하거나 확정할 권한이 없습니다.
TRADE_NOT_RESPONDER: 이 거래 요청에 응답할 권한이 없습니다.
TRADE_RESPONSE_REQUIRED: 아직 모든 유저의 응답을 기다리는 중입니다.
TRADE_RESPONSE_NOT_ACCEPT: 수락한 유저만 거래 대상으로 선택할 수 있습니다.
TRADE_ROUND_CHANGED: 거래 요청이 갱신되었습니다. 새 조건에 다시 응답하세요.
INVALID_TRADE_RESOURCES: 교환 자원 구성이 올바르지 않습니다.
TRADE_RESOURCES_CHANGED: 자원 상태가 바뀌어 교환할 수 없습니다.
```

## 테스트 계획

### 자동 검증

필수:

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
play phase fixture 구성
현재 차례 플레이어가 openPlayerTrade 성공
주사위 전 openPlayerTrade 거부
차례가 아닌 플레이어 openPlayerTrade 거부
offer/request가 모두 비어 있으면 거부
음수/소수/알 수 없는 resource key 거부
거래 요청자의 offer 자원 부족 시 open 거부
pending trade가 이미 있으면 추가 open 거부
응답자가 respondPlayerTrade accept 성공
응답자가 respondPlayerTrade reject 성공
응답자가 respondPlayerTrade counter 성공
거래 요청자가 respond 시도 시 거부
응답자가 cancel/update/choose 시도 시 거부
모든 응답자 응답 후 요청자 view에 응답 목록 표시
수락 응답이 있는 유저를 choosePlayerTradeResponse로 선택 성공
reject/counter 응답 유저를 choose 시도하면 거부
요청자가 updatePlayerTradeOffer 성공
update 후 round 증가 및 responses 초기화
이전 round 응답으로 choose 시도 시 거부
거래 요청자가 cancelPlayerTrade 성공
choose 시점 요청자 자원 부족이면 거부 및 pending 제거
choose 시점 선택된 응답자 자원 부족이면 거부 및 pending 제거
성공 후 양쪽 resourceCount와 본인 resources 갱신
성공 후 제3자에게 offer/request 상세 미노출
pending 중 endTurn/build/bankTrade/open 재시도 거부
connected=false 플레이어가 있으면 open/respond/choose/update/cancel 정책대로 처리
ended room에서 모든 player trade command 거부
새로고침/재접속 후 pendingPlayerTrade view 복구 가능 여부 확인
모든 응답자가 응답하기 전 choosePlayerTradeResponse 거부
round가 맞지 않는 respond/choose/update/cancel 거부
```

### 수동 검증

권장 환경:

```text
호스트 PC Chrome
같은 PC 시크릿 Chrome 또는 다른 브라우저
MacBook/iPhone Chrome
접속 주소는 이전 테스트에서 성공한 IP 사용
Safari는 보조 브라우저로만 취급
```

수동 시나리오:

```text
1. 서버를 완전히 재시작한다.
2. 브라우저를 강력 새로고침한다.
3. 새 방을 만들고 3명 이상 입장한다.
4. 게임 시작 후 초기 배치를 완료한다.
5. 현재 차례 플레이어가 주사위를 굴린다.
6. 플레이어 교환 버튼을 누른다.
7. 요청자 모달 좌측에서 줄 자원과 받을 자원을 선택해 요청을 연다.
8. 모든 유저에게 플레이어 교환 모달이 뜨는지 확인한다.
9. 요청자 모달 우측에 나머지 유저들의 응답 상태가 표시되는지 확인한다.
10. 응답자 모달에는 거래 요청 내역과 수락/거절/흥정 버튼이 보이는지 확인한다.
11. 한 유저는 수락, 한 유저는 거절, 한 유저는 흥정으로 응답한다.
12. 요청자 우측 응답 목록에 각 응답이 반영되는지 확인한다.
13. 모든 유저 응답 후 요청자가 수락한 유저를 선택해 거래를 확정한다.
14. 확정 후 선택된 양쪽 자원이 갱신되고 pending UI가 사라지는지 확인한다.
14-1. 모든 유저에게 거래 완료 알림 모달이 뜨고 거래 내역이 표시되는지 확인한다.
15. 다시 거래 요청을 열고 흥정 응답을 받은 뒤 조건을 변경해 재요청한다.
16. 재요청 후 모든 응답 상태가 초기화되고 새 조건이 모든 응답자에게 보이는지 확인한다.
17. 요청자가 취소하면 모든 유저의 거래 모달이 닫히거나 취소 상태가 표시되는지 확인한다.
17-1. 모든 유저에게 거래 취소 알림 모달이 뜨는지 확인한다.
18. pending 중 턴 종료/건설/은행 교환이 막히는지 확인한다.
19. 응답자가 새로고침해도 수락/거절/흥정 UI가 복구되는지 확인한다.
20. 요청자가 새로고침해도 조건 편집/응답 목록 UI가 복구되는지 확인한다.
21. 참가자 한 명의 탭을 닫으면 재접속 대기 모달이 우선하는지 확인한다.
22. 재접속 후 pending trade UI가 다시 보이는지 확인한다.
23. 방 나가기/ended 이후 player trade command가 막히는지 확인한다.
24. 오프라인 플레이어 교환이 기존처럼 동작하는지 확인한다.
```

## 추가 보강 사항

### 1. 모든 유저 응답 조건

10단계의 기본 UX는 “모든 응답자가 응답한 뒤 요청자가 선택”이다.

정책:

```text
응답 대상은 거래 요청자를 제외한 left=false 플레이어 전원이다.
connected=false 플레이어가 있으면 기존 5-2 정책에 따라 재접속 대기 모달이 우선한다.
재접속 대기 중에는 거래 선택/재요청/취소 외 게임 진행을 막는다.
요청자는 모든 응답자가 응답하기 전에도 거래를 취소할 수 있다.
요청자는 모든 응답자가 응답하기 전에도 조건을 수정해 재요청할 수 있다.
요청자는 모든 응답자가 응답하기 전에는 거래 확정을 할 수 없다.
```

예외를 두지 않는 이유:

```text
한 명이 아직 응답하지 않았는데 거래가 확정되면 나머지 유저 입장에서는 모달이 갑자기 닫혀 혼란스럽다.
친구끼리 하는 소규모 게임에서는 모든 유저 응답을 기다리는 편이 UX가 명확하다.
```

### 2. 흥정 응답의 의미

흥정은 자동 거래가 아니라 “응답자가 원하는 거래조건을 직접 지정하는 조건 변경 요청”이다.

정책:

```text
흥정 응답은 choosePlayerTradeResponse로 바로 선택할 수 없다.
요청자는 흥정 내용을 보고 offer/request를 수정해 updatePlayerTradeOffer로 재요청한다.
재요청이 발생하면 기존 수락/거절/흥정 응답은 모두 초기화된다.
흥정 응답자에게도 새 round에서는 다시 수락/거절/흥정 중 하나로 응답하게 한다.
```

흥정 데이터:

```text
counterOffer: 흥정 응답자가 주고 싶은 자원과 개수
counterRequest: 흥정 응답자가 받고 싶은 자원과 개수
```

주의:

```text
counterOffer/counterRequest는 요청자의 원래 offer/request와 방향이 반대일 수 있으므로 UI 문구를 명확히 한다.
예: "Guest가 제안: Guest가 양 1개를 주고, 나무 1개를 받고 싶어합니다."
```

흥정 입력 UI 문구:

```text
내가 줄 자원
내가 받을 자원
흥정 보내기
```

금지:

```text
흥정 UI에서 요청자의 원래 "내가 줌/내가 받음" 관점을 그대로 쓰지 않는다.
응답자 화면에서는 반드시 응답자 기준 "내가 줄 자원/내가 받을 자원"으로 표시한다.
```

### 3. 응답 정보 노출 범위

요청자:

```text
모든 응답자의 응답 상태를 볼 수 있다.
수락/거절/흥정 여부를 볼 수 있다.
흥정 응답의 counterOffer/counterRequest 상세를 볼 수 있다.
```

응답자:

```text
현재 요청의 offer/request를 볼 수 있다.
자신의 응답 상태를 볼 수 있다.
다른 응답자의 상세 응답은 보지 않는다.
다른 응답자가 수락했는지 거절했는지 여부도 기본적으로 숨긴다.
```

제3자 또는 관전자:

```text
거래 요청이 진행 중이라는 사실만 본다.
offer/request와 응답 상세는 보지 않는다.
```

이유:

```text
응답자끼리 서로의 응답을 보면 자원 보유 상황이나 협상 의도가 과도하게 노출될 수 있다.
요청자는 최종 선택을 해야 하므로 응답 상세를 볼 필요가 있다.
```

### 4. round와 중복 응답 처리

모든 player trade command에는 가능하면 `tradeId`와 `round`를 함께 보낸다.

정책:

```text
서버 pendingPlayerTrade.round와 payload.round가 다르면 TRADE_ROUND_CHANGED로 거부한다.
같은 round에서 같은 응답자가 다시 respond하면 마지막 응답으로 덮어쓴다.
단, UI에서는 응답 완료 후 버튼을 비활성화해 반복 응답을 줄인다.
updatePlayerTradeOffer 성공 시 round를 증가시키고 responses를 비운다.
choosePlayerTradeResponse는 현재 round의 accept 응답만 대상으로 한다.
```

### 5. 요청자 자원 잠금 여부

10단계에서는 거래 요청을 열어도 요청자의 offer 자원을 미리 잠그거나 차감하지 않는다.

정책:

```text
open/update 시점에 offer 자원 보유 여부를 확인한다.
choose 시점에 다시 offer 자원 보유 여부를 확인한다.
pending 중에는 bankTrade/build/endTurn을 막아 자원 상태 변화 가능성을 줄인다.
향후 개발 카드/강도 단계가 추가되면 pending 중 해당 행동도 막는다.
```

이유:

```text
자원을 미리 잠그면 취소/재요청/방 종료 처리에서 복구 로직이 복잡해진다.
현재는 pending 중 다른 진행 command를 막는 방식이 더 단순하다.
```

### 6. 수락한 응답자의 자원 부족

응답자가 수락한 뒤 자원 상태가 바뀔 가능성은 낮지만, 서버는 최종 선택 시 다시 검증해야 한다.

정책:

```text
choose 시점에 선택된 응답자의 request 자원이 부족하면 TRADE_RESOURCES_CHANGED로 거부한다.
이 경우 pending trade round는 제거하는 것을 권장한다.
제거 후 모든 유저에게 "자원 상태가 바뀌어 거래가 취소되었습니다" 상태를 보여준다.
```

### 7. 모달 종료 방식

거래 확정/취소/무효화 후 모달 처리:

```text
기존 거래 진행 모달을 닫는다.
각 유저에게 결과 알림 모달을 새로 띄운다.
거래 완료 시 거래 내역을 표시한다.
거래 취소 시 거래가 취소되었다고 표시한다.
거래 무효화 시 자원 상태가 바뀌어 거래가 취소되었다고 표시한다.
```

거래 완료 알림 모달:

```text
제목: 거래 완료
내용: Host와 Guest의 거래가 완료되었습니다.
거래 내역: Host 제공 나무 2 / Guest 제공 밭 1
버튼: 확인
```

요청자/선택된 응답자에게는 본인이 주고받은 관점도 함께 보여줄 수 있다.

```text
내가 줌: 나무 2
내가 받음: 밭 1
```

선택되지 않은 응답자:

```text
제목: 거래 완료
내용: Host가 다른 유저와 거래를 완료했습니다.
거래 내역은 공개 정책에 따라 요약만 보여준다.
권장: 선택되지 않은 응답자에게도 거래 당사자와 교환 자원 요약을 보여준다.
```

거래 취소 알림 모달:

```text
제목: 거래 취소
내용: Host의 거래 요청이 취소되었습니다.
버튼: 확인
```

거래 무효화 알림 모달:

```text
제목: 거래 취소
내용: 자원 상태가 바뀌어 거래가 완료되지 않았습니다.
버튼: 확인
```

주의:

```text
broadcast state를 받은 즉시 무조건 hideModal을 호출하면 다른 중요한 모달까지 닫을 수 있다.
modalKind를 player-trade로 구분하고 해당 모달만 닫는다.
결과 알림 모달은 room-ended/reconnect-waiting보다 우선하지 않는다.
room-ended나 reconnect-waiting 상태라면 결과 알림은 생략하거나 로그로만 남겨도 된다.
```

### 8. UI 레이아웃 보강

요청자 모달:

```text
데스크톱: 좌측 조건 편집, 우측 응답 목록 2열
모바일: 조건 편집 위, 응답 목록 아래의 1열
응답 목록은 플레이어 이름, 응답 상태, 선택 버튼을 한 줄에 읽기 쉽게 표시
흥정 응답은 접거나 펼칠 수 있게 해도 된다.
자원 수량 조절 버튼은 고정 크기로 만들어 수량 변화 때 레이아웃이 흔들리지 않게 한다.
자원 이름, 보유량, 선택 수량이 모바일에서 잘리지 않아야 한다.
```

응답자 모달:

```text
요청 조건 요약을 상단에 크게 표시
수락/거절/흥정 버튼은 하단에 고정
흥정 입력 UI는 버튼 클릭 후 같은 모달 안에서 확장
자원 버튼은 은행/항구 교환 모달과 같은 스타일을 재사용한다.
흥정 입력의 자원 수량 조절은 요청자 모달과 동일한 컴포넌트를 재사용한다.
```

### 9. 오프라인 모드와의 관계

```text
이번 온라인 전체 응답형 거래 모달은 온라인 전용으로 구현한다.
오프라인 플레이어 교환은 기존 로컬 방식 유지가 기본이다.
오프라인까지 동일한 전체 응답형 UX로 바꾸려면 별도 단계로 분리한다.
```

이유:

```text
오프라인은 한 화면에서 모든 플레이어를 조작하므로 온라인처럼 각 유저에게 모달을 띄우는 개념이 맞지 않는다.
10단계에서는 온라인 기능 완성을 우선한다.
```

### 10. 구현 범위 조절

10단계가 커질 수 있으므로 최소 구현 기준을 명확히 한다.

최소 구현:

```text
openPlayerTrade
respondPlayerTrade accept/reject/counter
choosePlayerTradeResponse
updatePlayerTradeOffer
cancelPlayerTrade
요청자/응답자 모달
요청자 offer/request 자원별 개수 조절
응답자 counterOffer/counterRequest 자원별 개수 조절
흥정은 응답자가 원하는 거래조건을 직접 지정하는 방식으로 처리
round 초기화
최종 선택 시 자원 이동
private view 보호
WebSocket 자동 테스트
```

후순위로 미뤄도 되는 것:

```text
응답 히스토리 표시
흥정 메시지 자유 입력
거래 타이머
애니메이션
복잡한 알림 사운드
```

## 완료 기준

```text
온라인 플레이어 간 교환이 서버 pending state로 관리된다.
현재 차례 플레이어만 전체 거래 요청을 열 수 있다.
거래 요청자가 플레이어 교환 버튼을 누르면 모든 유저에게 거래 모달이 뜬다.
거래 요청자는 좌측에서 지불/요청 자원의 종류와 개수를 조절하고 우측에서 응답 목록을 볼 수 있다.
나머지 유저는 수락/거절/흥정으로 응답할 수 있다.
흥정 응답자는 자신이 원하는 거래조건으로 counterOffer/counterRequest 자원의 종류와 개수를 조절할 수 있다.
모든 유저 응답 후 요청자는 수락한 유저 중 1명을 선택해 거래를 확정할 수 있다.
요청자는 조건을 수정해 재요청하거나 거래를 취소할 수 있다.
최종 선택 시점에 양쪽 자원을 다시 검증한다.
교환 확정 시 양쪽 자원이 서버 기준으로 이동한다.
거래 완료 시 각 유저에게 거래 완료 알림 모달이 뜨고 거래 내역이 표시된다.
거래 취소 시 각 유저에게 거래 취소 알림 모달이 뜬다.
거래 무효화 시 각 유저에게 거래가 완료되지 않았다는 알림 모달이 뜬다.
거절/흥정/취소/실패 시 자원이 이동하지 않는다.
pending trade 중 다른 게임 진행 command가 막힌다.
요청자/응답자/제3자의 view가 역할별로 다르게 내려간다.
제3자에게 교환 상세 자원이 노출되지 않는다.
새로고침/재접속 후 pending trade UI가 복구된다.
오프라인 플레이어 교환은 기존처럼 유지된다.
자동 테스트와 최소 3브라우저 수동 테스트 결과가 보고서에 기록된다.
```

## 위험 요소와 대응

```text
pending 중 턴 종료가 가능하면 교환 상태가 꼬일 수 있다.
대응: pendingPlayerTrade가 있으면 endTurn을 막고 취소/응답/확정을 먼저 요구한다.

최종 선택 시점에 자원이 바뀌면 잘못된 교환이 성사될 수 있다.
대응: choose 처리 직전에 양쪽 자원을 다시 검증한다.

제3자에게 교환 상세가 노출될 수 있다.
대응: pendingPlayerTrade view를 viewer role에 따라 다르게 만든다.

재접속 대기 모달과 교환 모달이 충돌할 수 있다.
대응: 모달 우선순위를 room-ended > reconnect-waiting > player-trade pending으로 둔다.

오프라인 플레이어 교환 UI가 온라인 분기 때문에 깨질 수 있다.
대응: 오프라인 경로는 기존 로컬 함수와 모달을 유지하고 수동 검증한다.

동시 클릭으로 respond/choose/update/cancel이 중복 처리될 수 있다.
대응: 서버는 tradeId 존재 여부와 room.pendingPlayerTrade 일치 여부를 최종 기준으로 처리한다.

재요청 중 이전 round 응답이 늦게 도착할 수 있다.
대응: command에 tradeId와 필요하면 round를 포함해 현재 round와 맞지 않으면 TRADE_ROUND_CHANGED로 거부한다.
```

## 다음 단계 연결

10단계 완료 후에는 11단계 개발 카드로 넘어간다.

```text
10단계: 플레이어 간 교환
11단계: 개발 카드
12단계: 7/강도/pending action
13단계: 전체 회귀 테스트 및 안정화
```
