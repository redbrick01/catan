# 온라인 11 개발 카드 구현 최종 보고서

작성일: 2026-05-26

## 작업명

온라인 11단계 개발 카드 구현

## 관련 구현 계획서

```text
docs/implementation_plans/2026-05-26_online-11-development-cards-plan.md
```

## 관련 테스트 계획서

```text
docs/test_plans/2026-05-26_online-11-development-cards-test-plan.md
```

## 변경 파일 목록

```text
server.js
script.js
scripts/online-11-development-cards-ws-test.js
docs/implementation_plans/2026-05-26_online-11-development-cards-plan.md
docs/test_plans/2026-05-26_online-11-development-cards-test-plan.md
docs/final_reports/2026-05-26_online-11-development-cards-final-report.md
```

## 구현 요약

```text
buyDevCard command를 추가했다.
playDevCard command를 추가했다.
placeFreeRoad command를 추가했다.
개발 카드 비용 pasture 1, field 1, mountain 1을 서버에서 검증하고 차감한다.
구매 카드는 boughtRound/boughtTurnSeat를 저장해 구매한 턴 사용 금지를 적용한다.
개발 카드 덱은 서버 matchState.devDeck에만 유지하고 viewer state에는 devDeckCount만 공개한다.
본인 view에는 dev 상세와 hiddenVictoryPoints를 표시하고 상대 view에는 devCount만 표시한다.
승점 카드는 playDevCard로 사용할 수 없고 숨은 점수로 winner 판정에 반영한다.
풍년 카드는 서버에서 은행 재고를 검증한 뒤 자원 2장을 지급한다.
독점 카드는 지정 자원을 다른 플레이어들에게서 회수한다.
도로 건설 카드는 pendingFreeRoads/freeRoadOwnerSeat를 설정하고 placeFreeRoad로 무료 도로를 배치한다.
무료 도로 배치는 비용을 차감하지 않고 도로 말만 차감한다.
무료 도로 배치 후 더 놓을 합법 도로가 없으면 pendingFreeRoads를 자동 종료한다.
일반 도로와 무료 도로 모두 서버 longestRoad 갱신 helper를 호출한다.
기사 카드는 knights 증가와 largestArmy 갱신까지만 처리한다.
기사 카드는 11단계에서 강도 이동/약탈/pending을 생성하지 않는다.
온라인 UI의 개발 카드 구매/사용 버튼을 서버 command로 연결했다.
오프라인 개발 카드 로컬 경로는 유지했다.
```

## 규칙 또는 설계 반영 내용

```text
온라인 개발 카드 구매/사용은 서버 command로만 확정된다.
서버가 카드 덱, 비용, 구매 턴, 한 턴 1장 제한, 카드별 payload를 검증한다.
개발 카드 상세는 viewer 본인에게만 내려간다.
상대에게는 devCount만 공개된다.
client matchState에는 devDeck 배열이 없고 devDeckCount만 있다.
playDevCard는 주사위 전에도 가능하다.
buyDevCard는 주사위 후에만 가능하다.
pending player trade/free road/discard/robber victim 중에는 구매/사용을 막는다.
도로 건설 pending 중 endTurn 등 다른 진행 command를 막는다.
도로 건설 카드로 놓은 도로도 longestRoad와 winner 판정에 반영한다.
도로 건설 카드 pending이 합법 위치 부족으로 막힌 채 남지 않도록 자동 종료한다.
```

## 테스트 결과

```text
PASS node --check server.js
PASS node --check script.js
PASS node --check scripts/online-11-development-cards-ws-test.js
PASS node scripts/online-11-development-cards-ws-test.js
PASS node scripts/online-10-player-trade-ws-test.js
PASS 브라우저 단일 탭 http://127.0.0.1:4173/ 로드
PASS 브라우저 콘솔 error 0건
```

11단계 WebSocket 테스트 주요 결과:

