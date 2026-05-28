# 봇 01 플레이어 모델 및 로비 계획

작성일: 2026-05-26

## 목적

기본 플레이어봇을 온라인 방의 일반 좌석으로 추가할 수 있게 한다. 이 단계는 봇의 실질적인 턴 행동보다 먼저, 봇이 room/player/game state에 안전하게 들어오는 기반을 만든다.

## 관련 문서

```text
docs/plans/2026-05-26_bot-00-basic-bot-roadmap.md
docs/plans/2026-05-26_bot-mode-considerations.md
docs/plans/2026-05-26_online-02-ui-lobby-plan.md
docs/plans/2026-05-26_online-03-protocol-sync-plan.md
```

## 범위

포함:

```text
room player에 isBot/botDifficulty 추가
game player에 isBot/botDifficulty 전달
방장 전용 봇 추가/제거 command
로비 UI의 봇 표시
봇 포함 게임 시작 조건
connected 검사에서 봇 ready 처리
```

제외:

```text
봇 자동 턴 실행
봇 초기 배치 판단
봇 일반 행동 판단
오프라인 봇 UI
게임 시작 후 봇 제거
봇 난이도 선택 UI
```

## 현재 상태

현재 온라인 로비는 실제 WebSocket 참가자만 room.players에 포함한다. 서버에는 `maxPlayers = 4`, `minStartPlayers = 3` 기준이 있고, 클라이언트 로비 UI는 참가자 수와 연결 상태를 기준으로 시작 버튼을 활성화한다.

봇은 socket이 없기 때문에 기존 사람 참가자와 똑같이 connected/reconnect 모델을 적용하면 안 된다.

## 설계

### 봇 room player

```js
{
  id: "bot_xxxxxx",
  seatIndex: 2,
  name: "봇 1",
  color: "#70c1b3",
  connected: true,
  left: false,
  isBot: true,
  botDifficulty: "basic",
  joinedAt: Date.now()
}
```

봇은 사람 플레이어와 같은 좌석 배열에 들어가지만, 다음 점은 다르게 취급한다.

```text
socket 없음
playerToken 인증 대상 아님
reconnect 대상 아님
hostPlayerId 대상 아님
connected 상태 변경 대상 아님
localStorage identity 저장 대상 아님
```

호환성을 위해 public player의 `connected`는 true로 둘 수 있지만, UI에서는 봇을 "연결됨"으로 표시하지 않고 "봇" 또는 "준비됨"으로 표시한다.

### 시작 조건

```text
최소 사람 수: 1명
총 플레이어 수: 3~4명
봇 최대 수: 총 플레이어 수가 4명을 넘지 않는 범위
사람 플레이어는 모두 connected여야 함
봇 플레이어는 ready로 간주
방장만 시작 가능
room.status는 lobby여야 함
```

구현 시 기존 `minStartPlayers` 상수의 의미가 바뀌지 않게 주의한다.

```text
minHumanPlayers = 1
minTotalPlayers = 3
maxPlayers = 4
```

서버와 클라이언트 UI 모두 위 조건을 같은 의미로 사용해야 한다.

봇은 실제 좌석을 차지한다. 따라서 사람 1명 + 봇 3명 상태에서는 새 사람이 바로 입장할 수 없다. 1차 범위에서는 사람 입장 시 봇을 자동 대체하지 않고, 방장이 lobby에서 봇을 제거한 뒤 새 사람이 참가하는 방식으로 처리한다.

자동 봇 대체를 제외하는 이유:

```text
seatIndex 재정렬과 host 표시가 복잡해진다.
이미 공유된 로비 상태와 참가자 목록이 갑자기 바뀔 수 있다.
1차 목표는 부족한 자리를 수동으로 봇으로 채우는 것이다.
```

### command

```text
addBot
removeBot
```

`addBot`은 방장만 사용할 수 있고, lobby 상태에서만 허용한다. `removeBot`도 lobby 상태에서만 허용하며 사람 플레이어를 제거할 수 없어야 한다.

