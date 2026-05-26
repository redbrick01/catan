# 온라인 01 서버/LAN/방 구현 계획

## 목표

방장이 자기 PC에서 서버를 실행하고, 같은 네트워크의 친구들이 IP 주소로 접속할 수 있게 만든다. 동시에 온라인 방의 최소 서버 모델을 만든다.

## 범위

포함:

```text
server.js LAN 접속 지원
Local/Network URL 출력
WebSocket 서버 준비
package.json 및 ws 의존성 도입 여부 결정
방 생성/조회
플레이어 참가
방장 지정
메모리 기반 rooms 저장
```

제외:

```text
HTTPS
도메인
계정
DB 저장
외부 인터넷 포트포워딩 자동화
방장 이전
```

## 현재 상태

현재 `server.js`는 정적 파일을 제공하며 `127.0.0.1`에 바인딩되어 있다. 이 상태에서는 서버를 실행한 PC 안에서만 접속할 수 있다.

## 구현 작업

### 1. 서버 바인딩 변경

변경 방향:

```js
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
```

주의:

```text
서버가 0.0.0.0으로 listen해도 브라우저 접속 URL에는 실제 IP를 써야 한다.
예: http://192.168.0.12:4173/
```

### 2. Network URL 출력

서버 시작 시 다음처럼 출력한다.

```text
Original Catan server running
Local:   http://127.0.0.1:4173/
Network: http://192.168.0.12:4173/
```

내부 IP는 Node의 `os.networkInterfaces()`로 찾는다.

출력 기준:

```text
IPv4
internal=false
가상 어댑터는 가능하면 제외
여러 개면 모두 출력해도 됨
```

### 3. WebSocket 서버 추가

개인용 규모에서는 `ws` 패키지 사용을 우선한다.

현재 프로젝트에 `package.json`이 없다면 이 단계에서 추가한다.

권장 실행 구조:

```text
package.json
- scripts.start = node server.js
- dependencies.ws
```

설치:

```powershell
npm install ws
```

실행:

```powershell
npm start
```

의존성을 추가하고 싶지 않은 경우에는 polling 또는 SSE로 임시 구현할 수도 있지만, 대기실/턴 동기화/재접속을 생각하면 WebSocket이 더 단순하다.

서버 역할:

```text
HTTP 서버와 같은 포트를 사용
WebSocket upgrade 처리
클라이언트 메시지 JSON parse
메시지 type에 따라 handler 호출
오류 발생 시 error 메시지 반환
```

### 4. rooms 저장소

초기에는 메모리 `Map`을 사용한다.

```js
const rooms = new Map();
```

room 구조:

```js
{
  id: "abc123",
  status: "lobby",
  hostPlayerId: "p_1",
  players: [],
  sockets: new Map(),
  game: null,
  revision: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### 5. 방 ID 생성

조건:

```text
6자리 영문/숫자
URL에 넣기 쉬움
순차 번호 아님
```

예:

```text
k7m2qa
```

중복 방지를 위해 `rooms.has(id)`를 확인한다.

### 6. 플레이어 생성

플레이어 구조:

```js
{
  id: "p_1",
  seatIndex: 0,
  name: "민수",
  color: "#3fa7d6",
  token: "random-secret",
  connected: true,
  joinedAt: Date.now(),
  lastSeenAt: Date.now()
}
```

현재 게임 로직은 숫자 player id에 기대고 있으므로, 온라인 전용 `id`와 게임 내부 `seatIndex`를 분리한다.

```text
player.id: 온라인 연결용 문자열
player.seatIndex: 기존 게임 로직용 숫자
```

### 7. createRoom 처리

클라이언트 요청:

```json
{
  "type": "createRoom",
  "requestId": "r1",
  "name": "민수"
}
```

서버 처리:

```text
roomId 생성
playerId 생성
playerToken 생성
방장 플레이어 추가
socket 연결 등록
status가 lobby인 state 전송
```

응답:

```json
{
  "type": "roomCreated",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "shareUrl": "http://192.168.0.12:4173/?room=abc123"
}
```

주의:

```text
shareUrl의 IP는 서버가 추정한 Network URL을 사용한다.
네트워크 어댑터가 여러 개면 틀린 IP가 선택될 수 있다.
서버는 가능한 Network URL 후보를 함께 내려주고, UI에서 방장이 맞는 주소를 고를 수 있게 하는 것이 안전하다.
```

예:

```json
{
  "shareUrls": [
    "http://192.168.0.12:4173/?room=abc123",
    "http://10.0.0.5:4173/?room=abc123"
  ]
}
```

### 8. joinRoom 처리

클라이언트 요청:

```json
{
  "type": "joinRoom",
  "requestId": "r2",
  "roomId": "abc123",
  "name": "지훈"
}
```

서버 검증:

```text
방 존재
방 status가 lobby
플레이어 수 4명 미만
이름이 비어 있지 않음
```

서버 처리:

```text
seatIndex 배정
playerId/playerToken 생성
players에 추가
socket 연결 등록
모든 참가자에게 status가 lobby인 state broadcast
```

### 9. 간단한 방 정리

개인용이므로 복잡한 cleanup은 나중으로 미룬다.

초기 기준:

```text
서버를 끄면 모든 방 종료
방장이 새로 만들면 새 방 생성
finished 방은 메모리에 남아도 큰 문제 없음
```

후속 개선:

```text
모든 플레이어 연결 끊김 후 2시간 지나면 삭제
```

## 완료 기준

```text
서버 실행 시 Network URL이 출력된다.
package.json과 ws 도입 여부가 결정되어 실행 명령이 명확하다.
같은 와이파이의 다른 기기에서 index.html 접속 가능하다.
브라우저 A가 방을 만들 수 있다.
브라우저 B가 roomId로 참가할 수 있다.
두 브라우저 모두 같은 참가자 목록을 받는다.
Network URL 후보가 여러 개면 대기실에서 선택 또는 확인 가능하다.
```

## 수동 테스트

```text
1. node server.js 실행
2. PC에서 http://127.0.0.1:4173 접속
3. 온라인 방 만들기
4. 다른 브라우저/시크릿 창에서 공유 URL 접속
5. 닉네임 입력 후 참가
6. 두 화면의 참가자 목록 비교
```

## 친구가 접속 안 될 때 확인할 것

```text
서버가 켜져 있는가
같은 와이파이/LAN인가
URL의 IP와 포트가 맞는가
Windows 방화벽이 막고 있지 않은가
방장이 127.0.0.1 주소를 공유한 것은 아닌가
```
## 2026-05-26 작업 전 갱신

이번 작업은 온라인 모드 1단계의 서버/LAN/방 최소 구조만 구현한다.

변경 대상:

```text
server.js
package.json
```

구현 범위:

```text
HTTP 서버를 0.0.0.0에 바인딩한다.
서버 시작 시 Local URL과 Network URL 후보를 출력한다.
ws 기반 WebSocket 서버를 같은 HTTP 포트에 붙인다.
메모리 기반 rooms 저장소를 둔다.
createRoom 메시지로 방장 플레이어와 lobby 상태 방을 만든다.
joinRoom 메시지로 lobby 상태 방에 최대 4명까지 참가시킨다.
방 상태 전송 시 state.status = "lobby"를 포함한다.
```

구현하지 않을 범위:

```text
UI 대기실
게임 시작
초기 배치
주사위
게임 규칙 명령 처리
재접속/방장 이전/영속 저장
```

검증 방법:

```text
node --check server.js
npm start로 서버 실행 후 Local/Network URL 로그 확인
WebSocket 클라이언트 2개로 createRoom/joinRoom 실행
양쪽 클라이언트가 lobby 상태와 동일한 참가자 목록을 받는지 확인
정적 파일 요청이 기존처럼 동작하는지 확인
```

## 2026-05-26 리뷰 피드백 반영 계획

최종 보고서 하단 리뷰 피드백에 따라 1단계 서버 표면을 다음처럼 보완한다.

변경 대상:

```text
server.js
docs/test_plans/2026-05-26_online-01-server-lan-room-test-plan.md
docs/final_reports/2026-05-26_online-01-server-lan-room-final-report.md
```

보완 범위:

```text
createRoom/joinRoom을 type: "command" + payload.name 형식으로도 처리한다.
기존 type: "createRoom", type: "joinRoom" 형식은 1단계 테스트 호환을 위해 유지한다.
state broadcast 메시지에 top-level revision을 추가한다.
roomCreated 직후 같은 소켓에 중복 state broadcast를 보내지 않는다.
최종 판단은 실제 다른 LAN 기기 검증 미수행을 반영해 "부분 완료"로 수정한다.
```

검증 방법:

```text
node --check server.js
command 형식 createRoom/joinRoom WebSocket 테스트
기존 형식 createRoom/joinRoom WebSocket 호환 테스트
state 메시지 top-level revision 확인
roomCreated 직후 방장에게 state 메시지가 중복 전송되지 않는지 확인
```
