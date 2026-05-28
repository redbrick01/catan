# 온라인 모드 구현 설계서

> 이 문서는 초기 통합 설계 메모이다. 실제 구현은 아래 분야별 계획서를 우선 기준으로 삼는다.
>
> - `2026-05-26_online-00-mvp-roadmap.md`
> - `2026-05-26_online-01-server-lan-room-plan.md`
> - `2026-05-26_online-02-ui-lobby-plan.md`
> - `2026-05-26_online-03-protocol-sync-plan.md`
> - `2026-05-26_online-04-game-engine-migration-plan.md`
> - `2026-05-26_online-05-reconnect-private-state-test-plan.md`

## 0. 전제

이 온라인 모드는 배포용 공식 서비스가 아니다. 개인적으로 서버를 실행하고, 친구들이 공유받은 IP 주소 URL로 접속해서 함께 플레이하는 것을 목표로 한다.

따라서 중요한 것은 다음이다.

```text
친구들이 접속하기 쉬운가
게임 상태가 서로 어긋나지 않는가
새로고침/연결 끊김 후 복귀할 수 있는가
내 차례와 내 정보가 명확하게 보이는가
오프라인 모드는 계속 유지되는가
```

상대적으로 덜 중요한 것은 다음이다.

```text
대규모 트래픽 대응
회원가입/로그인
공식 서비스 수준의 보안
도메인/HTTPS 인증서
관리자 페이지
결제/운영/배포 자동화
```

즉, 목표는 "서비스 출시"가 아니라 **친구들끼리 안정적으로 한 판 할 수 있는 온라인 모드**이다.

## 1. 한 줄 결론

온라인 모드는 단순히 URL 공유 버튼을 추가하는 작업이 아니다. 핵심은 **서버가 게임 상태의 주인이 되고, 각 브라우저는 자기 행동을 서버에 요청하는 구조**로 바꾸는 것이다.

```text
브라우저: 버튼 클릭 -> 서버에 명령 전송
서버: 규칙 검증 -> 게임 상태 변경 -> 각 브라우저에 상태 전송
브라우저: 받은 상태를 화면에 렌더링
```

현재 프로젝트는 `script.js` 안의 `game` 객체가 전체 상태를 들고 있고, `roll()`, `buildRoad()`, `buildSettlement()`, `buildCity()`, `buyDevCard()`, `useDevCard()`, `endTurn()` 같은 함수가 브라우저에서 직접 상태를 바꾼다.

온라인에서는 이 상태 변경 권한을 서버로 옮겨야 한다.

## 2. 현재 구조 진단

### 현재 파일 역할

```text
index.html
- 단일 게임 화면
- 오프라인 게임 시작 UI
- 보드/플레이어/패널/모달 영역

styles.css
- 전체 레이아웃과 UI 스타일

script.js
- DOM 연결
- 게임 상태 보관
- 규칙 판정
- 상태 변경
- SVG 보드 렌더링
- 버튼 이벤트 처리
- 테스트용 window.__catanTest 일부 제공

server.js
- 127.0.0.1 정적 파일 서버
- 현재는 멀티플레이 상태 관리 없음
```

### 온라인화의 핵심 장애물

`script.js`가 다음 역할을 모두 하고 있다.

```text
1. UI 입력 처리
2. 게임 규칙 판정
3. 게임 상태 변경
```

온라인에서는 2번과 3번을 서버 쪽으로 옮겨야 한다.

그렇지 않으면 다음 문제가 생긴다.

- 플레이어마다 서로 다른 게임 상태를 볼 수 있음
- 차례가 아닌 플레이어도 조작할 수 있음
- 새로고침 시 같은 플레이어로 복귀하기 어려움
- 주사위/자원/개발 카드 조작이 클라이언트에서 가능해짐
- 상대의 비공개 정보가 노출될 수 있음
- 7 카드 버리기, 강도, 플레이어 교환 같은 응답 흐름이 꼬일 수 있음

