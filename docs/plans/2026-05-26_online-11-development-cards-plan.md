# 온라인 11 개발 카드 구현 계획

작성일: 2026-05-26

## 목적

온라인 모드에서 개발 카드 구매와 사용을 서버 권위 방식으로 구현하고, 개발 카드의 비공개 정보를 안전하게 유지한다.

11단계의 목표는 온라인 play phase에서 개발 카드를 구매하고, 사용 가능한 개발 카드를 서버 command로 실행하며, 카드 효과가 모든 브라우저에 동기화되도록 만드는 것이다.

이 프로젝트는 친구끼리 LAN/소규모 온라인 방에서 개인적으로 쓰는 용도이므로, 화려한 카드 애니메이션보다 규칙 정확성, 비공개 정보 보호, 재접속 후 상태 복구를 우선한다.

## 2026-05-26 구현 전 갱신

현재 서버 구현 확인 결과, 아래 기반은 이미 존재한다.

```text
matchState.devDeck
makePlayerView()의 본인 dev 상세/상대 devCount 분리
makeMatchStateView()의 devDeckCount 공개
game.usedDevThisTurn
game.pendingFreeRoads
```

이번 구현은 이 구조를 유지하며 다음을 추가한다.

```text
server.js
- buildCosts.dev 추가
- buyDevCard/playDevCard/placeFreeRoad command 추가
- hiddenVictoryPoints 포함 서버 승점 계산 helper 추가
- boughtRound/boughtTurnSeat 구매 턴 판정 적용
- largestArmy 갱신 helper 추가
- NODE_ENV=test 전용 testSetDevDeck/testSetPlayerDevCards fixture command 추가

script.js
- 온라인 dev/playDev 버튼 활성화 조건 추가
- 온라인 buyDevCard/playDevCard/placeFreeRoad command 연결
- 풍년/독점 온라인 선택 모달 추가
- roadBuilding pending 중 edge 클릭을 placeFreeRoad로 연결
- 클라이언트 devDeck 배열은 온라인 view에서 비워지고 devDeckCount만 사용
```

서버에서 최장 교역로는 11단계에서 새로 구현하지 않는다. 기존 8단계 범위의 건설 승점과 이번 단계의 largestArmy, hiddenVictoryPoints만 서버 승점 계산에 반영한다. 최장 교역로 서버 계산은 별도 안정화 과제로 유지한다.

## 2026-05-26 피드백 반영 갱신

11단계 최종 보고서 피드백 중 즉시 보완할 P1 항목을 이번 수정 범위에 포함한다.

```text
1. 도로 건설 카드 pending deadlock 방지
2. 일반 도로/무료 도로 건설 후 서버 longestRoad 갱신
3. longestRoad 갱신 후 winner 재판정
```

정책:

```text
roadBuilding 사용 직후 합법 무료 도로 위치가 없으면 카드는 사용 처리하되 pending 없이 종료한다.
placeFreeRoad 후 남은 무료 도로 수가 있어도 더 놓을 수 있는 합법 위치가 없으면 pending을 자동 종료한다.
일반 buildRoad와 placeFreeRoad는 같은 updateLongestRoadForSeat() helper를 호출한다.
동률 정책은 기존 오프라인 구현과 맞춰, 최장 길이 5 이상 단독 선두만 longestRoad를 얻고 동률이면 기존 소유자를 유지하거나 소유자가 동률을 잃으면 null로 둔다.
```

## 전제

```text
1~5-2단계가 완료되어 온라인 방 생성/참가/재접속/방 종료 정책이 동작한다.
6단계가 완료되어 초기 배치가 서버 기준으로 끝나고 play phase로 진입한다.
7단계가 완료되어 rollDice/endTurn이 서버 기준으로 동작한다.
8단계가 완료되어 기본 건설이 서버 기준으로 동작한다.
9단계가 완료되어 은행/항구 교환이 서버 기준으로 동작한다.
10단계가 완료되어 플레이어 간 교환 pending state가 온라인에서 동작한다.
오프라인 개발 카드 로직은 기존 동작을 유지한다.
```

