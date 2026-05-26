# 온라인 11-1 개발 카드 보강 계획

작성일: 2026-05-26

## 목적

11단계 온라인 개발 카드 구현 후 피드백에서 발견된 보강 항목을 12단계 강도/pendingAction 구현 전에 정리한다.

11-1단계의 목표는 개발 카드 중 `roadBuilding` 안정성, 무료 도로의 `longestRoad` 반영, 승점 카드 승리 표시, 개발 카드 테스트 커버리지를 보강하는 것이다.

12단계는 주사위 7/강도/약탈/pendingAction이 핵심이므로, 11-1에서는 12단계와 직접 연결되지 않는 개발 카드 잔여 리스크를 먼저 줄인다.

## 전제

```text
11단계 온라인 개발 카드 기능이 구현되어 있다.
buyDevCard/playDevCard/placeFreeRoad command가 존재한다.
roadBuilding은 pendingFreeRoads/freeRoadOwnerSeat 방식으로 동작한다.
기사 카드의 강도 이동/약탈은 12단계 범위로 유지한다.
오프라인 개발 카드 기존 동작은 유지한다.
```

## 범위

포함:

```text
roadBuilding pending deadlock 방지
roadBuilding 사용 직후 합법 무료 도로 위치가 없는 경우 처리
placeFreeRoad 후 남은 무료 도로가 있지만 더 놓을 수 없는 경우 자동 종료
무료 도로 배치 시 longestRoad 갱신
무료 도로 배치로 10점 도달 시 winner 판정
일반 buildRoad와 placeFreeRoad의 longestRoad 갱신 경로 정리
승점 카드로 승리한 경우 결과 UI에 숨은 승점 카드 정보 표시
개발 카드 자동 테스트 보강
11단계 보고서 업데이트
```

제외:

```text
기사 카드 강도 이동
기사 카드 피해자 선택/약탈
주사위 7 discard
공통 pendingAction 도입
roadBuilding pendingFreeRoads를 pendingAction으로 통합
배포용 보안/계정/영구 저장
```

## 핵심 정책

```text
도로 건설 카드는 게임을 멈추게 하면 안 된다.
무료 도로는 일반 도로와 같은 연결 규칙을 따른다.
무료 도로도 longestRoad 계산에 포함된다.
longestRoad로 10점에 도달하면 서버가 winner를 설정한다.
roadBuilding pending은 12단계 pendingAction과 섞지 않는다.
승점 카드는 게임 중에는 비공개지만, winner가 결정된 뒤에는 승리 요약에 숨은 승점 카드 정보를 표시할 수 있다.
```

## 서버 구현 계획

### 1. 합법 무료 도로 위치 검사 helper

추가 또는 정리할 helper:

```text
hasLegalRoadPlacement(matchState, seatIndex)
```

역할:

```text
해당 플레이어가 놓을 수 있는 빈 edge가 1개 이상 있는지 확인한다.
edge.owner가 비어 있어야 한다.
canBuildRoadAt(matchState, seatIndex, edge)를 통과해야 한다.
도로 말이 1개 이상 남아 있어야 한다.
```

사용 위치:

```text
roadBuilding 카드 사용 직후
placeFreeRoad 성공 직후
```

### 2. roadBuilding 사용 직후 deadlock 방지

현재 기대 흐름:

```text
playDevCard roadBuilding
카드 제거
game.usedDevThisTurn = true
pendingFreeRoads = min(2, player.roads)
freeRoadOwnerSeat = seatIndex
```

보강 정책:

```text
player.roads <= 0이면 NO_PIECES로 거부한다.
도로 말은 있지만 합법 위치가 전혀 없으면 카드는 사용 성공 처리하고 pending 없이 종료한다.
이때 pendingFreeRoads = 0, freeRoadOwnerSeat = null로 둔다.
보고서에는 "카드 사용은 성공했지만 놓을 수 있는 무료 도로가 없어 pending 없이 종료"로 기록한다.
```

이유:

```text
친구끼리 쓰는 LAN 게임에서 규칙 엄밀성보다 게임이 멈추지 않는 것이 더 중요하다.
공식 규칙상 도로를 놓을 수 없으면 실질 효과가 없을 수 있으므로, 카드 사용 자체를 되돌리는 복잡한 UX는 피한다.
```

### 3. placeFreeRoad 후 pending 자동 종료

처리 순서:

```text
1. placeFreeRoad 검증 통과
2. edge.owner = seatIndex
3. player.roads -= 1
4. pendingFreeRoads -= 1
5. longestRoad 갱신
6. winner 판정
7. pendingFreeRoads <= 0이면 pending 종료
8. player.roads <= 0이면 pending 종료
9. hasLegalRoadPlacement(matchState, seatIndex)가 false이면 pending 종료
10. room.revision += 1
11. broadcastState(room)
```

종료 시 상태:

```text
game.pendingFreeRoads = 0
game.freeRoadOwnerSeat = null
```

### 4. longestRoad 갱신 경로 정리

필요 정책:

```text
일반 buildRoad와 placeFreeRoad 모두 같은 longestRoad 갱신 helper를 호출한다.
도로를 1개 놓을 때마다 longestRoad를 재계산한다.
longestRoad 갱신 후 winner 판정을 수행한다.
```

주의:

```text
이미 longestRoad 계산 helper가 있다면 재사용한다.
없다면 13단계 전체 안정화 전 임시 구현을 만들기보다 기존 오프라인 계산 로직을 서버 쪽으로 이식한다.
동률 처리 정책은 기존 오프라인 동작과 맞춘다.
```

완료 기준:

```text
무료 도로로 longestRoad 소유자가 바뀔 수 있다.
무료 도로로 longestRoad 2점을 얻어 10점이 되면 winner가 설정된다.
무료 도로를 놓아도 longestRoad 조건을 만족하지 않으면 winner가 잘못 설정되지 않는다.
```

### 5. 승점 카드 승리 결과 표시

현재 정책:

```text
게임 중 상대에게는 devCount만 보인다.
본인에게는 dev 상세와 hiddenVictoryPoints가 보인다.
승점 카드는 playDevCard로 사용할 수 없다.
hiddenVictoryPoints는 winner 판정에 반영된다.
```

보강 정책:

```text
winner가 null이 아닐 때는 승리 요약에서 winner의 숨은 승점 카드 개수를 표시한다.
게임 진행 중에는 상대에게 victory card 상세를 계속 숨긴다.
승리 후에도 필요 이상으로 전체 dev card 상세를 공개하지 않는다.
권장 표시: "숨은 승점 카드 N장 포함"
```

서버 view 정책:

```text
winner가 결정되기 전: 기존 privacy 유지
winner가 결정된 뒤: matchState.game.winnerSummary 또는 winner player view에 victoryDevCount 공개
상대 dev 상세 전체 공개는 하지 않는다.
```

클라이언트 UI:

```text
승리 모달 또는 게임 종료 표시 영역에 숨은 승점 카드 개수를 표시한다.
예: "승리: Host - 숨은 승점 카드 2장 포함"
```

## 클라이언트 구현 계획

### 1. roadBuilding UI 상태

```text
pendingFreeRoads가 0으로 자동 종료되면 selectedAction을 roadBuilding에서 일반 road 또는 기본 상태로 되돌린다.
서버 state를 기준으로 selectedAction을 동기화한다.
무료 도로를 더 놓을 수 없는 경우 버튼/보드가 계속 활성화되어 보이지 않게 한다.
```

### 2. 승리 결과 UI

```text
winnerSummary.victoryDevCount 또는 winner player view의 victoryDevCount를 읽는다.
승리 표시 문구에 숨은 승점 카드 개수를 추가한다.
값이 없거나 0이면 기존 문구를 유지한다.
```

## 테스트 계획

### 자동 검증

필수:

```text
node --check server.js
node --check script.js
node --check scripts/online-11-development-cards-ws-test.js
node scripts/online-11-development-cards-ws-test.js
```

보강 WebSocket 테스트:

```text
roadBuilding 사용 직후 합법 무료 도로 위치가 없으면 pendingFreeRoads가 0으로 종료
첫 번째 placeFreeRoad 후 두 번째 합법 위치가 없으면 pendingFreeRoads가 0으로 자동 종료
pending 자동 종료 후 endTurn 가능
placeFreeRoad가 일반 buildRoad와 같은 연결 규칙을 적용
placeFreeRoad가 비용을 차감하지 않음
placeFreeRoad가 도로 말은 차감
placeFreeRoad 후 longestRoad 갱신
placeFreeRoad 후 longestRoad 2점으로 10점 도달 시 winner 설정
일반 buildRoad 후 longestRoad 갱신 회귀
승점 카드로 10점 도달 시 winner 설정
winner 결정 전 상대에게 hiddenVictoryPoints/dev 상세 미노출
winner 결정 후 승리 요약에 victoryDevCount 표시
```