## 3. 목표 사용자 흐름

### 3.1 오프라인 모드

기존 방식은 유지한다.

```text
1. 사용자가 "오프라인 게임" 선택
2. 플레이어 수와 이름 입력
3. 한 브라우저에서 모든 플레이어가 번갈아 진행
```

오프라인 모드는 테스트와 빠른 플레이에 계속 필요하다.

### 3.2 온라인 방 만들기

```text
1. 방장이 PC에서 서버 실행
2. 브라우저에서 게임 페이지 접속
3. "온라인 방 만들기" 클릭
4. 닉네임 입력
5. 서버가 roomId 생성
6. 대기실에 공유 URL 표시
7. 방장이 URL을 친구들에게 전달
8. 친구들이 브라우저로 접속
9. 3~4명이 모이면 방장이 게임 시작
```

공유 URL 예시:

```text
http://192.168.0.12:4173/?room=abc123
```

### 3.3 온라인 방 참가하기

```text
1. 친구가 공유 URL 접속
2. URL의 roomId 자동 인식
3. 닉네임 입력
4. 대기실 입장
5. 방장이 시작할 때까지 대기
6. 시작되면 게임 화면으로 이동
```

### 3.4 온라인 게임 중

```text
1. 내 차례이면 조작 버튼 활성화
2. 내 차례가 아니면 대부분의 조작 버튼 비활성화
3. 버튼 클릭 시 서버에 명령 전송
4. 서버가 규칙 검증 후 상태 변경
5. 모든 브라우저가 최신 상태 수신
6. 각 브라우저는 자기에게 허용된 정보만 표시
```

## 4. 서버 구현 상세

### 4.1 IP 접속을 위한 바인딩

현재 `server.js`는 아래처럼 로컬 전용으로 동작한다.

```js
const host = "127.0.0.1";
```

같은 와이파이 또는 같은 LAN 안의 친구들이 접속하려면 다음처럼 바꿔야 한다.

```js
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
```

서버 실행 시 안내 문구를 친절하게 출력하면 좋다.

```text
Local:   http://127.0.0.1:4173/
Network: http://192.168.0.12:4173/
```

방장은 `Network` 주소를 친구들에게 공유하면 된다.

### 4.2 개인용 서버에서 꼭 필요한 책임

서버가 해야 하는 것:

- 정적 파일 서빙
- WebSocket 연결
- 방 만들기/참가하기
- 대기실 참가자 목록 동기화
- 게임 상태 보관
- 게임 명령 검증
- 게임 상태 변경
- 플레이어별 상태 전송
- 재접속 처리

서버가 굳이 하지 않아도 되는 것:

- 회원가입
- 로그인 시스템
- 관리자 기능
- 장기 통계 저장
- 다중 서버 확장
- 공개 매치메이킹
- 공식 서비스 수준의 권한 관리

### 4.3 권장 파일 구조

처음부터 대규모 구조를 만들 필요는 없다. 하지만 `script.js`가 너무 커져 있으므로 온라인에 필요한 경계는 나누는 것이 좋다.

```text
server.js
- HTTP 정적 파일 서버
- WebSocket 서버
- 방/연결 관리 진입점

src/server/roomStore.js
- rooms Map 관리
- 방 생성/조회/삭제
- 플레이어 연결 상태 관리

src/server/messageHandlers.js
- WebSocket 메시지 처리
- createRoom, joinRoom, startGame, command 라우팅

src/shared/gameEngine.js
- 게임 상태 생성
- 규칙 검증
- 상태 변경
- 오프라인/온라인 공용 목표

src/shared/stateView.js
- 내 화면용 상태
- 상대 화면용 상태
- 비공개 정보 필터링

script.js
- UI 렌더링
- 버튼 이벤트
- 오프라인 모드에서는 직접 엔진 호출
- 온라인 모드에서는 서버에 명령 전송
```