12단계에서 7/강도/pending action을 본격 구현할 예정이므로, 기사 카드와 도로 건설 카드는 11단계에서 처리 범위를 명확히 제한해야 한다.

## 범위

포함:

```text
buyDevCard command
playDevCard command
개발 카드 덱 서버 권위 관리
개발 카드 구매 비용 검증
개발 카드 덱 재고 검증
구매 카드 private state 추가
상대에게 devCount만 공개
승점 카드 비공개 점수 반영
구매한 턴 사용 금지
한 턴에 개발 카드 1장 사용 제한
풍년 카드
독점 카드
도로 건설 카드 pending free road 생성
무료 도로 배치 command 또는 기존 buildRoad와의 분기
기사 카드 사용 처리와 최대 기사상 갱신
기사 카드는 11단계에서 사용/기사 수 증가/최대 기사상 갱신까지만 처리
기사 카드의 강도 이동/피해자 선택/약탈은 12단계 범위로 명시
개발 카드 사용/구매 UI 온라인 command 연결
WebSocket 자동 테스트
최종 보고서 작성
```

제외:

```text
개발 카드 애니메이션
카드 히스토리 상세 공개
카드 추천 UI
AI 추천
복잡한 카드 설명 튜토리얼
7/강도 전체 규칙 완성
강도 피해자 선택/약탈 전체 구현
저장/불러오기
배포용 보안/계정/영구 저장
```

## 핵심 정책

```text
온라인에서는 클라이언트가 개발 카드 덱을 직접 조작하지 않는다.
온라인에서는 클라이언트가 개발 카드 효과를 직접 적용하지 않는다.
개발 카드 구매/사용은 서버 command로만 처리한다.
개발 카드 종류는 본인에게만 보인다.
상대에게는 개발 카드 총 장수(devCount)만 보인다.
승점 카드는 사용하지 않고 보유만으로 점수에 반영한다.
승점 카드 종류와 개수는 본인에게만 보인다.
구매한 턴에는 해당 카드를 사용할 수 없다.
승점 카드를 제외한 개발 카드는 한 턴에 1장만 사용할 수 있다.
주사위를 굴리기 전에도 개발 카드 사용은 가능하다.
단, 구매는 주사위를 굴린 뒤에만 가능하다.
pending player trade, pending free road, pending robber/discard 등 다른 pending action 중에는 구매/사용을 막는다.
11단계에서는 기사 카드가 pending robber 상태를 생성하지 않는다.
11단계 도로 건설 카드는 별도 pendingFreeRoads/freeRoadOwnerSeat 방식으로 처리하고, 12단계의 공통 pendingAction과 섞지 않는다.
```

주사위 전 개발 카드 사용:

```text
Catan 규칙상 개발 카드는 주사위 전에도 사용할 수 있다.
단, 이번 턴에 산 카드는 사용할 수 없다.
한 턴 1장 제한은 주사위 전/후를 통틀어 적용한다.
```

## 서버 데이터 모델

현재 서버에는 다음 구조가 있다.

```text
matchState.devDeck
game.devCardSeq
game.usedDevThisTurn
player.dev
player.knights
game.largestArmy
game.pendingFreeRoads
```

개발 카드 객체 권장 형태:

```json
{
  "id": "dev-12",
  "type": "knight",
  "boughtRound": 3,
  "boughtTurnSeat": 0
}
```

현재 오프라인 코드가 `boughtTurn`을 round 기준으로 사용하고 있으므로, 온라인 구현에서는 아래 중 하나를 선택한다.

권장:

```text
boughtRound와 boughtTurnSeat를 모두 저장한다.
구매한 턴 판정은 boughtRound === game.round && boughtTurnSeat === game.active로 한다.
```

간소화 대안:

```text
boughtTurn = `${game.round}:${game.active}` 문자열로 저장한다.
```

주의:

```text
round만 저장하면 같은 round에서 다음 플레이어 턴에도 "방금 산 카드"로 오인될 수 있다.
온라인에서는 반드시 active seat까지 포함해 구매 턴을 판정한다.
```

