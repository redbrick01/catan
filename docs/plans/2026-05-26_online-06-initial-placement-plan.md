# 온라인 06 초기 배치 구현 계획

작성일: 2026-05-26

## 목적

온라인 모드에서 초기 마을/도로 배치를 서버 권위 방식으로 구현한다.

4~5-2단계까지 완료되면 방 생성, 참가, 게임 시작, 비공개 상태 필터링, 재접속, 방 나가기/종료 정책이 준비된다. 6단계의 목표는 각 플레이어가 자기 차례에만 초기 마을과 도로를 놓고, 그 결과가 모든 브라우저에 동일하게 동기화되는 상태를 만드는 것이다.

## 5-2 이후 공통 전제

모든 온라인 게임 command는 아래 조건을 먼저 검증한다.

```text
room이 존재해야 한다.
room.status === "playing"이어야 한다.
room.status === "ended"이면 ROOM_ENDED로 거절한다.
요청 playerId/playerToken 인증에 성공해야 한다.
요청 플레이어가 left 상태이면 PLAYER_LEFT로 거절한다.
요청 플레이어가 connected=false이면 PLAYER_DISCONNECTED 또는 INVALID_TOKEN으로 거절한다.
room 안에 connected=false이고 left=false인 다른 플레이어가 있으면 게임 진행 command를 보류/거절한다.
```

권장:

```text
재접속 대기 중에는 초기 배치 command를 받지 않는다.
모든 참가자가 connected=true일 때만 초기 배치를 진행한다.
```

## 범위

포함:

```text
placeInitialSettlement command
placeInitialRoad command
setup1/setup2 순서 진행
초기 배치 차례 검증
초기 마을 위치 검증
초기 도로 위치 검증
두 번째 초기 마을의 시작 자원 지급
초기 배치 완료 후 play phase 진입
모든 클라이언트에 viewer별 matchState broadcast
```

제외:

```text
주사위 굴림
일반 건설
은행/항구 교환
플레이어 간 교환
개발 카드
7/강도 처리
온라인 게임 재시작
```

## 서버 상태 모델

`matchState.game`에서 사용하는 필드:

```text
phase: "setup1" | "setup2" | "play"
setupIndex: number
pendingSettlement: vertexId | null
active: number
round: number
rolled: boolean
```

초기 배치 중 의미:

```text
setupIndex: 현재 배치할 seat index
pendingSettlement: 이번 setup step에서 방금 놓은 마을 vertexId. 도로를 놓기 전까지 유지
```

## command 규격

### placeInitialSettlement

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "placeInitialSettlement",
    "vertexId": 12
  }
}
```

### placeInitialRoad

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "placeInitialRoad",
    "edgeId": 31
  }
}
```

## 서버 검증

### 공통 검증

```text
공통 온라인 command 검증 통과
matchState 존재
game.phase가 setup1 또는 setup2
요청자가 현재 setupIndex의 온라인 플레이어
pending action 없음
winner 없음
payload id가 정수
```

현재 setup 플레이어 판정:

```text
const seat = game.setupIndex
const seatPlayer = matchState.game.players[seat]
seatPlayer.onlinePlayerId === request player.id
```

### 초기 마을 검증

```text
vertexId가 유효하다.
vertex.owner가 null 또는 undefined이다.
인접 vertex에 다른 마을/도시가 없어 거리 규칙을 만족한다.
game.pendingSettlement가 null이다.
현재 플레이어의 settlements 수량이 1개 이상 남아 있다.
```

성공 처리:

```text
vertex.owner = seat index
vertex.city = false
player.settlements -= 1
game.pendingSettlement = vertexId
```

주의:

```text
초기 마을은 자원 비용을 차감하지 않는다.
```

### 초기 도로 검증

```text
edgeId가 유효하다.
edge.owner가 null 또는 undefined이다.
game.pendingSettlement가 존재한다.
edge가 pendingSettlement vertex와 연결되어 있다.
현재 플레이어의 roads 수량이 1개 이상 남아 있다.
```

성공 처리:

```text
edge.owner = seat index
player.roads -= 1
setup2라면 pendingSettlement 주변 시작 자원 지급
game.pendingSettlement = null
다음 setupIndex/phase로 진행
```

주의:

```text
초기 도로는 자원 비용을 차감하지 않는다.
초기 도로는 반드시 방금 놓은 마을과 연결되어야 한다.
```

## setup 순서

3인:

```text
setup1: 0 -> 1 -> 2
setup2: 2 -> 1 -> 0
play 진입
```

4인:

```text
setup1: 0 -> 1 -> 2 -> 3
setup2: 3 -> 2 -> 1 -> 0
play 진입
```

진행 함수 권장:

```text
advanceSetupTurn(matchState)
```

규칙:

```text
setup1에서 마지막 seat까지 완료하면 phase=setup2, setupIndex=마지막 seat
setup2에서 0번 seat까지 완료하면 phase=play, setupIndex=0, active=0, rolled=false
```

## 시작 자원 지급

지급 시점:

```text
setup2에서 마을+도로 배치가 모두 완료된 직후
```

지급 대상:

```text
pendingSettlement 주변 타일
desert 제외
타일 type이 resource type인 경우 해당 자원 1장 지급
```

은행 처리:

```text
bank에 자원이 있으면 bank -= 1, player.resources += 1
bank에 자원이 없으면 지급하지 않는다.
bank는 음수가 되면 안 된다.
```

비공개 상태:

```text
지급된 자원 상세는 본인 view에만 보인다.
상대 view에는 resourceCount만 증가한다.
```

## state broadcast

성공 처리 후:

```text
room.revision += 1
room.updatedAt = Date.now()
broadcastState(room)
```

응답:

```text
요청자에게 requestId 포함 ack 전송
모든 소켓에 viewer별 state 전송
```

권장 ack type:

```text
initialSettlementPlaced
initialRoadPlaced
```

또는 기존 패턴을 단순화하려면:

```text
type: "commandAccepted"
```

## 클라이언트 구현 계획

### 온라인 초기 배치 허용 조건

온라인 상태에서도 아래 조건이면 마을/도로 클릭을 서버 command로 허용한다.

```text
onlineSession.enabled === true
onlineSession.state.status === "playing"
game.phase가 setup1 또는 setup2
game.viewerSeatIndex === game.setupIndex
재접속 대기 중인 다른 player 없음
ended 상태 아님
```

### 클릭 처리

온라인 상태:

```text
마을 위치 클릭 -> placeInitialSettlement command
도로 위치 클릭 -> placeInitialRoad command
```

금지:

```text
온라인에서 buildSettlement(), buildRoad()로 로컬 상태를 직접 변경
```

### UI 표시

필수:

```text
현재 초기 배치 차례 플레이어 표시
내 차례일 때만 해당 위치 클릭 가능
마을을 놓기 전에는 도로 클릭 불가
마을을 놓은 뒤에는 해당 마을과 연결된 도로만 클릭 가능
서버 거절 메시지 표시
재접속 대기 모달이 떠 있으면 배치 조작 불가
ended 모달이 떠 있으면 배치 조작 불가
```

권장 로그:

```text
민수: 초기 마을 배치
민수: 초기 도로 배치
지우 차례입니다.
초기 배치가 완료되었습니다. 주사위를 굴려 게임을 시작하세요.
```

## 테스트 계획

### 자동 테스트

```text
node --check server.js
node --check script.js
WebSocket 3클라이언트 create/join/start
현재 setup 차례 플레이어 placeInitialSettlement 성공
차례가 아닌 플레이어 placeInitialSettlement 거절
유효하지 않은 vertexId 거절
이미 점유된 vertex 거절
거리 규칙 위반 마을 거절
마을 없이 placeInitialRoad 거절
유효하지 않은 edgeId 거절
이미 점유된 edge 거절
pendingSettlement와 연결되지 않은 road 거절
정상 초기 배치 후 모든 클라이언트 vertices/edges 동일
setup1/setup2 순서 검증
setup2 완료 후 play phase 진입 검증
setup2 시작 자원 지급 검증
상대 view에 resources 상세가 노출되지 않는지 검증
room.status ended에서 command 거절
다른 player connected=false 상태에서 command 거절
left player command 거절
```

### 수동 테스트