개인용 프로젝트이므로 폴더 구조는 너무 복잡하게 만들 필요가 없다. 다만 게임 규칙과 UI는 분리하는 편이 나중에 훨씬 편하다.

### 4.4 방 상태 모델

서버 메모리에 방을 저장한다. 개인용 친구 플레이에서는 우선 메모리 저장으로 충분하다.

```js
const rooms = new Map();

const room = {
  id: "abc123",
  status: "lobby", // lobby | playing | finished
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
  hostPlayerId: "p_1",
  players: [
    {
      id: "p_1",
      seatIndex: 0,
      name: "Player 1",
      color: "#3fa7d6",
      token: "random-secret",
      connected: true,
      joinedAt: 1710000000000,
      lastSeenAt: 1710000000000
    }
  ],
  sockets: new Map(), // playerId -> WebSocket
  game: null,
  revision: 0
};
```

개인용이라 토큰을 해시해서 저장하는 것까지는 필수는 아니다. 다만 토큰은 URL에 넣지 않는 것이 좋다. URL은 친구들에게 공유되기 때문이다.

### 4.5 플레이어 토큰과 재접속

친구가 새로고침했을 때 같은 플레이어로 돌아오려면 브라우저에 식별 정보를 저장해야 한다.

```js
localStorage.setItem("catanOnlineIdentity", JSON.stringify({
  roomId: "abc123",
  playerId: "p_1",
  playerToken: "random-secret"
}));
```

재접속 흐름:

```text
1. 브라우저가 다시 열림
2. localStorage에서 roomId/playerId/playerToken 확인
3. 서버에 reconnect 요청
4. 서버가 토큰 확인
5. 같은 플레이어로 복귀
6. 최신 게임 상태 전송
```

재접속은 개인용 게임에서도 중요하다. 친구가 실수로 새로고침했을 때 게임이 망가지지 않게 해준다.

### 4.6 방 ID

방 ID는 짧고 공유하기 쉬우면 된다.

```text
예: k7m2qa
```

권장:

- 6자리 정도의 영문/숫자
- 순차 번호는 피하기
- URL에서 읽기 쉬운 문자만 사용

개인용이므로 완벽하게 추측 불가능할 필요는 없지만, `1`, `2`, `3` 같은 ID는 피하는 것이 좋다.

### 4.7 WebSocket 사용

온라인 모드에는 WebSocket을 권장한다.

이유:

- 친구가 입장하면 바로 목록 갱신
- 방장이 시작하면 모두 즉시 게임 화면으로 이동
- 누가 주사위를 굴렸는지 바로 반영
- 턴 종료가 즉시 반영
- 연결 끊김/재연결 상태 표시 가능

추천:

```text
초기 구현: ws 패키지
```

Socket.IO까지는 필수는 아니다. 개인용 규모에서는 `ws`로 충분하다.

### 4.8 WebSocket 메시지 규격

모든 메시지는 JSON으로 통일한다.

클라이언트 -> 서버:

```json
{
  "type": "command",
  "requestId": "client-uuid-1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "rollDice"
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
  "requestId": "client-uuid-1",
  "code": "NOT_YOUR_TURN",
  "message": "현재 차례가 아닙니다."
}
```

### 4.9 메시지 타입

대기실:

```text
createRoom
joinRoom
reconnect
leaveRoom
startGame
changeName
```

게임:

```text
rollDice
endTurn
buildRoad
buildSettlement
buildCity
buyDevCard
playDevCard
bankTrade
proposePlayerTrade
acceptPlayerTrade
rejectPlayerTrade
moveRobber
chooseRobberVictim
discardForSeven
chooseYearOfPlentyResources
chooseMonopolyResource
placeFreeRoadFromRoadBuilding
```

서버 이벤트:

```text
lobbyState
state
gameStarted
playerJoined
playerDisconnected
playerReconnected
commandAccepted
error
serverNotice
```

### 4.10 명령 payload 예시

주사위:

```json
{
  "name": "rollDice"
}
```

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

도시 업그레이드:

```json
{
  "name": "buildCity",
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

플레이어 교환 제안:

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

7 카드 버리기:

```json
{
  "name": "discardForSeven",
  "resources": {
    "forest": 1,
    "hill": 1
  }
}
```

강도 이동:

```json
{
  "name": "moveRobber",
  "tileId": 5
}
```

### 4.11 서버 검증 원칙

개인용이라고 해도 서버 검증은 필요하다. 보안 때문만이 아니라, 게임 상태가 꼬이지 않게 하기 위해서다.

모든 명령에서 확인할 것:

```text
roomId가 존재하는가
playerId가 해당 방에 있는가
playerToken이 맞는가
방 상태가 명령에 맞는가
현재 차례 또는 응답 권한이 맞는가
명령 payload가 정상인가
규칙상 가능한 행동인가
자원/카드/말 수량이 충분한가
처리 후 승리 조건을 확인했는가
```

클라이언트가 보낸 다음 값은 믿지 않는다.

```text
현재 차례
자원 개수
개발 카드 종류
주사위 값
점수
건설 가능 여부
교환 비율
```

## 5. 게임 엔진 분리 전략

### 5.1 최종 목표

최종적으로는 UI와 규칙을 분리한다.

```text
UI 코드:
- 버튼 활성화
- 모달 표시
- SVG 렌더링
- 서버 메시지 송수신

게임 엔진:
- 상태 생성
- 규칙 검증
- 상태 변경
- 승리 조건 확인
```

### 5.2 함수 형태

처음에는 기존 코드를 크게 흔들지 않기 위해 mutable 방식이 현실적이다.

```js
function applyCommand(game, command) {
  // 1. validate
  // 2. mutate game
  // 3. return result
  return {
    ok: true,
    events: []
  };
}
```

나중에 안정성이 더 필요하면 `structuredClone`으로 복사 후 변경하는 방식으로 바꿀 수 있다.

### 5.3 함수 이동 우선순위

1차:

- `startGame()`
- `rollDice()`
- `roll()`
- `endTurn()`

2차:

- `buildRoad()`
- `buildSettlement()`
- `buildCity()`
- 건설 가능 여부 함수들

3차:

- 은행 교환
- 항구 비율 계산
- 플레이어 교환

4차:

- 개발 카드 구입
- 개발 카드 사용
- 기사/독점/풍년/도로 건설 카드

5차:

- 7 카드 버리기
- 강도 이동
- 자원 훔치기

### 5.4 오프라인 모드 유지

오프라인과 온라인이 같은 게임 규칙을 쓰는 것이 이상적이다.

```text
오프라인:
UI -> gameEngine.applyCommand()

온라인:
UI -> WebSocket -> server -> gameEngine.applyCommand()
```

이렇게 하면 온라인을 고치다가 오프라인 규칙이 따로 어긋나는 일을 줄일 수 있다.

## 6. 클라이언트 UI 수정 상세

### 6.1 화면 상태

필요한 화면 상태:

```text
modeSelect
offlineSetup
onlineNameInput
onlineLobby
game
connectionLost
finished
```

### 6.2 시작 화면

기존 setup 화면을 다음처럼 확장한다.

```text
[오프라인 게임]
[온라인 방 만들기]
[온라인 방 참가하기]
```

URL에 `?room=`이 있으면 바로 온라인 참가 흐름을 보여준다.

```text
공유 URL 접속
-> 방 코드 자동 인식
-> 닉네임 입력
-> 대기실 입장
```

### 6.3 대기실 UI

방장 화면:

```text
방 코드: abc123
공유 URL: http://192.168.0.12:4173/?room=abc123
[복사]

참가자
- 민수  방장  연결됨
- 지훈        연결됨
- 수아        연결됨

[게임 시작]
```

참가자 화면:

```text
방 코드: abc123
방장이 게임을 시작할 때까지 기다리는 중