## State View 설계

본인 view:

```json
{
  "dev": [
    {
      "id": "dev-12",
      "type": "yearPlenty",
      "boughtRound": 3,
      "boughtTurnSeat": 0
    }
  ],
  "devCount": 1,
  "hiddenVictoryPoints": 1
}
```

상대 view:

```json
{
  "devCount": 1
}
```

공개 가능:

```text
devCount
knights
largestArmy 보유자
devDeckCount
```

비공개:

```text
개발 카드 id
개발 카드 type
승점 카드 개수
구매 턴 정보
사용 가능한 카드 목록
matchState.devDeck 원본 배열
```

개발 카드 덱 공개 정책:

```text
클라이언트 state에는 matchState.devDeck 배열을 절대 내려주지 않는다.
본인에게도 덱 순서, 남은 카드 종류, 다음 카드 정보는 보이지 않는다.
공개 가능한 값은 devDeckCount 숫자뿐이다.
자동 테스트에서 모든 player view에 devDeck 배열이 없는지 확인한다.
```

## Command 규격

### buyDevCard

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "buyDevCard"
  }
}
```

### playDevCard: knight

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "playDevCard",
    "cardId": "dev-12"
  }
}
```

11단계 기사 카드 정책:

```text
카드를 제거한다.
player.knights += 1
game.usedDevThisTurn = true
최대 기사상을 갱신한다.
강도 이동, 피해자 선택, 약탈은 처리하지 않는다.
pending robber, selectedRobber, pendingAction 같은 강도 관련 상태를 만들지 않는다.
UI/보고서에는 "기사의 강도 이동 효과는 12단계에서 구현 예정"이라고 명확히 남긴다.
```

### playDevCard: yearPlenty

```json
{
  "type": "command",
  "requestId": "r3",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "playDevCard",
    "cardId": "dev-13",
    "resources": ["forest", "field"]
  }
}
```

규칙:

```text
resources는 길이 2 배열이어야 한다.
같은 자원을 두 번 선택할 수 있다.
은행 재고가 있어야 한다.
같은 자원 2장을 고른 경우 은행에 해당 자원이 2개 이상 있어야 한다.
```

### playDevCard: monopoly

```json
{
  "type": "command",
  "requestId": "r4",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "playDevCard",
    "cardId": "dev-14",
    "resource": "mountain"
  }
}
```

규칙:

```text
resource는 유효한 resource id여야 한다.
다른 모든 플레이어의 해당 자원을 전부 가져온다.
가져온 총량만 공개 로그에 표시한다.
상대별 세부 수량은 공개하지 않는다.
```

### playDevCard: roadBuilding

```json
{
  "type": "command",
  "requestId": "r5",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "playDevCard",
    "cardId": "dev-15"
  }
}
```

성공 후:

```text
game.pendingFreeRoads = min(2, player.roads)
game.freeRoadOwnerSeat = active seat index
game.usedDevThisTurn = true
카드는 player.dev에서 제거
```

무료 도로 배치 command:

```json
{
  "type": "command",
  "requestId": "r6",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "placeFreeRoad",
    "edgeId": 12
  }
}
```

정책:

```text
pendingFreeRoads > 0이면 일반 buildRoad, endTurn, bankTrade, playerTrade, buyDevCard, playDevCard를 막는다.
placeFreeRoad는 비용 없이 도로를 놓는다.
도로 연결 규칙은 일반 도로 건설과 동일하다.
남은 도로 말이 없거나 합법 위치가 없으면 pending을 종료한다.
도로 2개를 모두 놓으면 pending을 종료한다.
11단계에서는 이 상태를 game.pendingFreeRoads와 game.freeRoadOwnerSeat로만 표현한다.
12단계에서 공통 pendingAction을 도입하더라도 11단계 구현 중에는 두 모델을 동시에 쓰지 않는다.
```

승점 카드:

```text
playDevCard로 사용할 수 없다.
구매 즉시 player.dev에 추가된다.
본인 totalPoints에는 반영된다.
상대에게는 devCount만 보인다.
10점 이상이 되면 서버가 winner를 설정한다.
```

