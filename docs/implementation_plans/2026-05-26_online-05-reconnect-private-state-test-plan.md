# 온라인 05 재접속/비공개 상태/테스트 구현 계획

## 목표

친구가 새로고침하거나 잠깐 연결이 끊겨도 게임이 유지되게 하고, 상대의 비공개 정보가 화면이나 로그로 새지 않게 만든다. 또한 개인용 LAN 플레이 기준의 현실적인 테스트 절차를 정한다.

## 범위

포함:

```text
localStorage identity 저장
reconnect 메시지
연결 끊김 표시
같은 플레이어로 복귀
플레이어별 상태 필터링
비공개 로그 주의
다중 브라우저/LAN 테스트
```

## 2026-05-26 5단계 작업 전 갱신

이번 작업의 핵심은 서버 내부 상태와 클라이언트 view state를 분리하는 것이다.

변경 범위:

```text
server.js
- makeRoomState(room, viewerPlayer) 형태로 수신자 기준 state 생성
- makeMatchStateView(matchState, viewerSeatIndex) 추가
- devDeck 전체를 클라이언트 state에서 제거하고 devDeckCount만 제공
- 본인 game.players 항목에는 resources/dev 상세를 유지
- 상대 game.players 항목에는 resourceCount/devCount 중심 요약만 제공
- broadcastState(room)는 소켓별로 다른 view state 전송
- roomCreated/roomJoined/reconnected/gameStarted ack도 해당 플레이어 기준 view state 전송

script.js
- hydrateMatchState()가 devDeck이 없는 view state를 처리하도록 유지
- resourceCount/devCount/hiddenVictoryPoints 계산이 상세 배열이 없는 상대 view에서도 깨지지 않게 보강
- localStorage 기반 reconnect가 playing 상태에서 같은 보드로 복귀하는지 확인
```

이번 단계에서 구현하지 않을 범위:

```text
초기 배치 command
주사위 command
턴 종료 command
건설 command
게임 중 이탈 정책 완성
서버/클라이언트 보드 생성 공용 엔진화
계정 기반 복구 또는 서버 재시작 후 복구
```

검증 기준:

```text
node --check server.js
node --check script.js
WebSocket 3클라이언트 startGame 후 각 클라이언트 state에 devDeck 배열이 없는지 확인
devDeckCount는 숫자로 제공되는지 확인
본인 resources/dev 상세는 보이고 상대 resources/dev 상세는 노출되지 않는지 확인
상대 resourceCount/devCount는 제공되는지 확인
playing 상태 reconnect 후 같은 playerId가 같은 보드와 private view를 받는지 확인
브라우저에서 localStorage identity 저장/복구 흐름을 가능한 범위에서 확인
```

제외:

```text
장기 게임 저장
서버 재시작 후 복구
계정 기반 복구
암호화된 저장소
공식 보안 감사
```

## 재접속 설계

### 저장할 값

브라우저에 다음 값을 저장한다.

```js
localStorage.setItem("katanOnlineIdentity", JSON.stringify({
  roomId: "abc123",
  playerId: "p_1",
  playerToken: "random-secret"
}));
```

저장 시점:

```text
roomCreated 수신 후
joinRoom 성공 후
reconnect 성공 후 갱신 필요 시
```

### reconnect 요청

```json
{
  "type": "reconnect",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "random-secret"
}
```

서버 처리:

```text
room 존재 확인
player 존재 확인
token 일치 확인
기존 socket이 있으면 교체
connected = true
lastSeenAt 갱신
최신 state 전송
다른 플레이어에게 재연결 상태 broadcast
```

### 같은 플레이어 중복 접속

테스트 중 같은 브라우저 탭을 복제하거나 새로고침 타이밍이 겹치면 같은 `playerId`와 `playerToken`을 가진 WebSocket이 둘 이상 생길 수 있다.

개인용 프로젝트에서는 정책을 단순하게 둔다.

```text
같은 playerId가 새로 연결되면 기존 socket을 끊고 새 socket을 정식 연결로 인정한다.
```

서버 처리:

```text
기존 socket이 있으면 close
room.sockets.set(playerId, newSocket)
player.connected = true
최신 state 전송
```

UI 기대:

```text
새 탭 또는 새로고침한 탭이 정상 플레이어가 됨
이전 탭은 연결 끊김 상태가 됨
```

### 연결 끊김 처리

WebSocket close 시:

```text
player.connected = false
lastSeenAt 갱신
room revision 증가
다른 플레이어에게 상태 broadcast
```

UI 표시:

```text
민수: 연결됨
지훈: 재연결 대기
수아: 연결됨
```

### 방장 연결 끊김

개인용 프로젝트에서는 복잡한 방장 이전은 미룬다.