```text
ok - victory card cannot be played: DEV_CARD_NOT_PLAYABLE
ok - buyDevCard privacy and victory card policy
ok - bought turn play rejected: DEV_CARD_BOUGHT_THIS_TURN
ok - one dev card per turn: DEV_CARD_ALREADY_USED
ok - yearPlenty grants resources and one-card limit applies
ok - monopoly collects selected resource
ok - pending free road blocks endTurn: INVALID_ACTION
ok - non-owner cannot place free road: NOT_YOUR_TURN
ok - roadBuilding pending and free road placement
ok - free road updates longestRoad and clears dead pending
ok - knight increments and largestArmy updates without robber pending
online-11 development card websocket tests passed
```

10단계 회귀 테스트 주요 결과:

```text
ok - openPlayerTrade broadcasts role-specific views
ok - pending blocks bankTrade: INVALID_ACTION
ok - pending blocks endTurn: INVALID_ACTION
ok - second open blocked: TRADE_ALREADY_PENDING
ok - counter cannot be chosen: TRADE_RESPONSE_NOT_ACCEPT
ok - choose accepted response moves resources and preserves privacy
ok - requester cannot respond: TRADE_NOT_RESPONDER
ok - responder cannot update: TRADE_NOT_REQUESTER
ok - old round rejected: TRADE_ROUND_CHANGED
ok - update resets round and cancel clears trade
ok - choose invalidates when resources changed
online-10 player trade websocket tests passed
```

## 통과한 항목

```text
buyDevCard 성공
devDeckCount 공개 및 devDeck 배열 미노출
본인 dev 상세 표시
상대 devCount만 표시
승점 카드 사용 거절
구매한 턴 사용 거절
풍년 자원 2장 지급
한 턴 1장 제한
독점 자원 회수
도로 건설 pending 생성
무료 도로 배치 비용 미차감
권한 없는 무료 도로 배치 거절
pending free road 중 endTurn 거절
무료 도로 longestRoad 갱신
무료 도로 pending deadlock 자동 종료
기사 knights 증가
largestArmy 갱신
기사 사용 시 강도 pending 미생성
기존 10단계 플레이어 교환 회귀 통과
```

## 실패한 항목

```text
자동 테스트 기준 실패 항목 없음
```

## 수행하지 못한 항목

```text
실제 Chrome 3브라우저 수동 테스트는 수행하지 못했다.
실제 LAN 다른 기기 테스트는 수행하지 못했다.
오프라인 개발 카드 기능은 코드 경로를 유지했지만 실제 브라우저 수동 회귀 테스트는 수행하지 못했다.
재접속 후 본인 dev 상세/상대 devCount 복구는 viewer state 구조와 WebSocket 자동 테스트로 일부 확인했지만 실제 브라우저 새로고침 수동 검증은 수행하지 못했다.
모바일 UI에서 개발 카드 사용 모달의 시각적 검증은 수행하지 못했다.
```

## 남은 위험

```text
일반 도로와 무료 도로 배치 시 서버 longestRoad 갱신을 수행한다.
승점 계산은 건설 점수, largestArmy, hiddenVictoryPoints, longestRoad 필드 기준이다.
기사 카드의 강도 이동/약탈은 12단계 범위로 남아 있다.
도로 건설 카드 pendingFreeRoads/freeRoadOwnerSeat는 12단계 공통 pendingAction 도입 시 통합 여부를 다시 검토해야 한다.
기존 UI 일부 한글 문자열 인코딩 깨짐은 별도 정리 작업이 필요하다.
```

## 후속 작업

```text
온라인 3브라우저에서 개발 카드 구매/사용 수동 검증
상대 브라우저 개발자 도구에서 devDeck/dev 상세 미노출 직접 확인
오프라인 개발 카드 수동 회귀 검증
12단계에서 기사 카드 강도 이동/약탈 pending 구현
12단계에서 7/강도 공통 pending action과 roadBuilding pending 통합 여부 검토
```

## 피드백 반영 결과