참가자
- 민수  방장
- 지훈  나
- 수아
```

게임 시작 조건:

```text
방장만 가능
플레이어 3~4명
모든 플레이어 connected
방 상태가 lobby
```

### 6.4 친구들이 덜 헷갈리게 보여줘야 하는 것

개인용 게임에서는 고급 기능보다 상태 안내가 중요하다.

필수 표시:

- 내가 누구로 접속했는지
- 현재 누구 차례인지
- 내 차례인지 아닌지
- 서버와 연결되어 있는지
- 내가 지금 해야 할 행동이 있는지
- 방장이 공유해야 할 URL이 무엇인지
- 새로고침해도 복귀 가능하다는 안내

예:

```text
현재 차례: 민수
내 상태: 지훈으로 접속 중
연결: 정상
대기: 민수의 행동을 기다리는 중
```

### 6.5 게임 화면에서 내 권한

온라인 세션 상태:

```js
const onlineSession = {
  enabled: true,
  roomId: "abc123",
  playerId: "p_1",
  seatIndex: 0,
  isHost: true,
  connected: true,
  pendingRequestIds: new Set()
};
```

내 차례 여부:

```js
const isMyTurn = onlineSession.seatIndex === game.active;
```

현재 코드가 숫자 플레이어 id를 많이 쓰고 있으므로, 온라인에서도 내부 게임 로직은 숫자 seatIndex를 유지하는 편이 안전하다.

```js
player = {
  id: 0,
  onlinePlayerId: "p_1",
  name: "민수"
}
```

### 6.6 버튼 활성화 규칙

내 차례여야 하는 행동:

- 주사위
- 턴 종료
- 도로 건설
- 마을 건설
- 도시 건설
- 개발 카드 구입
- 개발 카드 사용
- 은행 교환
- 플레이어 교환 제안

내 차례가 아니어도 가능한 응답:

- 내가 7 카드 버리기 대상일 때
- 내가 플레이어 교환 제안을 받았을 때
- 서버가 특정 응답을 요구하는 pending action이 있을 때

### 6.7 서버 응답 대기 UI

명령을 보낸 뒤 서버 응답 전까지는 중복 클릭을 막는다.

```text
주사위 버튼 클릭
-> requestId 생성
-> 버튼 disabled
-> 서버 state 또는 error 수신
-> requestId 제거
-> 버튼 상태 재계산
```

표시 문구:

```text
서버 응답 대기 중...
재연결 중...
연결이 끊겼습니다. 다시 연결을 시도합니다.
```

### 6.8 비공개 정보 UI

내 화면:

- 내 자원 종류별 개수 표시
- 내 개발 카드 종류 표시
- 내 숨겨진 승점 포함 표시

상대 화면:

- 자원 총 장수만 표시
- 개발 카드 총 장수만 표시
- 숨겨진 승점 표시하지 않음

## 7. 상태 필터링

### 7.1 서버 내부 상태

서버는 완전한 정보를 가진다.

```js
player.resources = {
  forest: 2,
  field: 1,
  pasture: 0,
  hill: 1,
  mountain: 0
};