`removeBot`은 명시적인 bot `playerId`를 받는다. UI에서 단일 "봇 제거" 버튼만 둘 경우에도, 내부적으로는 가장 늦게 추가된 봇의 id를 선택해서 보내는 방식으로 통일한다.

권장 UI는 각 봇 row에 작은 제거 버튼을 두는 방식이다. 단일 "봇 제거" 버튼을 사용할 경우에는 제거 대상이 마지막으로 추가된 봇임을 title 또는 안내 문구로 명확히 한다.

거절해야 하는 경우:

```text
비방장 요청
room.status가 lobby가 아님
총 플레이어 수가 이미 maxPlayers
봇이 아닌 playerId 제거 요청
존재하지 않는 bot playerId
제거 후 총 플레이어 수가 0이 되는 비정상 상태
사람이 입장할 자리를 만들기 위해 자동으로 봇을 제거하라는 joinRoom 요청
```

### 사람 입장/퇴장 정책

```text
joinRoom은 사람과 봇을 합산한 총 플레이어 수가 maxPlayers 이상이면 기존처럼 거절한다.
사람이 들어올 때 봇을 자동 제거하지 않는다.
방장이 lobby에서 봇을 수동 제거해야 빈자리가 생긴다.
사람이 lobby에서 나가면 남은 사람에게만 hostPlayerId를 이전한다.
남은 사람이 없고 봇만 남으면 room을 종료하거나 제거한다.
봇은 hostPlayerId가 될 수 없다.
```

게임 시작 후 leave 정책은 이 단계에서 바꾸지 않는다. playing 상태의 봇 제거/대체는 제외 범위다.

## 구현 순서

```text
1. 봇 판별 helper 추가
2. 봇 생성 함수 추가
3. addBot/removeBot command 처리
4. seatIndex 재정렬에서 봇도 사람과 동일하게 처리
5. startGame 조건을 사람 수/총 수/연결 상태로 분리
6. publicPlayer와 lobbyState에 isBot/botDifficulty 포함
7. createInitialMatchState/createGamePlayer 경로에 isBot/botDifficulty 전달
8. joinRoom/leaveRoom/host transfer에서 봇 좌석 정책 반영
9. 클라이언트 로비에 봇 추가/제거 버튼 추가
10. 로비 참가자 목록에 봇 배지 표시
11. 로비 시작 버튼 문구와 title을 새 시작 조건에 맞게 수정
```

## 수정 대상 파일

```text
server.js
- maxPlayers/minStartPlayers 주변 시작 조건
- createPlayer/publicPlayer/createRoom/joinRoom/startGame 관련 함수
- createInitialMatchState/createGamePlayer의 player field 전달
- WebSocket command dispatch에 addBot/removeBot 추가
- joinRoom의 maxPlayers 검사와 봇 좌석 정책
- leaveRoom/host transfer/seatIndex 재정렬 흐름의 봇 영향 점검

script.js
- online lobby state 렌더링
- lobbyStartButton 활성화 조건
- lobbyStartHint/title 문구
- addBot/removeBot 버튼 이벤트
- lobby player row 표시
- 봇 row 제거 버튼 또는 단일 제거 버튼의 대상 표시

index.html
- 로비 내 방장 전용 봇 추가/제거 컨트롤

styles.css
- 봇 배지, 로비 버튼 배치, disabled 상태
```

## 데이터/프로토콜 계약

서버가 클라이언트에 보내는 public player에는 다음 값만 포함한다.

```js
{
  id: "bot_xxxxxx",
  seatIndex: 2,
  name: "봇 1",
  color: "#70c1b3",
  connected: true,
  left: false,
  isBot: true,
  botDifficulty: "basic"
}
```

`joinedAt`은 정렬이나 디버그 목적으로 서버 내부에 유지할 수 있으나, 클라이언트 노출이 꼭 필요하지 않으면 public player에서 제외한다.