```text
Chrome 3개 또는 실제 기기 3개 접속
방장 게임 시작
각 플레이어가 순서대로 초기 마을/도로 배치
다른 플레이어 차례에 클릭해도 반영되지 않음
마을 없이 도로 배치 불가
마을과 붙지 않은 도로 배치 불가
두 번째 초기 마을 이후 본인 자원만 상세 표시
새로고침 후 같은 초기 배치 상태 복구
한 참가자 탭 닫기 -> 남은 유저 재접속 대기 모달 표시
재접속 후 모달 닫힘, 배치 계속 가능
방 나가기 후 ended 상태에서 배치 command 불가
```

## 완료 기준

```text
초기 배치가 서버 command로만 처리된다.
잘못된 차례/위치/순서의 배치를 서버가 거절한다.
모든 브라우저에서 같은 마을/도로가 표시된다.
초기 배치 완료 후 모든 브라우저가 play phase로 진입한다.
setup2 시작 자원이 서버에서 지급된다.
각 플레이어의 비공개 자원 정보는 본인에게만 상세 표시된다.
재접속 대기/ended/left 상태에서는 초기 배치가 진행되지 않는다.
오프라인 모드는 기존처럼 동작한다.
```

## 위험 요소

```text
기존 오프라인 buildRoad/buildSettlement 로직과 서버 로직이 갈라질 수 있다.
초기 도로가 방금 놓은 마을과 연결되는지 검증이 누락될 수 있다.
setupIndex 진행 순서가 3인/4인 게임에서 꼬일 수 있다.
초기 자원 지급이 중복 지급될 수 있다.
새로고침 직후 connected=false/true broadcast 타이밍 때문에 배치 command가 잠깐 거절될 수 있다.
```

## 다음 단계 연결

6단계 완료 후 7단계에서 주사위 굴림, 자원 지급, 턴 종료를 구현한다.
## 2026-05-26 작업 전 갱신

### 실제 수정 대상

```text
server.js
script.js
docs/tests/2026-05-26_online-06-initial-placement-test-plan.md
docs/reports/2026-05-26_online-06-initial-placement-final-report.md
```

### 구현 상세

```text
server.js
- 공통 온라인 게임 command 검증 함수를 추가한다.
- placeInitialSettlement, placeInitialRoad command를 추가한다.
- room.status=playing, matchState 존재, phase=setup1/setup2, 인증, left=false, 모든 player.connected=true를 검증한다.
- 현재 setupIndex의 onlinePlayerId와 요청 player.id가 일치하는지 검증한다.
- vertex/edge id, 점유 여부, 거리 규칙, pendingSettlement 순서를 검증한다.
- setup2 road 완료 시 pendingSettlement 주변 타일에서 desert 제외 시작 자원을 지급한다.
- road 완료 후 setup1/setup2 순서를 전진시키고, 마지막 setup2 완료 시 phase=play, active=0으로 전환한다.
- 성공 시 요청자에게 ack를 보내고 모든 socket에 viewer별 state를 broadcast한다.

script.js
- 온라인 초기 배치 중 vertex/edge 클릭은 로컬 buildSettlement/buildRoad 대신 서버 command를 전송한다.
- 온라인 내 차례/마을 먼저/연결 도로만 UI buildable hint에 반영한다.
- 서버 거절 메시지를 addLog로 표시한다.
- 재접속 대기/ended 상태에서는 배치 클릭을 막는다.
- 오프라인 모드의 기존 buildSettlement/buildRoad/setupStepComplete 흐름은 유지한다.
```

### 구현하지 않을 범위

```text
주사위 굴림
일반 건설 command
턴 종료 command
개발 카드/교환/강도 command
게임 재시작
```

### 검증 계획

```text
node --check server.js
node --check script.js
WebSocket 자동 테스트:
- 정상 3인 setup1/setup2 전체 완료 후 phase=play
- 잘못된 차례 거절
- 거리 규칙 위반 마을 거절
- 마을 없이 도로 거절
- pendingSettlement와 연결되지 않은 도로 거절
- setup2 시작 자원 지급 및 상대 resources 미노출
- connected=false 유저 존재 시 command 거절
- ended 방 command 거절
브라우저 스모크:
- 로컬 페이지 로드
- 온라인 command helper 문법 오류 없음
수동 테스트:
- 실제 다중 브라우저 클릭/하이라이트/거절 메시지 확인
```
