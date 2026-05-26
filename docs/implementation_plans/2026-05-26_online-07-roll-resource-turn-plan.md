# 온라인 07 주사위/자원 지급/턴 종료 구현 계획

작성일: 2026-05-26

## 목적

온라인 모드에서 플레이 단계의 기본 턴 흐름을 서버 권위 방식으로 구현한다.

6단계까지 완료되면 모든 플레이어가 초기 배치를 마치고 `play` phase에 진입한다. 7단계의 목표는 현재 차례 플레이어만 주사위를 굴릴 수 있고, 서버가 자원을 지급하며, 턴 종료 결과가 모든 브라우저에 동기화되도록 만드는 것이다.

## 5-2 이후 공통 전제

모든 온라인 게임 command는 아래 조건을 먼저 검증한다.

```text
room이 존재해야 한다.
room.status === "playing"이어야 한다.
room.status === "ended"이면 ROOM_ENDED로 거절한다.
요청 playerId/playerToken 인증에 성공해야 한다.
요청 플레이어가 left 상태이면 PLAYER_LEFT로 거절한다.
요청 플레이어가 connected=false이면 PLAYER_DISCONNECTED 또는 INVALID_TOKEN으로 거절한다.
room 안에 connected=false이고 left=false인 다른 플레이어가 있으면 roll/endTurn을 거절한다.
```

권장:

```text
누군가 재접속 대기 중이면 턴 진행을 멈춘다.
```

## 범위

포함:

```text
rollDice command
서버 주사위 값 생성
lastDice 저장
자원 지급
endTurn command
active player 변경
round 증가
rolled 상태 동기화
잘못된 차례/중복 주사위/잘못된 턴 종료 거절
```

제외:

```text
7이 나왔을 때 카드 버리기
7이 나왔을 때 강도 이동
강도 자원 훔치기
일반 건설
교환
개발 카드
```

## 7 처리 정책

이번 단계에서는 주사위 합이 7이면 자원 지급 없이 기록만 한다.

```text
game.lastDice = { die1, die2, total: 7 }
game.rolled = true
discard/robber pending은 만들지 않는다.
턴 종료는 가능하게 둔다.
```

이유:

```text
개인용 MVP 진행성을 우선한다.
정식 7/강도 처리는 12단계에서 구현한다.
```

## command 규격

### rollDice

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

