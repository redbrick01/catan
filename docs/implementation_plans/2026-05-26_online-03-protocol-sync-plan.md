# 온라인 03 프로토콜/동기화 구현 계획

## 목표

브라우저와 서버가 주고받는 메시지 형식을 정하고, 모든 브라우저가 같은 게임 상태를 보도록 동기화 방식을 만든다.

## 핵심 원칙

```text
클라이언트는 상태를 직접 확정하지 않는다.
클라이언트는 명령을 보낸다.
서버는 검증하고 상태를 바꾼다.
서버는 revision이 붙은 최신 상태를 broadcast한다.
클라이언트는 최신 revision만 렌더링한다.
```

## 메시지 공통 형식

클라이언트 -> 서버 메시지는 하나의 형식으로 통일한다. 방 생성, 참가, 게임 시작, 주사위, 건설 모두 `type: "command"`와 `payload.name`을 사용한다.

클라이언트 -> 서버:

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "rollDice"
  }
}
```

방 생성처럼 아직 roomId/playerId가 없는 명령은 해당 값을 생략한다.

```json
{
  "type": "command",
  "requestId": "r0",
  "payload": {
    "name": "createRoom",
    "playerName": "민수"
  }
}
```

서버 -> 클라이언트:

```json
{
  "type": "state",
  "roomId": "abc123",
  "revision": 12,
  "you": {
    "playerId": "p_1",
    "seatIndex": 0,
    "isHost": true
  },
  "state": {}
}
```

오류:

```json
{
  "type": "error",
  "requestId": "r1",
  "code": "NOT_YOUR_TURN",
  "message": "현재 차례가 아닙니다."
}
```

## requestId

목적:

```text
중복 클릭 방지
오류가 어떤 요청에 대한 것인지 식별
느린 응답 처리
```

클라이언트 처리:

```text
명령 전송 전 requestId 생성
pendingRequestIds에 추가
같은 버튼 잠금
state 또는 error 수신 후 pendingRequestIds에서 제거
```

서버 처리:

```text
requestId가 없어도 서버가 죽지 않게 처리
같은 requestId가 반복되면 중복 처리하지 않는 방향을 목표로 함
초기 MVP에서는 클라이언트 버튼 잠금만으로도 시작 가능
```

## revision

서버 room에 revision을 둔다.

```js
room.revision += 1;
```

증가 시점:

```text
대기실 참가자 변경
게임 시작
게임 상태 변경
연결 상태 변경
```

클라이언트 처리:

```text
받은 revision이 현재 revision보다 작으면 무시
같거나 크면 반영
```

## 메시지 타입

대기실 명령:

```text
createRoom
joinRoom
reconnect
leaveRoom
startGame
```

게임 MVP:

```text
buildInitialSettlement
buildInitialRoad
rollDice
endTurn
```

게임 전체:

```text
buildRoad
buildSettlement
buildCity
buyDevCard
playDevCard
bankTrade
proposePlayerTrade
acceptPlayerTrade
rejectPlayerTrade
discardForSeven
moveRobber
chooseRobberVictim
chooseYearOfPlentyResources
chooseMonopolyResource
placeFreeRoadFromRoadBuilding
```

서버 이벤트:

```text
state
error
serverNotice
```

`lobbyState`와 `gameStarted`를 별도 이벤트로 나누지 않고, 초기 구현에서는 `state` 하나로 통합한다.

```json
{
  "type": "state",
  "roomId": "abc123",
  "revision": 3,
  "state": {
    "status": "lobby",
    "players": []
  }
}
```

```json
{
  "type": "state",
  "roomId": "abc123",
  "revision": 4,
  "state": {
    "status": "playing",
    "match": {}
  }
}
```

이렇게 하면 클라이언트는 `state.status`만 보고 대기실 또는 게임 화면을 렌더링하면 된다.

## MVP 명령 payload

주사위:

```json
{
  "name": "rollDice"
}
```

턴 종료:

```json
{
  "name": "endTurn"
}
```

게임 시작:

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "startGame"
  }
}
```

초기 마을 배치:

```json
{
  "name": "buildInitialSettlement",
  "vertexId": 8
}
```

초기 도로 배치:

```json
{
  "name": "buildInitialRoad",
  "edgeId": 12
}
```

## 이후 명령 payload

도로 건설:

```json
{
  "name": "buildRoad",
  "edgeId": 12
}
```

마을 건설:

```json
{
  "name": "buildSettlement",
  "vertexId": 8
}
```

은행 교환:

```json
{
  "name": "bankTrade",
  "give": "forest",
  "get": "field"
}
```

플레이어 교환:

```json
{
  "name": "proposePlayerTrade",
  "targetPlayerId": "p_2",
  "give": {
    "forest": 1
  },
  "receive": {
    "field": 1
  }
}
```

## broadcast 정책

초기 MVP에서는 매 명령 후 플레이어별 전체 view state를 다시 보낸다.

장점:

```text
구현이 단순함
상태 불일치 복구가 쉬움
개인용 소규모 방에서는 데이터량 부담이 작음
```

단점:

```text
상태가 커지면 비효율적
```

이 프로젝트에서는 3~4명 개인용 방이므로 전체 state broadcast로 충분하다.

## 서버 검증

공통 검증:

```text
roomId 존재
playerId 존재
playerToken 일치
방 status 확인
payload 형식 확인
권한 확인
```

게임 명령 검증:

```text
현재 차례인가
이미 주사위를 굴렸는가
아직 주사위를 굴리지 않았는가
pending action이 있는가
게임이 끝났는가
```

## 오류 코드

초기 오류 코드:

```text
BAD_MESSAGE
ROOM_NOT_FOUND
ROOM_FULL
INVALID_TOKEN
NOT_HOST
NOT_YOUR_TURN
GAME_NOT_STARTED
GAME_ALREADY_STARTED
INVALID_ACTION
SERVER_ERROR
```

UI는 오류를 짧게 표시한다.

예:

```text
현재 차례가 아닙니다.
방을 찾을 수 없습니다.
연결이 끊겼습니다. 다시 연결 중입니다.
```

## 완료 기준

```text
createRoom/joinRoom/startGame/buildInitialSettlement/buildInitialRoad/rollDice/endTurn 메시지 형식이 정해짐
모든 클라이언트 요청이 type=command + payload.name 형식으로 통일됨
대기실과 게임 상태가 state.status로 구분됨
서버가 revision을 증가시킴
클라이언트가 최신 state만 렌더링함
명령 전송 중 버튼 중복 클릭이 막힘
오류 메시지가 UI에 표시됨
```

## 수동 테스트

```text
1. 두 브라우저로 같은 방 접속
2. 방장이 게임 시작
3. 초기 배치 명령이 양쪽에 동일하게 반영되는지 확인
4. 현재 차례 브라우저에서 주사위 클릭
5. 두 브라우저에 같은 주사위 결과 표시
6. 같은 버튼 빠르게 여러 번 클릭
7. 서버 상태가 한 번만 변경되는지 확인
8. 차례가 아닌 브라우저에서 명령 시도
9. 오류가 표시되고 상태가 바뀌지 않는지 확인
```
## 2026-05-26 작업 전 갱신

이번 작업은 온라인 모드 3단계 프로토콜/동기화 구조 정리만 구현한다.

변경 대상:

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-03-protocol-sync-plan.md
```

구현 범위:

```text
서버 요청 처리를 type: "command" + payload.name 기준으로 정리한다.
state 메시지는 type, roomId, revision, state 형식을 일관되게 유지한다.
state.status = "lobby"와 top-level revision을 기준으로 클라이언트가 최신 상태만 반영한다.
requestId pending request에 timeout과 정리 로직을 추가한다.
error 응답은 top-level code/message를 포함하고 UI에서 사용자용 문구로 표시한다.
leaveRoom 정책은 2단계에서 결정한 "방에서 제거"를 유지한다.
localStorage에 roomId/playerId/playerToken/playerName identity를 저장한다.
reconnect command를 최소 구현해 새로고침 후 같은 플레이어로 대기실에 복귀할 수 있게 한다.
중복 또는 오래된 state 수신은 클라이언트에서 무시한다.
```

구현하지 않을 범위:

```text
게임 시작
초기 배치
주사위
게임 엔진 서버 이전
게임 명령 검증
비공개 상태 필터링
```

실제 접속 기준 반영:

```text
docs/test_plans/2026-05-26_online-device-connection-test-result.md 기준으로 실제 접속 권장 조합은 http://100.88.125.81:4173/ + Chrome이다.
100.88.125.81 주소와 Chrome 기준을 테스트 계획/최종 보고서에 반영한다.
```

검증 방법:

```text
node --check server.js
node --check script.js
WebSocket command 형식 createRoom/joinRoom/leaveRoom/reconnect 테스트
legacy type=createRoom 요청이 BAD_MESSAGE로 거부되는지 확인
error 응답에 top-level code/message가 포함되는지 확인
중복/오래된 revision state가 클라이언트에서 무시되는지 확인
localStorage identity 저장과 reconnect 복귀를 브라우저에서 확인
```

## 2026-05-26 리뷰 피드백 반영 계획

최종 보고서 하단 리뷰 피드백에 따라 다음 보완을 3단계 마무리로 반영한다.

변경 대상:

```text
server.js
script.js
docs/test_plans/2026-05-26_online-03-protocol-sync-test-plan.md
docs/final_reports/2026-05-26_online-03-protocol-sync-final-report.md
```

보완 범위:

```text
WebSocket 진단 로그는 DEBUG_ONLINE=1일 때만 출력한다.
requestId timeout 이후 늦게 도착한 roomCreated/roomJoined/reconnected ack는 상태에 반영하지 않는다.
pending request가 남아 있는 ack만 상태 적용 및 resolve 대상으로 삼는다.
state broadcast는 requestId와 무관하게 revision 기준으로 처리한다.
대기실 leaveRoom 정책과 게임 중 이탈 정책을 문서에서 분리한다.
reconnect 추가 후 실제 Chrome 재검증 필요 항목을 유지한다.
```

검증 방법:

```text
node --check server.js
node --check script.js
DEBUG_ONLINE 미설정 시 upgrade/ws 로그 미출력 확인
DEBUG_ONLINE=1 설정 시 upgrade/ws 로그 출력 확인
late ack 정책을 코드 경로와 자동 WebSocket 테스트로 확인
```