player.dev = [
  { id: 1, type: "knight" },
  { id: 2, type: "victory" }
];
```

### 7.2 내 클라이언트에 보내는 정보

```js
{
  resources: {
    forest: 2,
    field: 1,
    pasture: 0,
    hill: 1,
    mountain: 0
  },
  dev: [
    { id: 1, type: "knight" },
    { id: 2, type: "victory" }
  ],
  hiddenVictoryPoints: 1
}
```

### 7.3 다른 클라이언트에 보내는 정보

```js
{
  resourceCount: 4,
  devCount: 2,
  hiddenVictoryPoints: null
}
```

### 7.4 로그 주의사항

괜찮은 로그:

```text
민수가 자원 1장을 빼앗겼습니다.
지훈이 개발 카드를 사용했습니다.
```

피해야 할 로그:

```text
민수가 목재를 빼앗겼습니다.
지훈이 승점 카드를 보유 중입니다.
```

친구끼리 하는 게임이어도 비공개 정보가 로그로 새면 재미가 줄어든다.

## 8. IP 접속과 네트워크 고려사항

### 8.1 1차 목표는 같은 와이파이/LAN

가장 현실적인 첫 목표는 같은 네트워크 안에서 플레이하는 것이다.

필요 조건:

```text
서버 PC와 친구들의 기기가 같은 와이파이/LAN에 있음
서버가 0.0.0.0으로 실행됨
Windows 방화벽에서 포트 허용
친구들이 http://서버PC_IP:포트 로 접속
```

서버 PC 내부 IP 확인:

```powershell
ipconfig
```

확인할 항목:

```text
IPv4 Address . . . . . . . . . . . : 192.168.x.x
```

### 8.2 외부에서 접속할 수도 있지만 우선순위는 낮음

친구가 같은 네트워크 밖에 있으면 추가 설정이 필요할 수 있다.

가능한 방법:

- 공유기 포트포워딩
- 방화벽 인바운드 허용
- 임시 터널링 도구 사용

하지만 이 프로젝트의 핵심 목표는 공식 서비스가 아니므로, 외부 인터넷 접속은 별도 후순위로 둔다.

초기 구현에서는 다음 정도만 문서에 안내하면 충분하다.

```text
같은 와이파이에서는 내부 IP로 접속
다른 장소에서는 추가 네트워크 설정이 필요할 수 있음
```

### 8.3 HTTPS는 필수 아님

개인용 LAN 플레이에서는 HTTP로 시작해도 된다.

```text
http://192.168.0.12:4173/
```

도메인과 HTTPS 인증서 구성은 지금 목표와 맞지 않는다. 나중에 정말 외부 접속이 자주 필요해지면 그때 따로 검토한다.

## 9. 개인용 프로젝트 기준의 보안 수준

### 9.1 중요한 보안

개인용이어도 다음은 필요하다.

- 방 ID가 너무 단순하지 않게 하기
- URL에 playerToken 넣지 않기
- 서버가 차례/자원/카드/건설 위치를 검증하기
- 상대 비공개 정보 보내지 않기
- 잘못된 메시지로 서버가 죽지 않게 하기

### 9.2 덜 중요한 보안

현재 목표에서는 크게 신경 쓰지 않아도 된다.

- 계정 시스템
- 비밀번호 로그인
- OAuth
- 관리자 권한 체계
- 공개 API rate limit
- 대규모 악성 트래픽 방어
- HTTPS 강제
- 감사 로그

### 9.3 그래도 서버 검증은 꼭 필요함

서버 검증은 "보안"보다 "게임이 안 꼬이게 하기 위한 장치"에 가깝다.

예:

```text
친구가 버튼을 두 번 클릭함
네트워크가 잠깐 끊겼다가 같은 요청이 재전송됨
새로고침 중 이전 상태의 버튼을 눌렀음
다른 탭이 같은 플레이어로 열려 있음
```

이런 상황에서도 서버가 최종 판정을 해야 게임이 유지된다.

## 10. 구현 단계별 계획

### Phase 1. LAN 접속 기반 만들기

목표:

- 같은 네트워크의 다른 기기에서 페이지 접속 가능

작업:

- `server.js` host를 `0.0.0.0` 지원으로 변경
- 서버 시작 시 Local/Network URL 출력
- 간단한 접속 안내 문구 추가

검증:

- 같은 PC에서 `http://127.0.0.1:4173` 접속
- 같은 와이파이의 다른 기기에서 `http://서버IP:4173` 접속

### Phase 2. 온라인/오프라인 모드 선택 UI

목표:

- 기존 오프라인 기능 유지
- 온라인 진입점 추가

작업:

- 시작 화면에 모드 선택 추가
- 오프라인 선택 시 기존 흐름 유지
- 온라인 방 만들기/참가하기 버튼 추가
- URL의 `?room=` 파라미터 감지

검증:

- 오프라인 게임이 기존처럼 시작됨
- 온라인 버튼이 대기실 흐름으로 이동함

### Phase 3. WebSocket 연결과 대기실

목표:

- 방 생성/참가/대기실 동기화

작업:

- WebSocket 서버 추가
- `createRoom`
- `joinRoom`
- `reconnect`
- `lobbyState` broadcast
- 닉네임 입력 UI
- 공유 URL 복사 버튼

검증:

- 방장이 방 생성 가능
- 다른 브라우저가 URL로 참가 가능
- 참가자 목록이 즉시 갱신됨
- 새로고침 후 같은 플레이어로 복귀 가능

### Phase 4. 서버에서 게임 시작

목표:

- 서버가 초기 게임 상태를 만들고 모든 브라우저가 같은 게임을 봄

작업:

- `startGame` 메시지 구현
- 서버에서 플레이어 이름/색상 확정
- 서버에서 board/devDeck/bank/player 상태 생성
- 클라이언트는 받은 상태로 렌더링

검증:

- 모든 브라우저의 보드 지형/숫자/항구가 동일
- 모든 브라우저의 현재 차례가 동일

### Phase 5. 주사위와 턴 종료 서버 권위화

목표:

- 가장 단순한 명령부터 서버 판정으로 이전

작업:

- `rollDice` 명령
- `endTurn` 명령
- 서버에서 주사위 생성
- 서버에서 `rolled`, `active`, `round` 변경
- UI 버튼에 내 차례 조건 추가

검증:

- 내 차례인 플레이어만 주사위 가능
- 주사위 중복 클릭 불가
- 턴 종료가 모든 브라우저에 반영됨

### Phase 6. 건설 서버 권위화

목표:

- 도로/마을/도시 건설을 서버에서 검증

작업:

- `buildRoad`
- `buildSettlement`
- `buildCity`
- setup phase 건설 순서 처리
- 자원 차감 서버 처리
- 말 수량 차감 서버 처리
- 최장 교역로/승점 갱신

검증:

- 잘못된 위치 건설 거부
- 자원 부족 시 거부
- 모든 브라우저 보드에 같은 건설물 표시

### Phase 7. 교환 서버 권위화

목표:

- 은행/항구/플레이어 교환을 서버 처리

작업:

- `bankTrade`
- 항구 보유 여부 서버 계산
- 플레이어 교환 제안/수락/거절
- 교환 pending state 추가

검증:

- 4:1, 3:1, 2:1 비율이 정확히 적용됨
- 제안받은 플레이어만 수락/거절 가능
- 교환 후 양쪽 자원이 정확히 변경됨

### Phase 8. 개발 카드 서버 권위화

목표:

- 개발 카드 구매/사용/타이밍을 서버 처리

작업:

- `buyDevCard`
- `playDevCard`
- 구매 턴 사용 금지 검증
- 기사 카드
- 풍년
- 독점
- 도로 건설
- 승점 카드 비공개 처리

검증:

- 구매한 턴에는 해당 카드 사용 불가
- 숨겨진 승점이 상대에게 노출되지 않음
- 기사 사용 시 최대 기사상 갱신

### Phase 9. 7/강도/pending action

목표:

- 여러 플레이어 응답이 필요한 흐름 안정화

작업:

- 7이 나오면 버릴 대상 계산
- 각 대상에게 discard 요청
- 모든 대상 응답 후 강도 이동 허용
- 강도 이동 후 피해자 선택
- 자원 훔치기 서버 처리

검증:

- 버려야 할 플레이어만 discard UI 표시
- 모두 버리기 전 강도 이동 불가
- 훔친 자원 종류가 상대에게 노출되지 않음

### Phase 10. 재접속/복구

목표:

- 새로고침/일시 연결 끊김에도 게임 유지