승점 계산 기준:

```text
서버의 승리 판정은 공개 건설 점수 + longestRoad 점수 + largestArmy 점수 + hiddenVictoryPoints 합산값을 기준으로 한다.
hiddenVictoryPoints는 본인 view와 winner 판정에만 사용하고, 상대 view에는 승점 카드 세부 정보나 숨은 점수를 노출하지 않는다.
개발 카드 구매 직후 승점 카드 때문에 10점 이상이 되면 즉시 winner를 설정한다.
```

## 서버 구현 계획

### 1. 공통 검증

buyDevCard 검증:

```text
room 존재
room.status === "playing"
인증 성공
요청 플레이어 left=false, connected=true
다른 disconnected 플레이어 없음
game.phase === "play"
winner 없음
현재 active player
game.rolled === true
pending action 없음
pendingPlayerTrade 없음
devDeck.length > 0
비용 pasture 1, field 1, mountain 1 보유
은행으로 비용 반납 가능
```

playDevCard 검증:

```text
room 존재
room.status === "playing"
인증 성공
요청 플레이어 left=false, connected=true
다른 disconnected 플레이어 없음
game.phase === "play"
winner 없음
현재 active player
pending action 없음
pendingPlayerTrade 없음
game.usedDevThisTurn === false
cardId가 본인 dev에 존재
card.type !== "victory"
카드가 이번 턴에 구매된 카드가 아님
카드별 payload 유효
```

주의:

```text
playDevCard는 game.rolled === false여도 허용한다.
buyDevCard는 game.rolled === true여야 한다.
```

### 2. buyDevCard 처리 순서

```text
1. buyDevCard 검증을 통과한다.
2. 개발 카드 비용을 플레이어 자원에서 차감한다.
3. 비용을 은행에 반납한다.
4. matchState.devDeck에서 카드 type 1개를 제거한다.
5. game.devCardSeq += 1
6. 카드 객체를 생성한다.
7. boughtRound와 boughtTurnSeat를 기록한다.
8. player.dev에 추가한다.
9. 승점 카드라면 winner 조건을 확인한다.
10. room.revision += 1
11. broadcastState(room)
```

### 3. playDevCard 처리 순서

공통:

```text
1. playDevCard 검증을 통과한다.
2. 카드 type을 확인한다.
3. type별 효과를 처리한다.
4. victory가 아닌 카드는 player.dev에서 제거한다.
5. game.usedDevThisTurn = true
6. winner 조건을 확인한다.
7. room.revision += 1
8. broadcastState(room)
```

카드별:

```text
yearPlenty: 은행에서 resources 2장을 플레이어에게 지급
monopoly: 다른 모든 플레이어에게서 resource를 회수해 플레이어에게 지급
roadBuilding: pendingFreeRoads와 freeRoadOwnerSeat 설정
knight: player.knights 증가, largestArmy 갱신, 강도 pending/이동/약탈은 생성하지 않음
```

### 4. placeFreeRoad 처리 순서

```text
1. pendingFreeRoads > 0인지 확인한다.
2. 요청자가 freeRoadOwnerSeat의 online player인지 확인한다.
3. edgeId가 유효한지 확인한다.
4. edge가 비어 있는지 확인한다.
5. 일반 도로 연결 규칙을 확인한다.
6. 비용 차감 없이 edge.owner를 설정한다.
7. player.roads -= 1
8. game.pendingFreeRoads -= 1
9. pendingFreeRoads가 0이면 freeRoadOwnerSeat를 null로 초기화한다.
10. winner/longestRoad 조건은 구현되어 있다면 갱신한다.
11. room.revision += 1
12. broadcastState(room)
```

## 클라이언트 구현 계획

### 1. 온라인 버튼 연결

온라인 play phase에서:

```text
개발 카드 구매 버튼 -> buyDevCard command
카드 사용 버튼 -> 서버 private dev 목록 기반 모달
카드 사용 모달에서 선택 -> playDevCard command
도로 건설 카드 pending 중 board edge 클릭 -> placeFreeRoad command
```