```text
P1 도로 건설 카드 pending deadlock 방지: 반영 완료.
- roadBuilding 사용 직후 합법 위치가 없으면 pending 없이 종료한다.
- placeFreeRoad 후 남은 무료 도로가 있어도 추가 합법 위치가 없으면 pending을 자동 종료한다.
- 자동 테스트에 "free road updates longestRoad and clears dead pending" 케이스를 추가했다.

P1 도로 건설 카드 longestRoad 반영: 반영 완료.
- 일반 buildRoad와 placeFreeRoad가 updateLongestRoadForSeat()를 호출한다.
- 무료 도로 배치로 longestRoad를 획득할 수 있고 winner 판정도 다시 수행한다.

P1 기사 카드 공식 강도 이동/약탈: 12단계 범위로 유지.
- 11단계 계획상 의도적으로 제외된 항목이므로 이번 수정에서는 구현하지 않았다.

P2 승점 카드 승리 시 reveal: 후속 UX 보강으로 유지.
- 비공개 점수와 winner 판정은 유지하고, 승리 후 공개 표현은 별도 작업으로 남긴다.
```

## 최종 판단

부분 완료.

서버 command, private view, 클라이언트 온라인 command 연결, 자동 WebSocket 테스트, 기존 10단계 회귀 테스트, 단일 브라우저 로드 검증은 완료했다. 다만 실제 3브라우저 수동 테스트와 오프라인 수동 회귀 테스트가 남아 있어 최종 판단은 부분 완료로 기록한다.

## 피드백

작성일: 2026-05-26

참고 기준:

```text
CATAN 공식 Basegame/Family Rules 기준으로 개발 카드 규칙을 재점검했다.
개발 카드는 기사, 진행 카드, 승점 카드로 나뉜다.
진행 카드는 도로 건설, 풍년, 독점이다.
개발 카드는 자신의 턴 중 언제든 1장 사용할 수 있고, 주사위 전에도 사용할 수 있다.
방금 구매한 개발 카드는 같은 턴에 사용할 수 없다.
예외적으로 승점 카드는 승리 시 공개될 수 있다.
기사 카드는 사용 즉시 강도를 이동하고 무작위 자원 1장을 훔치는 효과까지 포함한다.
도로 건설 카드는 일반 도로 건설 규칙에 따라 무료 도로 2개를 놓는다.
```

### P1. 기사 카드의 공식 효과가 아직 완성되지 않았다

현재 구현:

```text
기사 카드 사용 시 player.knights 증가
largestArmy 갱신
강도 이동/피해자 선택/약탈/pending 미생성
```

공식 규칙 기준:

```text
기사 카드를 사용하면 즉시 강도를 이동해야 한다.
강도 이동 후 인접 상대 중 1명을 선택하거나, 후보가 1명이면 자동으로 대상이 정해져야 한다.
선택된 상대에게서 서버가 무작위 자원 1장을 훔쳐야 한다.
기사 카드는 7이 나온 경우와 달리 8장 이상 카드 버리기를 발생시키지 않는다.
```

판단:

```text
11단계 계획 기준으로는 의도적으로 12단계로 넘긴 항목이므로 구현 누락은 아니다.
하지만 "공식 개발 카드 전체 구현 완료" 기준으로는 미완료다.
12단계에서 반드시 playDevCard knight 이후 moveRobber/chooseRobberVictim/stealRandom 흐름을 연결해야 한다.
```

후속 조치:

```text
12단계 구현 시 knight source의 pendingAction을 추가한다.
source가 knight이면 discardForSeven 없이 바로 moveRobber로 진입한다.
기사 사용 후 강도 pending 해결 전까지 rollDice/endTurn/build/trade/buyDevCard/playDevCard를 막는다.
약탈 결과는 actor와 victim에게만 자원 종류를 모달로 알리고, others에게는 자원 종류를 숨긴다.
```

관련 위치:

```text
server.js handlePlayDevCard knight 분기
docs/implementation_plans/2026-05-26_online-12-robber-seven-pending-plan.md
```

### P1. 도로 건설 카드 pending이 막힌 상태로 남을 수 있다

현재 구현:

```text
roadBuilding 사용 시 game.pendingFreeRoads = min(2, gamePlayer.roads)
placeFreeRoad 성공 시 pendingFreeRoads를 1 감소
pendingFreeRoads가 0이거나 도로 말이 없으면 pending 종료
```

위험:

```text
첫 번째 무료 도로를 놓은 뒤 두 번째 무료 도로를 놓을 합법 위치가 없는 경우가 생길 수 있다.
이때 pendingFreeRoads가 1로 남으면 endTurn/build/trade/buyDevCard/playDevCard가 계속 막힌다.
보고서에는 "합법 위치가 없으면 pending 종료" 정책이 있었지만, 실제 자동 테스트 결과에는 이 케이스가 없다.
```

공식 규칙 기준:

```text
도로 건설 카드는 일반 도로 건설 규칙에 따라 무료 도로 2개를 즉시 놓는다.
단, 실제로 놓을 수 있는 도로 말이나 합법 위치가 부족하면 가능한 만큼만 처리하고 게임이 멈추면 안 된다.
```

후속 조치:

```text
placeFreeRoad 후 남은 무료 도로 수가 1 이상이면 서버에서 추가 합법 도로 위치가 있는지 검사한다.
합법 위치가 없으면 pendingFreeRoads = 0, freeRoadOwnerSeat = null로 종료한다.
roadBuilding 사용 직후에도 pendingFreeRoads > 0이지만 합법 위치가 전혀 없으면 즉시 pending을 종료하거나 카드를 거부하는 정책 중 하나를 명확히 선택한다.
권장 정책은 "카드 사용은 성공, 놓을 수 있는 무료 도로가 없으면 pending 없이 종료"다.
```

추가 테스트:

```text
도로 말은 남아 있지만 연결 가능한 빈 edge가 없는 상태에서 roadBuilding 사용
첫 번째 무료 도로 후 두 번째 합법 위치가 없는 상태에서 pending 자동 종료
pending 자동 종료 후 endTurn 가능
```

관련 위치:

```text
server.js handlePlayDevCard roadBuilding 분기
server.js handlePlaceFreeRoad
server.js canBuildRoadAt
```

### P1. 도로 건설 카드로 놓은 도로가 Longest Road를 갱신하지 않는다

현재 구현:

```text
placeFreeRoad 성공 후 updateWinnerForSeat만 호출한다.
longestRoad 갱신 helper 호출은 확인되지 않는다.
보고서에도 "서버 최장 교역로 계산은 11단계에서 새로 구현하지 않았다"고 기록되어 있다.
```

공식 규칙 기준:

```text
Road Building 카드로 놓은 도로도 일반 도로 건설 규칙을 따른다.
따라서 무료로 놓은 도로도 Longest Road 계산에 포함되어야 한다.
Longest Road로 2점을 얻어 10점에 도달할 수도 있다.
```

후속 조치:

```text
일반 buildRoad와 placeFreeRoad가 동일한 longestRoad 갱신 helper를 호출하게 만든다.
무료 도로 1개를 놓을 때마다 longestRoad를 재계산한다.
longestRoad 갱신 후 winner 판정을 다시 수행한다.
```

추가 테스트:

```text
roadBuilding 첫 번째 무료 도로로 longestRoad 획득
roadBuilding 두 번째 무료 도로로 longestRoad 획득
longestRoad 2점으로 10점 도달 시 winner 설정
동률이면 기존 소유자 유지 또는 longestRoad 없음 처리 정책이 기존 로직과 일치하는지 확인
```

관련 위치:

```text
server.js handleBuildRoad
server.js handlePlaceFreeRoad
server.js victoryPointsForSeat
```

### P2. 승점 카드의 승리 시 공개 정책이 부족하다

현재 구현:

```text
승점 카드는 playDevCard로 사용할 수 없다.
hiddenVictoryPoints로 본인 점수와 winner 판정에 반영한다.
상대에게는 devCount만 보인다.
```

공식 규칙 기준:

```text
승점 카드는 숨겨 둔다.
자신의 턴에 승점 카드를 포함해 10점 이상이면 승점 카드를 공개하고 승리한다.
승점 카드는 방금 산 카드라도 승리 조건을 만족하면 예외적으로 공개 가능하다.
```

판단:

```text
현재 서버 자동 winner 판정은 개인용 온라인 게임에서는 실용적으로 괜찮다.
다만 승리 순간에 상대에게 어떤 승점 카드가 있었는지 공개하는 결과 표시가 없다면 공식 룰의 reveal 경험은 부족하다.
```

후속 조치:

```text
winner가 설정된 이후에는 winner의 victory dev card 개수 또는 목록을 공개 결과로 보여줄지 정책을 정한다.
권장: 게임 진행 중에는 비공개, game.winner가 설정된 뒤에는 winner의 승점 카드 개수와 카드 타입만 공개한다.
승리 모달에 "숨은 승점 카드 N장 포함"을 표시한다.
```

추가 테스트:

```text
승점 카드 구매로 10점 도달 시 winner 설정
승리 전 opponent view에는 hiddenVictoryPoints/dev 상세 미노출
승리 후 결과 view 또는 winner summary에 승점 카드 정보 표시
```

관련 위치:

```text
server.js makePlayerView
server.js updateWinnerForSeat
script.js 승리/게임 종료 UI
```

### P2. 공식 개발 카드 테스트 커버리지가 일부 부족하다

현재 자동 테스트는 핵심 성공 경로와 일부 거부 경로를 확인하지만, 아래 항목은 추가 검증이 필요하다.

추가 권장 테스트:

```text
DEV_DECK_EMPTY 구매 거부
Year of Plenty 은행 재고 부족 거부
buyDevCard는 주사위 전 거부
playDevCard는 주사위 전 허용
개발 카드 한 턴 1장 제한이 주사위 전/후를 통틀어 유지
도로 건설 카드 pending 자동 종료
도로 건설 카드로 longestRoad 갱신
승점 카드 승리 시 공개 정책
3브라우저에서 본인 dev 상세/상대 devCount 동기화
새로고침 후 본인 dev 상세/상대 devCount 복구
오프라인 개발 카드 회귀
```

### 공식 규칙 기준 현재 상태 요약

완료로 볼 수 있는 항목:

```text
개발 카드 구성: 기사 14, 승점 5, 도로 건설 2, 풍년 2, 독점 2
개발 카드 비용: ore/wool/grain에 대응하는 mountain/pasture/field
개발 카드 여러 장 구매 가능
구매한 턴 사용 금지
한 턴 개발 카드 1장 사용 제한
주사위 전 개발 카드 사용 가능
buyDevCard는 주사위 후 가능
풍년 카드 자원 2장 획득
독점 카드 지정 자원 회수
상대에게 개발 카드 상세 비공개
상대에게는 devCount만 공개
승점 카드 hiddenVictoryPoints 반영
기사 카드 played count와 largestArmy 반영
```

아직 완료로 보기 어려운 항목:

```text
기사 카드의 강도 이동/약탈 공식 효과
승점 카드 승리 시 reveal 표시
3브라우저 실제 동기화 검증
오프라인 개발 카드 수동 회귀 검증
```

피드백 반영으로 추가 완료된 항목:

```text
도로 건설 카드 pending deadlock 방지
도로 건설 카드로 놓은 도로의 longestRoad 반영
```

### 피드백 최종 판단

```text
11단계 계획 기준으로는 구현 방향이 대체로 맞고, 보고서의 "부분 완료" 판단도 타당하다.
다만 CATAN 공식 개발 카드 전체 구현 기준으로는 아직 완성이라고 보기 어렵다.
roadBuilding pending 종료와 longestRoad 반영은 피드백 반영으로 보완했다.
기사 카드의 강도 이동/약탈은 12단계 핵심 범위로 반드시 완료해야 한다.
승점 카드 reveal은 게임 규칙 정확도와 UX를 높이는 후속 보강 항목이다.
```
