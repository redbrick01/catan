# 온라인 04 게임 엔진 이전 구현 계획

## 목표

현재 `script.js`에 섞여 있는 게임 상태 변경 로직을 온라인에서도 쓸 수 있도록 서버 권위 구조로 단계적으로 옮긴다.

## 핵심 리스크

현재 코드는 단일 브라우저 오프라인 게임에 맞춰져 있다. 상태가 `game` 객체 하나에만 있는 것이 아니라 여러 전역 변수에 나뉘어 있을 가능성이 높다.

온라인에서 서버가 가져야 할 상태:

```text
game
tiles
vertices
edges
harbors
robberTile
devDeck
pendingDiscards
pendingRobberVictims
pendingFreeRoads
```

## 2026-05-26 리뷰 피드백 반영 계획

추가 반영 범위:

```text
script.js
- hydrateMatchState()에서 Object.assign(game, matchState.game)만 사용하지 않는다.
- resetGameStateFromMatch(matchState)를 추가해 서버 상태 기준으로 game 주요 필드를 명시 초기화한다.
- playing 상태 reconnect 이후 onlineLobbyView를 다시 표시하지 않도록 reconnectOnlineRoom()을 보정한다.
```

추가 검증:

```text
node --check server.js
node --check script.js
playing 상태에서 기존 identity로 reconnect 시 state.status = "playing"과 동일 matchState 수신 확인
```

후속 문서화:

```text
devDeck 전체 노출은 5단계 private state 필터링에서 제거/필터링한다.
서버/클라이언트 보드 생성 로직 중복은 공용 엔진화 후보로 유지한다.
3개 브라우저/기기 실제 수동 검증은 후속 검증 항목으로 유지한다.
```

## 2026-05-26 4단계 작업 전 갱신

이번 작업은 Phase A만 구현한다.

변경 범위:

```text
server.js
- startGame command 추가
- 방장/인원/연결 상태 검증
- 서버 전용 초기 보드/항구/개발 카드 덱 생성
- room.status = "playing" 전환
- state.status와 top-level revision 유지
- state.matchState에 game, tiles, vertices, edges, harbors, robberTile, devDeck 포함

script.js
- 대기실 게임 시작 버튼 활성화 조건 추가
- startGame command 전송
- gameStarted ack와 playing state 처리
- 서버 matchState를 기존 렌더 전역 상태로 hydrate
- 온라인 playing 상태에서는 아직 구현하지 않은 로컬 게임 액션을 차단
```

반영할 이전 단계 피드백:

```text
server.js의 WebSocket 진단 로그는 DEBUG_ONLINE 조건부 상태를 유지한다.
대기실 reconnect는 기존 경로를 깨지 않게 유지한다.
leaveRoom은 대기실에서는 방에서 제거로 유지한다.
게임 중 이탈 정책은 이번 단계에서 구현하지 않고 후속 과제로 문서화한다.
```

이번 단계에서 구현하지 않을 범위:

```text
초기 배치 command
주사위 command
턴 종료 command
건설 command
게임 중 이탈/복귀 정책 완성
비공개 상태 필터링
```

검증 기준:

```text
node --check server.js
node --check script.js
WebSocket 3클라이언트 createRoom/joinRoom/startGame 시나리오
방장이 아닌 참가자의 startGame 거절
3명 미만 startGame 거절
playing 이후 joinRoom 거절
모든 클라이언트가 동일한 matchState revision/tiles/harbors/robberTile/devDeck을 수신
오프라인 startGame 경로가 기존처럼 setupBoard를 사용해 실행 가능한지 문법/경로 확인
```

따라서 온라인 상태 모델은 `game`만 복사해서는 부족하다. 보드, 건설물, 카드 더미, 강도 위치까지 묶은 `matchState`가 필요하다.

## 권장 서버 상태

```js
const matchState = {
  game: {},
  tiles: [],
  vertices: [],
  edges: [],
  harbors: [],
  robberTile: 0,
  devDeck: []
};
```

클라이언트 렌더링도 이 상태를 기준으로 해야 한다.

## 이전 전략

처음부터 모든 규칙을 서버로 옮기지 않는다.

순서:

```text
1. 게임 시작 상태 생성
2. 초기 배치
3. 주사위
4. 턴 종료
5. 일반 건설
6. 은행/항구 교환
7. 플레이어 교환
8. 개발 카드
9. 7 카드 버리기/강도
```

## 오프라인 모드 유지 원칙

오프라인은 계속 동작해야 한다.

이상적인 최종 구조:

```text
오프라인:
UI -> gameEngine.applyCommand()

온라인:
UI -> WebSocket -> server -> gameEngine.applyCommand()
```

초기에는 기존 오프라인 함수를 유지하고, 온라인용 서버 로직을 병행 작성해도 된다. 이후 중복이 보이면 공용 엔진으로 합친다.

## Phase A. 게임 시작 상태 생성

목표:

```text
서버가 초기 보드와 플레이어 상태를 생성
모든 클라이언트가 같은 보드를 렌더링
```

작업:

```text
startGame 로직에서 보드 생성 부분 식별
tiles/vertices/edges/harbors/devDeck/robberTile 초기화 범위 확인
서버에서 같은 초기화 함수 호출 가능하게 분리
서버 matchState 생성
클라이언트가 받은 matchState로 렌더링
```

완료 기준:

```text
모든 브라우저에서 지형, 숫자 토큰, 항구, 강도 위치가 동일
```

주의:

```text
Math.random()은 서버에서만 사용
클라이언트가 보드를 다시 섞으면 안 됨
```

클라이언트에는 서버 state를 기존 전역 상태에 주입하는 hydrate 단계가 필요하다.