노출 금지:

```text
bot internal token
bot runner 상태
bot timer id
서버 내부 평가 점수
```

command payload:

```json
{ "name": "addBot" }
```

1차 범위에서는 difficulty payload를 받지 않는다. 서버는 항상 `botDifficulty: "basic"`을 사용한다. 나중에 난이도 UI가 생기면 payload를 확장한다.

```json
{ "name": "removeBot", "playerId": "bot_xxxxxx" }
```

matchState의 game player에는 최소한 다음 값이 전달되어야 한다.

```js
{
  id: 2,
  onlinePlayerId: "bot_xxxxxx",
  name: "봇 1",
  isBot: true,
  botDifficulty: "basic"
}
```

이 단계에서는 봇이 자동 행동하지 않지만, 2단계 runner가 현재 player를 봇으로 판별할 수 있도록 matchState에도 봇 정보가 들어가야 한다.

## 상세 구현 체크리스트

```text
[ ] 사람 수 계산 helper를 만든다.
[ ] 총 active player 수 계산 helper를 만든다.
[ ] 봇 생성 시 고유 id와 이름을 안정적으로 만든다.
[ ] 봇 이름은 삭제 후 재추가해도 중복되지 않게 만든다.
[ ] 봇 색상은 seatIndex 재정렬 후에도 기존 사람 색상과 충돌하지 않게 한다.
[ ] 봇은 socket map에 넣지 않는다.
[ ] 봇은 reconnect 대상에서 제외한다.
[ ] 봇은 localStorage identity 저장/복구 대상에서 제외한다.
[ ] startGame은 사람 connected와 봇 ready를 분리해서 검사한다.
[ ] bot 제거 후 seatIndex를 0부터 다시 정렬한다.
[ ] hostPlayerId가 봇으로 설정되지 않게 한다.
[ ] host가 lobby에서 나가면 남은 사람에게만 host를 이전한다.
[ ] 남은 사람이 없고 봇만 남으면 room을 종료하거나 제거한다.
[ ] joinRoom은 봇을 자동 대체하지 않고 maxPlayers 초과를 거절한다.
[ ] room이 lobby가 아니면 addBot/removeBot을 거절한다.
[ ] removeBot은 명시된 bot playerId만 제거한다.
[ ] createGamePlayer 결과에 isBot/botDifficulty를 포함한다.
[ ] lobby start hint/title의 "3명 이상" 문구를 사람+봇 기준으로 바꾼다.
```

## UI 변경

로비에서 방장에게만 봇 제어를 노출한다.

```text
[봇 추가] [봇 제거]
참가자
- 민수  방장  연결됨
- 봇 1  봇  [제거]
- 봇 2  봇  [제거]
```

참가자는 봇 버튼을 볼 수 없거나 disabled 상태로 본다.

버튼 상태:

```text
봇 추가: 방장 + lobby + 총 플레이어 수 < 4일 때 활성화
봇 제거: 방장 + lobby + 봇이 1명 이상 있을 때 활성화
게임 시작: 방장 + lobby + 사람 1명 이상 + 총 3~4명 + 모든 사람 connected
```

시작 조건 안내 문구는 "사람 1명 이상, 사람+봇 합산 3명 이상이면 시작할 수 있습니다."처럼 기존 3명 이상 문구보다 구체적으로 표시한다.

봇 상태 표시 문구:

```text
사람: 연결됨 / 연결 끊김 / 방장
봇: 봇 / 준비됨
```

봇 row에는 "연결됨"을 표시하지 않는다. socket이 없는 존재를 네트워크 연결된 플레이어처럼 보이게 만들지 않기 위해서다.

## 검증 계획

수동:

```text
방장이 방을 만든다.
봇 추가 버튼으로 봇을 1명 추가한다.
참가자 목록에 봇 배지가 보인다.
최대 4명까지만 추가된다.
봇 제거가 lobby 상태에서만 동작한다.
참가자는 봇을 추가/제거할 수 없다.
사람 1명 + 봇 2명으로 시작 버튼이 활성화된다.
사람 0명 + 봇만 있는 게임은 만들 수 없다.
사람 1명 + 봇 3명 상태에서 새 사람 참가가 거절된다.
방장이 봇을 제거하면 새 사람 참가가 가능해진다.
방장이 lobby에서 나가면 남은 사람에게만 방장이 이전된다.
남은 사람이 없고 봇만 남으면 방이 종료되거나 제거된다.
```

자동:

```text
addBot command 성공
addBot 비방장 거절
addBot maxPlayers 초과 거절
addBot playing 상태 거절
removeBot 성공
removeBot 사람 대상 거절
removeBot 없는 bot playerId 거절
removeBot 비방장 거절
removeBot playing 상태 거절
joinRoom 사람 1 + 봇 3 상태에서 maxPlayers 초과 거절
leaveRoom 후 hostPlayerId가 봇이 되지 않음
leaveRoom 후 봇만 남은 room 정리
startGame 사람 1 + 봇 2 허용
startGame 사람 1 + 봇 1 거절
startGame 사람 0 + 봇 3 거절
startGame 사람 2 + 봇 1 허용
createInitialMatchState 이후 game player에 isBot 유지
publicPlayer에 bot internal token/runner 정보가 없음
```

## 위험 요소

```text
connected 검사에서 봇이 disconnected로 취급되어 시작이 막힐 수 있다.
봇 제거 후 seatIndex가 꼬일 수 있다.
reconnect 대상에 봇이 포함될 수 있다.
public state에서 봇 token 같은 내부 값이 노출될 수 있다.
서버 시작 조건과 클라이언트 시작 버튼 조건이 달라질 수 있다.
matchState.game.players에 isBot이 누락되어 2단계 runner가 봇을 감지하지 못할 수 있다.
봇 이름을 삭제/재추가할 때 중복 이름이 생길 수 있다.
사람 입장 시 봇 자동 대체를 기대한 사용자가 maxPlayers 거절을 혼란스러워할 수 있다.
host leave 처리에서 봇이 방장으로 승격될 수 있다.
봇 connected=true를 UI가 그대로 표시해 네트워크 연결된 사용자처럼 보일 수 있다.
seatIndex 재정렬 후 색상/이름/host 표시가 꼬일 수 있다.
```

## 롤백/복구 방법

```text
addBot/removeBot command dispatch를 제거하면 사람 전용 로비로 되돌릴 수 있어야 한다.
startGame 조건 변경은 기존 minStartPlayers=3 사람 기준으로 되돌릴 수 있게 작게 수정한다.
UI 버튼은 숨겨도 기존 create/join/start 흐름이 유지되어야 한다.
joinRoom/leaveRoom 변경은 봇 관련 분기만 되돌리면 사람 전용 방 정책이 기존처럼 동작해야 한다.
```

## 테스트 산출물

이 단계 완료 후 작성할 문서:

```text
docs/tests/2026-05-26_bot-01-player-model-lobby-test-plan.md
docs/reports/2026-05-26_bot-01-player-model-lobby-final-report.md
```

## 완료 기준

```text
온라인 로비에서 방장이 봇을 추가/제거할 수 있다.
봇이 참가자 목록에 명확히 표시된다.
사람+봇 합산 3~4명 조건으로 게임을 시작할 수 있다.
사람 0명 + 봇만 있는 방은 시작할 수 없다.
게임 시작 후 matchState.game.players에 봇 정보가 포함된다.
봇은 host/reconnect/localStorage identity 대상이 아니다.
봇은 실제 좌석을 차지하며, 사람 입장 시 자동 대체되지 않는다.
사람 전용 온라인 로비 흐름이 회귀하지 않는다.
```