### endTurn

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "endTurn"
  }
}
```

## 서버 구현 계획

### rollDice 검증

```text
공통 온라인 command 검증 통과
game.phase === "play"
요청자가 현재 active player
game.rolled === false
winner 없음
pending action 없음
```

active player 판정:

```text
const seat = game.active
const activePlayer = matchState.game.players[seat]
activePlayer.onlinePlayerId === request player.id
```

### rollDice 성공 처리

```text
die1 = 1~6 서버 random
die2 = 1~6 서버 random
total = die1 + die2
game.lastDice = { die1, die2, total }
game.rolled = true
if total !== 7: distributeResources(total)
room.revision += 1
broadcastState(room)
```

주의:

```text
클라이언트가 보낸 주사위 값은 받지 않는다.
Math.random은 서버에서만 사용한다.
```

### 자원 지급

지급 로직:

```text
number token이 total과 같은 타일 탐색
robberTile에 있는 타일 제외
desert 제외
해당 타일 주변 vertex 탐색
owner가 있는 settlement/city만 지급
settlement는 1장
city는 2장
bank 자원 차감
player.resources 증가
```

은행 부족 정책:

```text
은행에 필요한 수량이 있으면 지급
부족하면 가능한 만큼만 지급
bank는 음수가 되면 안 됨
```

비공개 상태:

```text
본인 view: resources 상세 표시
상대 view: resourceCount만 표시
```

권장 로그 데이터:

```text
lastProduction: [{ seatIndex, resource, amount }]
```

주의:

```text
lastProduction을 클라이언트에 보낼 경우 상대 자원 상세 노출이 되지 않도록 필터링하거나 공개 가능한 수준만 보낸다.
```

### endTurn 검증

```text
공통 온라인 command 검증 통과
game.phase === "play"
요청자가 현재 active player
game.rolled === true
winner 없음
pending action 없음
```

### endTurn 성공 처리

```text
game.active = 다음 seat index
active가 0으로 돌아오면 game.round += 1
game.rolled = false
game.usedDevThisTurn = false
game.pendingSettlement = null
game.lastDice는 최근 결과 표시를 위해 유지
room.revision += 1
broadcastState(room)
```

주의:

```text
lastDice를 턴 검증에 사용하지 않는다.
턴 검증은 rolled만 사용한다.
```

## 클라이언트 구현 계획

### 버튼 활성화

온라인 상태에서도 다음 버튼을 서버 command 방식으로 허용한다.

```text
rollButton
endTurnButton
```

활성 조건:

```text
onlineSession.state.status === "playing"
game.phase === "play"
내 seat이 game.active
재접속 대기 중인 player 없음
winner 없음
rollButton: game.rolled === false
endTurnButton: game.rolled === true
```

### 로컬 실행 금지

온라인 상태에서는 기존 로컬 `roll()`과 `endTurn()`을 직접 실행하지 않는다.

```text
rollButton 클릭 -> rollDice command
endTurnButton 클릭 -> endTurn command
상태 변경은 서버 state로만 반영
```

### UI 표시

필수:

```text
현재 차례 플레이어
주사위 결과
내 자원 상세
상대 자원 총량
서버 거절 메시지
재접속 대기 중이면 턴 버튼 비활성
ended 상태면 턴 버튼 비활성
```

## 테스트 계획

### 자동 테스트

```text
node --check server.js
node --check script.js
초기 배치 완료 상태 fixture 구성
현재 차례 플레이어 rollDice 성공
차례가 아닌 플레이어 rollDice 거절
중복 rollDice 거절
setup phase에서 rollDice 거절
room.status ended에서 rollDice/endTurn 거절
다른 player connected=false 상태에서 rollDice/endTurn 거절
left player rollDice/endTurn 거절
rollDice 후 lastDice/rolled 저장 검증
rollDice 후 자원 지급 결과 검증
7이 나오면 자원 지급 없이 rolled=true 검증
상대에게 resources 상세가 노출되지 않는지 검증
rolled=false에서 endTurn 거절
현재 차례 플레이어 endTurn 성공
endTurn 후 active/round/rolled 동기화 검증
```

### 수동 테스트

```text
Chrome 3개 또는 실제 기기 3개 접속
초기 배치 완료
현재 차례 플레이어만 주사위 가능
주사위 후 자원 수량이 본인 화면에 반영
상대 화면에는 카드 총량만 반영
턴 종료 후 다음 플레이어만 주사위 가능
새로고침 후 현재 턴 상태 복구
참가자 탭 닫기 -> 재접속 대기 모달 표시, roll/endTurn 불가
참가자 재접속 -> 모달 닫힘, roll/endTurn 가능
방 나가기 후 ended 상태에서 roll/endTurn 불가
```

## 완료 기준

```text
주사위 값은 서버에서만 생성된다.
자원 지급은 서버에서만 처리된다.
현재 차례가 아닌 플레이어의 roll/endTurn 요청은 거절된다.
중복 주사위 굴림이 불가능하다.
턴 종료 후 모든 브라우저의 active player가 동일하다.
비공개 자원 상세가 상대에게 노출되지 않는다.
재접속 대기/ended/left 상태에서는 턴 진행이 되지 않는다.
오프라인 모드는 기존처럼 동작한다.
```

## 위험 요소

```text
기존 오프라인 자원 지급 로직과 서버 자원 지급 로직이 달라질 수 있다.
7 처리 미구현 상태가 이후 강도 단계와 충돌할 수 있다.
lastDice 유지 정책이 UI 표시와 턴 검증을 혼동시킬 수 있다.
은행 자원 부족 처리 정책이 불명확하면 테스트가 흔들릴 수 있다.
재접속 대기 중 command 거절이 사용자에게 설명되지 않으면 멈춘 것처럼 보일 수 있다.
```

## 다음 단계 연결

7단계 완료 후 8단계에서 일반 도로/마을/도시 건설, 비용 차감, 승점/승리 조건을 구현한다.
# 2026-05-26 작업 전 갱신

## 실제 수정 대상

```text
server.js
script.js
docs/test_plans/2026-05-26_online-07-roll-resource-turn-test-plan.md
docs/final_reports/2026-05-26_online-07-roll-resource-turn-final-report.md
```

## 구현 상세

```text
server.js
- play phase 전용 공통 command 검증을 추가한다.
- rollDice/endTurn command를 추가한다.
- rollDice는 서버 crypto.randomInt로 die1/die2를 생성하고 클라이언트 dice payload를 무시한다.
- rollDice total이 7이 아니면 robberTile을 제외하고 settlement/city 생산량을 bank에서 차감해 player.resources에 지급한다.
- bank는 음수가 되지 않게 자원별 남은 수량만 지급한다.
- endTurn은 rolled=true에서만 허용하고 active/round/rolled/usedDevThisTurn을 갱신한다.
- 성공 ack와 viewer별 state broadcast를 수행한다.

script.js
- 온라인 play phase에서 roll/endTurn 버튼 클릭은 로컬 roll()/endTurn() 대신 서버 command를 전송한다.
- 내 차례, rolled 상태, 재접속 대기, ended 상태에 따라 버튼 활성화를 계산한다.
- rollDiceRolled/endTurnEnded ack를 처리한다.
- 서버 거절 메시지를 addLog로 표시한다.
- 오프라인 roll/endTurn은 기존처럼 유지한다.
```

## 검증 계획

```text
node --check server.js
node --check script.js
WebSocket 자동 테스트:
- 정상 3인 초기 배치 완료 fixture 생성
- 현재 active player rollDice 성공
- 비차례 rollDice 거절
- 중복 rollDice 거절
- rollDice 후 자원 지급
- 강제 테스트 hook으로 7 roll 시 자원 지급 없음
- 상대 resources 상세 미노출
- rolled=false endTurn 거절
- active player endTurn 성공
- active/round/rolled 동기화
- connected=false 유저 존재 시 roll/endTurn 거절
- ended 방 roll/endTurn 거절
브라우저 스모크:
- 페이지 로드와 버튼 DOM 확인
수동 테스트:
- 실제 다중 브라우저에서 버튼 활성화/주사위 표시/자원 총량 표시 확인
```