예:

```js
function hydrateMatchState(matchState) {
  Object.assign(game, matchState.game);
  tiles = matchState.tiles;
  vertices = matchState.vertices;
  edges = matchState.edges;
  harbors = matchState.harbors;
  robberTile = matchState.robberTile;
  devDeck = matchState.devDeck;
  render();
}
```

현재 `game`은 `const` 객체이므로 `game = matchState.game`처럼 재할당할 수 없다. 초기 변경량을 줄이려면 `Object.assign(game, matchState.game)`처럼 기존 객체를 유지하면서 내부 값만 갱신하는 방식이 안전하다.

## Phase B. 초기 배치 서버화

대상 함수:

```text
buildSettlement()
buildRoad()
canBuildSettlement()
canBuildRoad()
setup phase 진행 로직
```

서버 책임:

```text
현재 phase가 setup1/setup2인지 확인
현재 setupIndex의 플레이어인지 확인
초기 마을 위치가 규칙상 가능한지 확인
초기 도로가 방금 지은 마을과 연결되는지 확인
vertices/edges 변경
setupIndex와 phase 진행
두 번째 초기 마을 후 초기 자원 지급
모든 초기 배치 완료 후 play phase 진입
state broadcast
```

클라이언트 책임:

```text
초기 배치 가능한 위치 표시
클릭 시 buildInitialSettlement/buildInitialRoad 명령 전송
서버 state로 화면 갱신
```

완료 기준:

```text
현재 배치 차례인 플레이어만 초기 마을/도로 배치 가능
모든 브라우저에 같은 초기 건설물이 표시
초기 배치 완료 후 모든 브라우저가 play phase로 진입
```

## Phase C. 주사위 서버화

대상 함수:

```text
rollDice()
roll()
```

서버 책임:

```text
현재 phase 확인
현재 플레이어 확인
이미 rolled인지 확인
주사위 생성
lastDice 저장
rolled = true
자원 지급
7이면 discard pending 생성
state broadcast
```

클라이언트 책임:

```text
roll 버튼 클릭 시 rollDice 명령 전송
서버가 내려준 dice 결과 렌더링
```

완료 기준:

```text
주사위 값은 모든 브라우저에서 동일
차례가 아닌 플레이어는 주사위 불가
중복 클릭해도 한 번만 처리
```

## Phase D. 턴 종료 서버화

대상 함수:

```text
endTurn()
```

서버 책임:

```text
현재 phase 확인
rolled 확인
pending action 없음 확인
active 플레이어 변경
round 갱신
rolled = false
usedDevThisTurn = false
새 턴 상태 broadcast
```

완료 기준:

```text
턴 종료 후 모든 브라우저에서 현재 차례가 동일
새 차례 플레이어만 주사위 가능
```

## Phase E. 일반 건설 서버화

대상 함수:

```text
buildRoad()
buildSettlement()
buildCity()
canBuildRoad()
canBuildSettlement()
```

서버 책임:

```text
현재 차례 확인
play phase 여부 확인
건설 가능 위치 확인
자원 충분 여부 확인
말 수량 확인
edges/vertices 변경
자원 차감
최장 교역로/승점 확인
state broadcast
```

완료 기준:

```text
한 브라우저에서 건설한 도로/마을/도시가 모든 브라우저에 표시
잘못된 위치는 서버가 거부
자원 부족 시 서버가 거부
```

## Phase F. 교환 서버화

대상:

```text
은행 교환
항구 교환 비율
플레이어 교환
```

서버 책임:

```text
현재 차례 확인
주사위 이후인지 확인
항구 보유 여부 계산
자원 충분 여부 확인
은행 재고 확인
플레이어 교환 pending 생성
대상 플레이어 응답 처리
```

완료 기준:

```text
4:1, 3:1, 2:1 교환이 정확히 적용
제안받은 플레이어만 수락/거절 가능
교환 후 모든 브라우저에서 자원 총량이 일치
```

## Phase G. 개발 카드 서버화

대상:

```text
buyDevCard()
useDevCard()
기사
풍년
독점
도로 건설
승점
```

서버 책임:

```text
devDeck에서 카드 뽑기
자원 차감
구매 턴 사용 금지 검증
카드별 효과 처리
숨겨진 승점 비공개 유지
최대 기사상 확인
```

완료 기준:

```text
내 개발 카드 종류는 나만 봄
상대는 개발 카드 장수만 봄
구매한 턴에는 해당 카드 사용 불가
```

## Phase H. 7/강도 서버화

대상:

```text
startDiscardForSeven()
discard 처리
moveRobber
stealRandom
robber victim 선택
```

서버 책임:

```text
버릴 대상 계산
각 플레이어별 discard pending 생성
모든 대상 응답 전까지 다음 단계 차단
강도 이동 위치 검증
피해자 후보 계산
훔친 자원 서버에서 랜덤 결정
비공개 로그 처리
```

완료 기준:

```text
버릴 대상에게만 discard UI 표시
모두 버리기 전 강도 이동 불가
훔친 자원 종류가 상대에게 노출되지 않음
```

## 완료 기준

```text
서버가 matchState를 소유
클라이언트는 직접 상태를 확정하지 않음
오프라인 모드는 계속 동작
초기 배치/주사위/턴/일반 건설/교환/개발 카드/강도 순서로 서버 권위화
```

## 테스트 기준

각 Phase마다 확인:

```text
브라우저 A에서 행동
브라우저 B/C에 같은 결과 표시
차례가 아닌 브라우저에서 같은 행동 시도
서버가 거부
새로고침 후 최신 상태 복귀
```