기존 회귀:

```text
buyDevCard 성공
DEV_DECK_EMPTY 구매 거부
buyDevCard 주사위 전 거부
victory card playDevCard 거부
구매한 턴 playDevCard 거부
한 턴 개발 카드 1장 제한
yearPlenty 성공
yearPlenty 은행 재고 부족 거부
monopoly 성공
knight는 11단계 정책대로 강도 pending 미생성
10단계 playerTrade 회귀
```

### 수동 검증

```text
1. 서버를 완전히 재시작한다.
2. 브라우저를 강력 새로고침한다.
3. 새 방을 만들고 3명 이상 입장한다.
4. 초기 배치 후 play phase로 진입한다.
5. roadBuilding 카드를 사용한다.
6. 무료 도로 1개 또는 2개를 배치한다.
7. 더 놓을 합법 위치가 없을 때 게임이 막히지 않는지 확인한다.
8. 무료 도로로 longestRoad가 바뀌는지 확인한다.
9. 무료 도로/승점 카드로 winner가 설정되는지 확인한다.
10. 승리 표시에서 숨은 승점 카드 개수가 보이는지 확인한다.
11. 상대 화면에서 게임 진행 중 dev 상세가 노출되지 않는지 확인한다.
12. 오프라인 개발 카드 기능이 기존처럼 동작하는지 확인한다.
```

## 완료 기준

```text
roadBuilding pending이 게임을 멈추게 하지 않는다.
합법 무료 도로 위치가 없으면 pending이 자동 종료된다.
무료 도로가 longestRoad에 반영된다.
무료 도로로 winner가 설정될 수 있다.
승점 카드로 winner가 설정될 수 있다.
승리 결과에 숨은 승점 카드 개수가 표시된다.
게임 진행 중 개발 카드 privacy는 유지된다.
기사 카드 강도 이동/약탈은 여전히 12단계 범위로 남겨진다.
자동 테스트 결과와 미수행 수동 테스트가 보고서에 기록된다.
```

## 위험 요소와 대응

```text
roadBuilding pending이 남아 endTurn이 막힐 수 있다.
대응: placeFreeRoad 후 hasLegalRoadPlacement를 검사해 더 놓을 수 없으면 pending을 종료한다.

무료 도로가 longestRoad에 반영되지 않을 수 있다.
대응: buildRoad와 placeFreeRoad가 같은 longestRoad 갱신 helper를 호출하게 한다.

승점 카드 reveal이 privacy를 과하게 깨뜨릴 수 있다.
대응: winner 결정 후 victoryDevCount만 공개하고 전체 dev 상세는 계속 숨긴다.

12단계 pendingAction과 roadBuilding pending을 섞을 수 있다.
대응: 11-1에서는 pendingFreeRoads/freeRoadOwnerSeat 모델을 유지하고, pendingAction 도입은 12단계에서만 처리한다.

오프라인 로직이 깨질 수 있다.
대응: 온라인 command 경로 중심으로 수정하고, 오프라인 개발 카드 수동 회귀를 수행한다.
```

## 다음 단계 연결

11-1단계 완료 후에는 12단계 7/강도/pending action으로 넘어간다.

```text
11단계: 개발 카드 서버 command
11-1단계: 개발 카드 보강
12단계: 7/강도/pending action
13단계: 전체 회귀 테스트 및 안정화
```
## 2026-05-26 구현 전 갱신

- 11단계 피드백 반영분 중 `roadBuilding` pending 자동 종료와 무료 도로 `longestRoad` 갱신 helper는 기존 코드에 일부 반영된 상태로 확인했다.
- 11-1 구현에서는 남은 공개 범위 정리를 위해 `winnerSummary.victoryDevCount`를 추가하고, 승리한 플레이어 view에 한해 `victoryDevCount`만 공개한다.
- 전체 개발 카드 상세, 상대 `hiddenVictoryPoints`, 서버 내부 `devDeck`은 계속 비공개로 유지한다.
- 테스트는 `scripts/online-11-development-cards-ws-test.js`에 no-legal-road pending 종료, 무료 도로 최장 교역로/승리, 숨은 승점 카드 승리 요약 공개를 추가한다.
