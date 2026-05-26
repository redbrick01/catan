# 온라인 11 개발 카드 테스트 계획

작성일: 2026-05-26

## 테스트 대상

온라인 개발 카드 구매/사용 서버 command와 private view를 검증한다.

```text
buyDevCard
playDevCard
placeFreeRoad
devDeck 비공개/devDeckCount 공개
본인 dev 상세/상대 devCount 분리
구매한 턴 사용 금지
한 턴 1장 사용 제한
승점 카드 비공개 점수
풍년/독점/도로 건설/기사 카드 효과
오프라인 개발 카드 회귀 영향
```

## 관련 구현 계획서

```text
docs/implementation_plans/2026-05-26_online-11-development-cards-plan.md
```

## 변경 파일 목록

```text
server.js
script.js
scripts/online-11-development-cards-ws-test.js
docs/implementation_plans/2026-05-26_online-11-development-cards-plan.md
docs/test_plans/2026-05-26_online-11-development-cards-test-plan.md
```

## 테스트 환경

```text
Windows PowerShell
Node.js
ws WebSocket client
로컬 서버 http://127.0.0.1:4173/
Codex in-app browser 단일 탭
```

## 자동 테스트 항목

```text
node --check server.js
node --check script.js
node --check scripts/online-11-development-cards-ws-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

WebSocket 테스트 범위:

```text
1. buyDevCard 후 본인 view에만 dev 상세가 보이는지 확인한다.
2. 상대 view에는 devCount만 보이고 dev/hiddenVictoryPoints가 없는지 확인한다.
3. matchState.devDeck 배열이 클라이언트 view에 없는지 확인한다.
4. devDeckCount가 구매 후 감소하는지 확인한다.
5. 승점 카드는 playDevCard로 사용할 수 없는지 확인한다.
6. 구매한 턴에 해당 카드를 사용할 수 없는지 확인한다.
7. yearPlenty가 같은 자원 2장을 지급하는지 확인한다.
8. 한 턴 1장 사용 제한이 적용되는지 확인한다.
9. monopoly가 선택 자원을 다른 플레이어에게서 회수하는지 확인한다.
10. monopoly 후에도 상대 자원 상세가 노출되지 않는지 확인한다.
11. roadBuilding이 pendingFreeRoads/freeRoadOwnerSeat를 설정하는지 확인한다.
12. pendingFreeRoads 중 endTurn이 거절되는지 확인한다.
13. placeFreeRoad가 비용 없이 도로를 놓고 도로 말만 차감하는지 확인한다.
14. 권한 없는 플레이어의 placeFreeRoad가 거절되는지 확인한다.
15. placeFreeRoad가 longestRoad를 갱신하는지 확인한다.
16. 첫 번째 무료 도로 후 더 놓을 합법 위치가 없으면 pendingFreeRoads가 자동 종료되는지 확인한다.
17. pending 자동 종료 후 endTurn이 가능한지 확인한다.
18. knight 사용 시 knights가 증가하고 largestArmy가 갱신되는지 확인한다.
19. knight 사용 시 강도 이동/약탈 pending이 생성되지 않는지 확인한다.
20. 기존 10단계 player trade WebSocket 테스트가 계속 통과하는지 확인한다.
```

## 브라우저 검증 항목

```text
로컬 서버를 실행하고 http://127.0.0.1:4173/ 에 접속한다.
페이지 title이 카탄으로 표시되는지 확인한다.
콘솔 error가 없는지 확인한다.
```

## 수동 테스트 항목

온라인 3브라우저:

```text
1. 서버를 완전히 재시작한다.
2. Chrome 일반 창, 시크릿 창, 다른 브라우저 또는 실제 기기로 3명이 접속한다.
3. 게임 시작 후 초기 배치를 완료한다.
4. 현재 차례 플레이어가 주사위를 굴린 뒤 개발 카드를 구매한다.
5. 본인에게만 카드 종류가 보이고 상대에게는 개발 카드 장수만 보이는지 확인한다.
6. 같은 턴에 방금 산 카드가 사용되지 않는지 확인한다.
7. 다음 자기 턴에 사용 가능한지 확인한다.
8. 풍년 카드로 자원 2장을 받는지 확인한다.
9. 독점 카드로 지정 자원을 모두 가져오는지 확인한다.
10. 도로 건설 카드 사용 후 무료 도로 배치 pending이 표시되고 다른 행동이 막히는지 확인한다.
11. 무료 도로 2개를 놓으면 pending이 종료되는지 확인한다.
12. 기사 카드를 사용해도 11단계에서는 강도 이동/약탈 UI가 열리지 않는지 확인한다.
13. 승점 카드가 상대에게 노출되지 않는지 확인한다.
14. 재접속 후 본인 dev 상세과 상대 devCount가 복구되는지 확인한다.
15. 개발자 도구에서 수신 state에 devDeck 배열이 없는지 확인한다.
```

오프라인 회귀:

```text
1. 오프라인 게임을 시작한다.
2. play phase에서 주사위를 굴린다.
3. 개발 카드를 구매한다.
4. 기존 오프라인 개발 카드 사용 모달과 효과가 유지되는지 확인한다.
```

## 규칙 검증 항목

```text
개발 카드 구매는 rolled=true에서만 가능하다.
개발 카드 사용은 주사위 전에도 가능하다.
구매한 턴 사용 금지가 round+active seat 기준으로 적용된다.
승점 카드는 사용 불가다.
승점 카드는 숨은 점수로 winner 판정에 반영된다.
한 턴 1장 제한이 적용된다.
pending player trade/free road 중 구매/사용이 막힌다.
도로 건설 카드로 놓은 무료 도로도 longestRoad에 반영된다.
무료 도로 pending은 더 놓을 합법 도로가 없으면 자동 종료된다.
```

## 실패 시 확인할 로그 또는 상태

```text
WebSocket error code/message
matchState.game.players[viewerSeatIndex].dev
상대 viewer의 matchState.game.players[targetSeat].devCount
matchState.devDeck 존재 여부
matchState.devDeckCount
game.pendingFreeRoads
game.freeRoadOwnerSeat
game.usedDevThisTurn
game.largestArmy
```

## 완료 기준

```text
정적 점검과 WebSocket 자동 테스트가 통과한다.
기존 10단계 회귀 테스트가 통과한다.
브라우저 단일 탭 로드와 콘솔 error 0건을 확인한다.
수동 테스트하지 못한 항목은 최종 보고서에 명시한다.
```