정책:

```text
방장이 브라우저를 닫아도 서버는 유지
방장은 같은 브라우저 localStorage로 재접속 가능
방장 PC에서 서버를 끄면 방 종료
방장 이전은 후순위
```

## 비공개 상태 필터링

비공개 상태 필터링은 자원 또는 개발 카드가 생기는 순간부터 필수다.

Phase별 적용 기준:

```text
방/대기실 단계: 필터링 필요 거의 없음
초기 배치 단계: 플레이어 식별과 차례 정보 중심
주사위 자원 지급 단계: 상대 자원은 총 장수만 전송
개발 카드 단계: 상대 개발 카드는 총 장수만 전송
강도 단계: 훔친 자원 종류는 공개 로그에 노출하지 않음
```

따라서 주사위 자원 지급을 서버화하기 전에는 `stateView` 또는 그에 준하는 필터링 함수를 먼저 준비해야 한다.

### 서버 내부 상태

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

### 본인에게 보내는 상태

```js
{
  id: "p_1",
  seatIndex: 0,
  name: "민수",
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

### 상대에게 보내는 상태

```js
{
  id: "p_1",
  seatIndex: 0,
  name: "민수",
  resourceCount: 4,
  devCount: 2,
  hiddenVictoryPoints: null
}
```

## 로그 정책

공개 로그에서 허용:

```text
민수가 자원 1장을 빼앗겼습니다.
지훈이 개발 카드를 사용했습니다.
수아가 은행과 교환했습니다.
```

공개 로그에서 금지:

```text
민수가 목재를 빼앗겼습니다.
지훈이 승점 카드를 가지고 있습니다.
수아가 독점 카드를 뽑았습니다.
```

본인 전용 로그는 나중에 추가 가능하다.

예:

```text
당신은 민수에게서 목재 1장을 빼앗았습니다.
```

MVP에서는 공개 로그만 두고 안전하게 덜 자세히 쓰는 편이 좋다.

## 테스트 계획

### 1. 같은 PC 테스트

환경:

```text
Chrome 일반 창
Chrome 시크릿 창
Edge 또는 다른 브라우저
```

확인:

```text
방 만들기
방 참가
대기실 동기화
게임 시작
주사위 동기화
턴 종료 동기화
새로고침 후 재접속
같은 플레이어 탭 복제 시 새 탭이 정식 연결이 되는지 확인
```

### 2. LAN 테스트

환경:

```text
서버 PC
같은 와이파이의 다른 PC 또는 휴대폰
```

확인:

```text
Network URL로 접속 가능
공유 URL의 roomId 인식
닉네임 입력 후 대기실 참가
게임 시작 후 같은 보드 표시
주사위/턴 상태 동기화
```

### 3. 접속 실패 테스트

확인할 상황:

```text
잘못된 roomId
서버 꺼짐
방이 가득 참
게임 시작 후 뒤늦게 참가
토큰이 틀린 reconnect
```

기대:

```text
서버가 죽지 않음
사용자에게 짧은 오류 표시
기존 게임 상태는 유지
```

### 4. 중복 클릭 테스트

확인:

```text
주사위 버튼 빠르게 여러 번 클릭
턴 종료 버튼 빠르게 여러 번 클릭
네트워크 지연 중 같은 명령 반복
```

기대:

```text
서버 상태는 한 번만 변경
UI는 서버 응답 대기 중 버튼 잠금
```

### 5. 비공개 정보 테스트

확인:

```text
내 자원은 상세 표시
상대 자원은 총 장수만 표시
내 개발 카드는 종류 표시
상대 개발 카드는 총 장수만 표시
승점 카드가 상대에게 노출되지 않음
강도로 훔친 자원 종류가 공개 로그에 노출되지 않음
```

적용 시점:

```text
주사위 자원 지급 서버화 전부터 상대 자원 상세를 숨김
개발 카드 서버화 전부터 상대 개발 카드 상세를 숨김
강도 서버화 전부터 공개 로그 정책을 적용
```

## 최소 완료 기준

```text
새로고침 후 같은 플레이어로 돌아온다.
같은 플레이어로 중복 접속하면 새 연결만 정식 연결로 남는다.
연결이 끊긴 플레이어가 UI에 표시된다.
상대 자원/개발 카드 상세가 보이지 않는다.
공개 로그에 비공개 정보가 나오지 않는다.
같은 PC 다중 브라우저 테스트를 통과한다.
LAN의 다른 기기 접속 테스트를 통과한다.
```

## 후순위 개선

```text
방장 이전
게임 상태 JSON 저장
서버 재시작 후 복구
개인 로그와 공개 로그 분리
간단한 채팅
빈 방 자동 삭제
```
