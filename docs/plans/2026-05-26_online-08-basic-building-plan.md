# 온라인 08 기본 건설 구현 계획

작성일: 2026-05-26

## 목적

온라인 모드에서 플레이 단계의 기본 건설을 서버 권위 방식으로 구현한다.

7단계까지 완료되면 주사위, 자원 지급, 턴 종료가 서버 기준으로 동작한다. 8단계의 목표는 도로/마을/도시 건설을 온라인에서도 가능하게 만들고, 비용 차감과 승점/승리 조건이 모든 브라우저에 일관되게 반영되도록 하는 것이다.

## 5-2 이후 공통 전제

모든 온라인 게임 command는 아래 조건을 먼저 검증한다.

```text
room이 존재해야 한다.
room.status === "playing"이어야 한다.
room.status === "ended"이면 ROOM_ENDED로 거절한다.
요청 playerId/playerToken 인증에 성공해야 한다.
요청 플레이어가 left 상태이면 PLAYER_LEFT로 거절한다.
요청 플레이어가 connected=false이면 PLAYER_DISCONNECTED 또는 INVALID_TOKEN으로 거절한다.
room 안에 connected=false이고 left=false인 다른 플레이어가 있으면 건설 command를 거절한다.
```

권장:

```text
누군가 재접속 대기 중이면 건설을 포함한 모든 게임 진행을 멈춘다.
```

## 범위

포함:

```text
buildRoad command
buildSettlement command
buildCity command
현재 차례 검증
주사위 이후 행동 검증
건설 위치 검증
자원 비용 검증 및 차감
남은 건설물 수량 검증
도로/마을/도시 상태 동기화
공개 승점 계산
승리 조건 검증
```

제외:

```text
최장 교역로 고도화
은행/항구 교환
플레이어 간 교환
개발 카드
7/강도 처리
특수 카드로 무료 도로 놓기
```

최장 교역로 정책:

```text
기존 오프라인 로직이 안정적이면 서버로 이식한다.
이식 비용이 크면 8단계에서는 제외하고 별도 안정화 과제로 남긴다.
단, 제외하는 경우 보고서에 명확히 남긴다.
```

## command 규격

### buildRoad

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "buildRoad",
    "edgeId": 12
  }
}
```

### buildSettlement

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "buildSettlement",
    "vertexId": 7
  }
}
```

### buildCity

```json
{
  "type": "command",
  "requestId": "r3",
  "roomId": "abc123",
  "playerId": "p_1",
  "playerToken": "secret",
  "payload": {
    "name": "buildCity",
    "vertexId": 7
  }
}
```

## 서버 구현 계획

### 공통 검증

```text
공통 온라인 command 검증 통과
game.phase === "play"
요청자가 현재 active player
game.rolled === true
winner 없음
pending action 없음
payload id가 정수
```

active player 판정:

```text
const seat = game.active
const activePlayer = matchState.game.players[seat]
activePlayer.onlinePlayerId === request player.id
```

### 비용 상수

```text
road: forest 1, hill 1
settlement: forest 1, hill 1, pasture 1, field 1
city: field 2, mountain 3
```

서버 처리:

```text
플레이어 자원이 충분한지 확인
플레이어 자원 차감
은행 자원 증가
클라이언트가 보낸 자원 수량은 신뢰하지 않음
```

### buildRoad 검증

```text
edgeId가 유효하다.
edge.owner가 null 또는 undefined이다.
player.roads > 0
플레이어의 기존 road 또는 settlement/city와 연결된다.
상대 settlement/city를 통과해 연결된 것으로 보지 않는다.
```

성공 처리:

```text
비용 차감
edge.owner = active seat index
player.roads -= 1
최장 교역로 재계산 가능하면 수행
승리 조건 검증
room.revision += 1
broadcastState(room)
```

### buildSettlement 검증

```text
vertexId가 유효하다.
vertex.owner가 null 또는 undefined이다.
거리 규칙을 만족한다.
자신의 road와 연결되어 있다.
player.settlements > 0
```

성공 처리:

```text
비용 차감
vertex.owner = active seat index
vertex.city = false
player.settlements -= 1
승리 조건 검증
room.revision += 1
broadcastState(room)
```

주의:

```text
일반 마을 건설은 시작 자원을 지급하지 않는다.
```

### buildCity 검증

```text
vertexId가 유효하다.
vertex.owner === active seat index
vertex.city === false
player.cities > 0
```

성공 처리:

```text
비용 차감
vertex.city = true
player.cities -= 1
player.settlements += 1
승리 조건 검증
room.revision += 1
broadcastState(room)
```

주의:

```text
도시 업그레이드는 새 vertex를 점유하지 않는다.
마을 재고가 1개 돌아온다.
```

## 승점/승리 조건

서버가 계산:

```text
마을 1점
도시 2점
최장 교역로/최대 기사단은 구현되어 있으면 반영
비공개 개발카드 승점은 11단계에서 본격 처리
10점 이상이면 game.winner = seat index
```

비공개 승점 주의:

```text
현재 dev가 존재할 수 있으므로 본인 view에서만 hiddenVictoryPoints 표시 원칙 유지
상대에게 hiddenVictoryPoints 상세 노출 금지
```

## 클라이언트 구현 계획

### 버튼 활성화

온라인 playing 상태에서도 다음 액션을 서버 command 방식으로 허용한다.

```text
road
settlement
city
```

활성 조건:

```text
onlineSession.state.status === "playing"
game.phase === "play"
내 seat이 game.active
game.rolled === true
재접속 대기 중인 player 없음
winner 없음
```

### 클릭 처리

온라인 상태에서는 기존 로컬 건설 함수를 직접 실행하지 않는다.