오프라인:

```text
기존 buyDevCard/useDevCard 로컬 로직 유지
```

### 2. 개발 카드 구매 UI

```text
내 차례가 아니면 disabled
game.rolled === false이면 disabled
devDeckCount === 0이면 disabled
자원이 부족하면 disabled 또는 서버 거부 메시지 표시
pendingPlayerTrade 또는 pending action 중이면 disabled
온라인에서는 구매 성공 후 서버 state로만 카드가 표시된다.
```

### 3. 개발 카드 사용 UI

```text
내 private dev 목록에서 사용 가능한 카드만 표시한다.
승점 카드는 사용 목록에 표시하지 않는다.
이번 턴에 산 카드는 대기 상태로 표시한다.
game.usedDevThisTurn === true이면 사용 버튼 disabled
주사위 전에도 사용 가능해야 한다.
pending action 중이면 disabled
```

카드별 UI:

```text
yearPlenty: 받을 자원 2개 선택 모달
monopoly: 독점할 자원 1개 선택 모달
roadBuilding: 카드 사용 후 도로 2개 배치 안내, board edge 클릭
knight: 11단계 제한 정책 안내 또는 12단계 pending 연결 안내
```

### 4. 비공개 정보 표시

본인:

```text
개발 카드 종류별 개수 표시
사용 가능/대기 상태 표시
숨은 승점 표시
```

상대:

```text
개발 카드 총 장수만 표시
숨은 승점과 카드 종류 미표시
```

## 오류 코드

권장:

```text
DEV_DECK_EMPTY
NOT_ENOUGH_RESOURCES
ROLL_REQUIRED
NOT_YOUR_TURN
DEV_CARD_NOT_FOUND
DEV_CARD_NOT_PLAYABLE
DEV_CARD_BOUGHT_THIS_TURN
DEV_CARD_ALREADY_USED
INVALID_DEV_PAYLOAD
BANK_RESOURCE_EMPTY
PENDING_ACTION
ROOM_NOT_READY
ROOM_ENDED
INVALID_ACTION
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
buyDevCard 성공
buyDevCard 주사위 전 거부
buyDevCard 자원 부족 거부
buyDevCard 덱 빈 경우 거부
구매 후 본인 view에 카드 상세 표시
구매 후 상대 view에는 devCount만 표시
구매한 턴 playDevCard 거부
다음 자기 턴에 playDevCard 허용
한 턴 1장 사용 제한
승점 카드는 playDevCard 거부
승점 카드 보유 시 본인 hiddenVictoryPoints 반영
승점 카드로 10점 도달 시 winner 설정
yearPlenty 자원 2개 지급
yearPlenty 은행 재고 부족 거부
monopoly 지정 자원 회수
roadBuilding pendingFreeRoads 생성
placeFreeRoad 성공
placeFreeRoad 비용 미차감
placeFreeRoad 권한 없는 플레이어 거부
pendingFreeRoads 중 endTurn/build/bankTrade/playerTrade/buyDevCard/playDevCard 거부
knight 사용 시 knights 증가
knight 사용 시 largestArmy 갱신
knight 사용 시 pending robber/action이 생성되지 않음
client view에 matchState.devDeck/devDeck 배열이 노출되지 않음
client view에는 devDeckCount 숫자만 노출
승점 계산이 공개 건설 점수 + longestRoad + largestArmy + hiddenVictoryPoints 기준으로 처리됨
ended/left/disconnected 상태 command 거부
```

### 수동 검증