작업:

- localStorage identity 저장
- reconnect 메시지
- disconnected 상태 표시
- 같은 playerId 소켓 교체
- 빈 방 정리

검증:

- 게임 중 새로고침 후 같은 플레이어로 복귀
- 상대 화면에 연결 끊김/재연결 표시

## 11. 테스트 계획

### 11.1 같은 PC 테스트

- 오프라인 모드 기존 기능 확인
- 온라인 방 만들기
- 다른 탭으로 참가
- 시크릿 창으로 참가
- 방장만 시작 가능한지 확인

### 11.2 여러 브라우저 테스트

- Chrome + Edge
- 일반 창 + 시크릿 창
- 새로고침 재접속
- 중복 클릭
- 잘못된 방 코드

### 11.3 LAN 테스트

- 서버 PC 1대
- 같은 와이파이의 다른 PC 또는 휴대폰 1대 이상
- 공유 URL 접속
- 대기실 동기화
- 게임 시작 후 주사위/턴 동기화

### 11.4 규칙 회귀 테스트

온라인 전환 후 반드시 다시 확인할 기능:

- 초기 배치 순서
- 초기 자원 지급
- 주사위 자원 지급
- 7 카드 버리기
- 강도 이동
- 건설 비용
- 도로 연결 규칙
- 마을 거리 규칙
- 항구 교환
- 플레이어 교환
- 개발 카드 타이밍
- 최대 기사상
- 최장 교역로
- 승리 조건
- 비공개 승점
- 상대 자원 숨김

## 12. 위험 요소와 대응

### 위험 1. 한 번에 다 서버로 옮기다 크게 깨짐

대응:

```text
주사위/턴 종료 -> 건설 -> 교환 -> 개발 카드 -> 강도 순서로 작게 이전
```

### 위험 2. 오프라인 모드가 망가짐

대응:

```text
오프라인은 기존 경로를 유지하고, 공용 엔진 이전은 단계별로 진행
```

### 위험 3. 비공개 정보 노출

대응:

```text
서버 내부 state와 클라이언트 view state를 분리
상대에게는 count만 전송
로그에도 카드 종류/자원 종류 노출 주의
```

### 위험 4. 친구가 새로고침해서 게임이 꼬임

대응:

```text
localStorage player identity
reconnect 메시지
최신 state 재전송
```

### 위험 5. 버튼 중복 클릭으로 명령이 두 번 처리됨

대응:

```text
requestId
서버 revision
pendingRequest 관리
버튼 중복 클릭 방지
```

### 위험 6. 친구가 접속 방법을 헷갈림

대응:

```text
대기실에 공유 URL 크게 표시
복사 버튼 제공
현재 연결 상태 표시
방장이 공유해야 할 주소를 명확히 안내
```

## 13. 우선순위 요약

가장 먼저 해야 할 일:

```text
1. server.js를 같은 와이파이에서 접속 가능하게 바꾸기
2. 온라인/오프라인 모드 선택 UI 만들기
3. WebSocket으로 방 만들기/참가하기 구현
4. 대기실과 공유 URL 복사 기능 만들기
5. 서버에서 게임 시작 상태 만들기
6. 주사위와 턴 종료부터 서버 권위로 옮기기
```

이번 프로젝트 기준에서 중요한 것:

```text
친구들이 쉽게 접속해야 한다.
게임 상태가 서로 어긋나면 안 된다.
새로고침해도 돌아올 수 있어야 한다.
오프라인 모드는 계속 살아 있어야 한다.
```

이번 프로젝트 기준에서 덜 중요한 것:

```text
공식 배포
도메인
HTTPS
회원가입
대규모 트래픽
운영자 관리 기능
```

최종 원칙:

```text
서버가 정답이다.
클라이언트는 요청만 한다.
각 클라이언트는 자기에게 허용된 정보만 받는다.
친구들이 헷갈리지 않게 UI가 상태를 분명히 말해준다.
```