```text
도로 위치 클릭 -> buildRoad command
마을 위치 클릭 -> buildSettlement command
도시 업그레이드 위치 클릭 -> buildCity command
결과는 서버 state로만 반영
```

금지:

```text
온라인 상태에서 edge/vertex/player.resources를 클라이언트가 직접 확정
```

### UI 표시

필수:

```text
현재 선택된 건설 액션 표시
건설 가능/불가능 상태는 최소한 버튼 disabled로 표현
서버 거절 메시지 표시
건설 후 자원/건설물 수량/승점 갱신
승리 시 모든 브라우저에 동일하게 표시
재접속 대기 중이면 건설 버튼 비활성
ended 상태면 건설 버튼 비활성
```

## 테스트 계획

### 자동 테스트

```text
node --check server.js
node --check script.js
play phase fixture 구성
현재 차례 buildRoad 성공
차례가 아닌 플레이어 buildRoad 거절
주사위 전 buildRoad 거절
room.status ended에서 build command 거절
다른 player connected=false 상태에서 build command 거절
left player build command 거절
자원 부족 buildRoad/buildSettlement/buildCity 거절
잘못된 위치 건설 거절
상대 마을/도시 통과 road 연결 거절
정상 도로 건설 후 모든 클라이언트 edge 동일
정상 마을 건설 후 모든 클라이언트 vertex 동일
정상 도시 건설 후 settlements/cities 수량 갱신
건설 후 본인 자원 상세만 감소 표시
상대에게는 resourceCount만 변경
승점 갱신 검증
10점 이상 winner 설정 검증
```

### 수동 테스트

```text
Chrome 3개 또는 실제 기기 3개 접속
초기 배치 완료
주사위 굴림
도로/마을/도시 건설 시도
잘못된 위치 클릭 시 서버 거절 메시지 확인
자원 부족 시 서버 거절 메시지 확인
건설 결과가 모든 브라우저에 동일하게 표시되는지 확인
본인 자원 상세와 상대 resourceCount 표시 확인
새로고침 후 건설 상태 복구
참가자 탭 닫기 -> 재접속 대기 모달 표시, 건설 불가
참가자 재접속 -> 모달 닫힘, 건설 가능
방 나가기 후 ended 상태에서 건설 불가
```

## 완료 기준

```text
온라인에서 도로/마을/도시 건설이 가능하다.
건설은 서버 command로만 확정된다.
잘못된 차례/시점/위치/자원 부족 요청은 서버가 거절한다.
건설 결과가 모든 브라우저에 동일하게 보인다.
자원 상세 정보는 본인에게만 보인다.
승점과 승리 상태가 모든 브라우저에 동일하게 보인다.
재접속 대기/ended/left 상태에서는 건설이 진행되지 않는다.
오프라인 모드는 기존처럼 동작한다.
```

## 위험 요소

```text
기존 오프라인 건설 가능 판정과 서버 판정이 달라질 수 있다.
도로 연결 판정에서 상대 마을/도시 통과 금지가 누락될 수 있다.
도시 업그레이드 후 settlements/cities 재고 처리가 꼬일 수 있다.
승리 조건과 비공개 승점 처리 경계가 애매해질 수 있다.
온라인/오프라인 클릭 처리 분기가 복잡해질 수 있다.
재접속 대기 중 command 거절이 사용자에게 설명되지 않으면 멈춘 것처럼 보일 수 있다.
```

## 다음 단계 연결

8단계 완료 후 확장 단계로 넘어간다.

```text
9단계: 은행/항구 교환
10단계: 플레이어 간 교환
11단계: 개발 카드
12단계: 7/강도/pending action
13단계: 전체 회귀 테스트 및 안정화
```
# 2026-05-26 작업 전 갱신

## 실제 수정 대상

```text
server.js
script.js
docs/tests/2026-05-26_online-08-basic-building-test-plan.md
docs/reports/2026-05-26_online-08-basic-building-final-report.md
```

## 구현 상세

```text
server.js
- buildRoad/buildSettlement/buildCity command를 추가한다.
- 기존 validatePlayCommand를 활용하되 rolled=true 조건을 추가로 검증한다.
- 서버 비용 상수와 자원 차감/은행 반환 helper를 추가한다.
- 도로/마을/도시 위치 검증을 서버에 구현한다.
- 상대 마을/도시를 통과하는 road 연결은 인정하지 않는다.
- 공개 승점(마을 1, 도시 2)을 계산해 10점 이상이면 winner를 설정한다.
- 최장 교역로/최대 기사단은 8단계에서 제외하고 보고서에 남긴다.

script.js
- 온라인 play phase 건설 클릭은 로컬 buildRoad/buildSettlement/buildCity 대신 서버 command를 전송한다.
- buildable hint와 버튼 활성 조건은 내 차례+rolled+재접속 대기 없음+winner 없음 기준으로 계산한다.
- 서버 거절 메시지를 로그에 표시한다.
- 오프라인 건설 흐름은 유지한다.
```

## 검증 계획

```text
node --check server.js
node --check script.js
WebSocket 자동 테스트:
- 정상 도로/마을/도시 건설
- 비차례/주사위 전/자원 부족/잘못된 위치/상대 건물 통과 연결 거절
- 모든 클라이언트 board state 동일
- 본인 resources 상세만 변경, 상대는 resourceCount만 변경
- 승점 및 winner 설정
- connected=false/ended 상태 거절
브라우저 스모크:
- 페이지 로드와 건설 버튼 DOM 확인
수동 테스트:
- 실제 다중 브라우저 건설 클릭 UX와 승리 표시 확인
```