```text
1. 서버를 완전히 재시작한다.
2. 브라우저를 강력 새로고침한다.
3. 새 방을 만들고 3명 이상 입장한다.
4. 게임 시작 후 초기 배치를 완료한다.
5. 현재 차례 플레이어가 주사위를 굴린다.
6. 개발 카드를 구매한다.
7. 본인에게만 카드 종류가 보이는지 확인한다.
8. 상대에게는 개발 카드 장수만 보이는지 확인한다.
9. 같은 턴에 방금 산 카드가 사용되지 않는지 확인한다.
10. 다음 자기 턴에 사용 가능한지 확인한다.
11. 풍년/독점/도로 건설 카드 효과를 확인한다.
12. 도로 건설 pending 중 다른 행동이 막히는지 확인한다.
13. 승점 카드가 상대에게 노출되지 않는지 확인한다.
14. 재접속 후 본인 카드 목록과 상대 devCount가 복구되는지 확인한다.
15. 오프라인 개발 카드 기능이 기존처럼 동작하는지 확인한다.
16. 기사 카드를 사용해도 11단계에서는 강도 이동/약탈 UI가 열리지 않는지 확인한다.
17. 브라우저 개발자 도구에서 수신 state에 devDeck 배열이 없는지 확인한다.
```

## 완료 기준

```text
온라인 개발 카드 구매가 서버 command로만 처리된다.
온라인 개발 카드 사용이 서버 command로만 처리된다.
개발 카드 덱은 서버 내부에만 유지된다.
본인에게만 개발 카드 상세가 보인다.
상대에게는 devCount만 보인다.
구매한 턴 사용 금지가 정확히 적용된다.
한 턴 1장 사용 제한이 정확히 적용된다.
승점 카드가 비공개 점수로 반영된다.
풍년/독점/도로 건설 카드 효과가 서버 기준으로 동작한다.
기사 카드와 최대 기사상 처리가 11단계 정책에 맞게 동작한다.
기사 카드가 11단계에서 강도 pending/action을 만들지 않는다.
클라이언트 state에는 devDeck 배열이 없고 devDeckCount만 노출된다.
승리 판정은 공개 점수와 숨은 승점 카드 점수를 합산해 서버에서 처리된다.
pending action 중 다른 command가 막힌다.
새로고침/재접속 후 private dev state가 복구된다.
오프라인 개발 카드 기능은 기존처럼 유지된다.
자동 테스트와 수동 테스트 결과가 보고서에 기록된다.
```

## 위험 요소와 대응

```text
구매 턴 판정이 round만으로 처리되면 다른 플레이어 턴까지 사용 금지될 수 있다.
대응: boughtRound와 boughtTurnSeat를 함께 저장한다.

상대에게 dev type이나 승점 카드 정보가 노출될 수 있다.
대응: makePlayerView에서 viewer 본인에게만 dev 상세를 내려준다.

roadBuilding pending 중 다른 행동이 가능하면 상태가 꼬일 수 있다.
대응: pendingFreeRoads > 0이면 placeFreeRoad 외 진행 command를 막는다.

기사 카드가 12단계 강도 처리와 충돌할 수 있다.
대응: 11단계에서는 기사 사용/knights/largestArmy까지만 처리하고 강도 이동/약탈/pending 생성은 하지 않는다.

도로 건설 카드의 pendingFreeRoads와 12단계 공통 pendingAction이 중복될 수 있다.
대응: 11단계 구현 중에는 pendingFreeRoads/freeRoadOwnerSeat만 사용하고, 12단계에서 통합 여부를 별도 결정한다.

승점 카드가 winner 계산에는 들어가지만 UI에는 숨겨져야 해서 계산 기준이 흔들릴 수 있다.
대응: 서버 점수 계산 helper에서 공개 건설 점수, longestRoad, largestArmy, hiddenVictoryPoints를 한 번에 합산한다.

devDeckCount를 만들다가 실수로 devDeck 배열 전체를 view에 포함할 수 있다.
대응: makePlayerView 테스트에서 모든 viewer state에 devDeck 배열이 없는지 검증한다.

풍년과 독점이 상대 자원 상세를 노출할 수 있다.
대응: 공개 로그에는 총량만 표시하고, view state는 기존 private resource 정책을 따른다.
```

## 다음 단계 연결

11단계 완료 후에는 12단계 7/강도/pending action으로 넘어간다.

```text
11단계: 개발 카드
12단계: 7/강도/pending action
13단계: 전체 회귀 테스트 및 안정화
```
