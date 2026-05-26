# 봇 06 개발 카드 계획

작성일: 2026-05-26

## 목적

봇이 개발 카드를 사기만 하고 방치하지 않도록 최소 사용 흐름을 만든다. 첫 구현은 안정성을 우선해 승점, 기사, 풍년을 1차 범위로 삼고, 독점과 도로 건설은 2차 범위로 분리한다.

## 2차 꼼꼼 피드백 요약

```text
1. 서버가 monopoly/roadBuilding을 이미 지원하더라도 1차 봇 선택기에서는 명시적으로 제외해야 한다.
2. 개발 카드 사용 가능 조건은 pendingAction뿐 아니라 pendingPlayerTrade, pendingFreeRoads, discard/robber pending까지 모두 blocking 상태로 봐야 한다.
3. 구매 턴 사용 금지는 boughtRound + boughtTurnSeat 기준이며, 구형 boughtTurn만 보는 로직과 섞이면 안 된다.
4. 풍년은 같은 자원 2개 선택이 가능하지만 은행 재고가 선택 수량 이상이어야 한다.
5. 기사 사용은 즉시 moveRobber를 직접 이어붙이지 않고 bot-05 pending runner가 처리하도록 분리해야 한다.
6. 승점 카드는 봇 자신에게는 손패 타입으로 보이지만, 상대 view/log에는 노출되면 안 된다.
7. 개발 카드 사용 실패 후 같은 카드/같은 payload를 반복하면 턴이 길어질 수 있으므로 시도 signature가 필요하다.
```

## 범위

포함:

```text
승점 카드 보유 처리 확인
기사 카드 사용
기사 사용 후 강도 흐름 연결
풍년 카드 사용
풍년 자원 2개 자동 선택
개발 카드 구매 턴 사용 금지 규칙 준수
개발 카드 사용 후 새 pending/action 상태를 최신 state로 재확인
```

2차 포함 후보:

```text
독점 카드 사용
도로 건설 카드 사용
```

제외:

```text
상대 개발 카드 추론
고급 기사 타이밍
고급 독점 자원 추정
최장 교역로 목적의 도로 건설 카드 전략
독점/도로 건설 카드 fixture 자동 테스트
승점 카드 사용 command 전송
```

## 기본 정책

```text
승점: 별도 사용 없음, 점수 계산에서 자동 반영
기사: 강도 이동 이득이 있거나 최대 기사 보너스 경쟁 가능성이 있으면 사용
풍년: 다음 목표에 부족한 자원 2개 선택
```

승점 카드는 절대 `playDevCard` 대상이 아니다. 봇이 승점 카드를 "사용"하려고 command를 보내면 안 되며, 서버 점수 계산과 승리 조건에서만 반영한다.

풍년 자원 선택:

```text
도시 목표 부족분 우선
정착지 목표 부족분
도로 목표 부족분
개발 카드 구매 부족분
그래도 없으면 밀/광석 우선
```

풍년 사용 후 즉시 이어지는 건설/구매 행동은 bot-04의 일반 행동 루프가 최신 state를 다시 읽은 뒤 처리한다. 이 단계는 풍년 카드 사용과 자원 선택까지만 책임진다.

2차 정책:

```text
독점: 공개 정보와 생산 가능성 기준으로 자원 선택
도로 건설: 정착지 후보 쪽 합법 도로 1~2개 배치
```

도로 건설 카드는 pending action이 이어지므로 1차 안정화 후 구현한다.

개발 카드 사용 전 확인:

```text
현재 봇의 턴인가
이번 턴에 구매한 카드가 아닌가
이미 이번 턴에 개발 카드를 사용하지 않았는가
blocking 상태가 없는가
해당 카드가 실제로 봇 손에 있는가
카드 type이 1차 허용 범위인가: knight 또는 yearPlenty
```

blocking 상태 정의:

```text
room.pendingPlayerTrade가 있다.
game.pendingAction이 있다.
game.pendingDiscards 중 미완료 항목이 있다.
game.pendingRobberVictims가 남아 있다.
game.pendingFreeRoads > 0이다.
winner가 이미 있다.
```

구매 턴 사용 금지 기준:

```text
card.boughtRound === game.round
card.boughtTurnSeat === game.active
```

위 조건을 만족하면 이번 턴에 산 카드이므로 사용하지 않는다. 기존 오프라인/구형 필드인 `boughtTurn`만 기준으로 판단하지 않는다.

## 구현 순서

```text
1. chooseBotDevCardToPlay 추가
2. chooseBotYearOfPlentyResources 추가
3. 기사 사용 조건 추가
4. 기사 사용 후 기존 강도 pending 처리와 연결
5. 승점 카드 보유/점수 계산 회귀 확인
6. 구매 턴 사용 금지 규칙 확인
7. 풍년 사용 후 bot-04 행동 루프가 최신 state를 다시 읽는지 확인
8. 독점/도로건설은 2차 구현 여부 결정
9. blocking 상태 공통 helper를 개발 카드 판단에도 재사용
10. attemptedDevCards signature로 실패 반복 방지
11. 상대 view/log에 숨은 개발 카드 타입이 노출되지 않는지 회귀 확인
```

## 수정 대상 파일

```text
server.js
- 봇 개발 카드 선택 함수
- 풍년 자원 선택 함수
- 기사 사용 후 pending runner 연결
- 개발 카드 사용 규칙 회귀 점검
- 개발 카드 사용 실패 signature 관리

scripts/
- 봇 개발 카드 fixture 테스트
```

## 사용 타이밍

```text
일반 행동 전: 기사 사용으로 강도 이득이 큰 경우만 고려
일반 행동 후: 풍년으로 즉시 목표 행동이 가능하면 고려
턴 종료 전: 사용 가능한 카드가 있고 행동 제한에 걸리지 않으면 1회 고려
```

개발 카드 사용은 bot-04의 `majorActionsUsed`에는 포함하지 않는다. 대신 서버 규칙인 `usedDevThisTurn`과 이 문서의 `attemptedDevCards`로 제한한다. 개발 카드 사용 후 pending이 생기면 일반 행동 루프는 멈추고, pending이 없더라도 최신 state를 읽은 뒤 bot-04가 남은 주요 행동 가능 여부를 다시 판단한다.

첫 버전에서는 보수적으로 적용한다.

```text
기사는 robber 이득이 명확할 때만 사용
풍년은 즉시 도시/정착지/도로/개발 카드 구매로 이어질 때만 사용
승점은 사용하지 않음
독점/도로건설은 서버가 지원하더라도 봇 자동 선택 대상에서 제외
```

개발 카드 선택 순서:

```text
1. 사용 가능한 yearPlenty가 있고, 자원 2개 선택으로 즉시 목표 행동이 가능하면 yearPlenty
2. 사용 가능한 knight가 있고, 강도 이동 이득 또는 largestArmy 경쟁 이득이 명확하면 knight
3. 그 외에는 사용하지 않음
```

한 턴에 개발 카드는 최대 1장만 사용한다. `game.usedDevThisTurn`이 true가 되면 같은 턴에서 추가 개발 카드 판단을 하지 않는다.

기사 사용 후 흐름:

```text
1. playDevCard(knight) command 실행
2. 최신 state를 다시 읽는다.
3. robber move pending이 봇 actor이면 bot-05 runner가 처리한다.
4. victim choice pending이 생기면 bot-05 runner가 처리한다.
5. 이 단계에서 moveRobber/chooseRobberVictim을 같은 오래된 state로 직접 이어서 호출하지 않는다.
```

풍년 사용 후 흐름:

```text
1. chooseBotYearOfPlentyResources로 자원 2개 선택
2. playDevCard(yearPlenty, resources) command 실행
3. 최신 state를 다시 읽는다.
4. 추가 건설/구매 여부는 bot-04 일반 행동 루프가 판단한다.
```

풍년 payload 계약:

```text
resources는 길이 2의 배열이다.
각 항목은 resourceTypes 중 하나다.
같은 자원 2개 선택은 허용한다.
같은 자원 2개를 선택하면 은행에 해당 자원이 2장 이상 있어야 한다.
서로 다른 자원은 각각 은행에 1장 이상 있어야 한다.
선택 결과가 즉시 목표 행동을 가능하게 해야 한다.
```

풍년 선택 fallback:

```text
1. 목표 비용의 부족 자원을 채운다.
2. 부족 자원이 1개면 그 자원 1개 + 다음 우선 목표 부족 자원 1개를 고른다.
3. 그래도 없으면 은행 재고가 있는 밀/광석 순으로 고른다.
4. 은행 재고 때문에 2개를 만들 수 없으면 풍년을 사용하지 않는다.
```

기사 사용 조건:

```text
현재 robberTile과 다른 합법 타일이 있다.
bot-05 기준으로 공격 가능한 공개 이득이 있다.
또는 기사 사용 후 knights >= 3이고 현재 largestArmy 보유자보다 기사 수가 많아질 수 있다.
기사 사용 후 생기는 moveRobber pending을 bot-05가 처리할 수 있다.
```

기사 사용 후 `playDevCard(knight)`가 성공하면 일반 행동 루프는 즉시 멈추고 최신 state를 기준으로 pending runner를 예약한다.

## 시도/실패 관리

```text
attemptedDevCards: cardId + card.type + payload signature
```

같은 턴에서 같은 카드와 같은 payload가 validation 실패하면 다시 시도하지 않는다. 실패가 `DEV_CARD_BOUGHT_THIS_TURN`, `DEV_CARD_ALREADY_USED`, `INVALID_ACTION`, `BANK_RESOURCE_EMPTY`라면 최신 state를 다시 읽고 해당 턴의 개발 카드 판단을 종료한다.

성공한 개발 카드는 서버에서 손패에서 제거되므로 같은 `cardId`를 다시 참조하지 않는다. 성공 후 card list, `usedDevThisTurn`, `lastDevCardResult`, `pendingAction`은 모두 최신 state 기준으로만 판단한다.

## 상세 구현 체크리스트

```text
[ ] boughtRound + boughtTurnSeat 기준으로 구매 턴 사용 금지를 확인한다.
[ ] game.usedDevThisTurn이 true이면 개발 카드 판단을 하지 않는다.
[ ] pendingPlayerTrade/pendingAction/pendingFreeRoads 등 blocking 상태에서는 개발 카드를 사용하지 않는다.
[ ] dev card id를 command payload에 정확히 전달한다.
[ ] 승점 카드에는 playDevCard command를 보내지 않는다.
[ ] 독점/도로건설 카드는 1차 구현에서 선택하지 않는다.
[ ] 서버가 독점/도로건설을 지원하더라도 봇 선택기에서 제외한다.
[ ] 풍년 선택 자원은 중복 선택 수량까지 포함해 은행 재고를 넘지 않는다.
[ ] 풍년은 사용 직후 목표 행동이 가능할 때만 사용한다.
[ ] 기사 사용 후 bot-05 pending 처리가 이어진다.
[ ] 풍년 사용 후 직접 건설 command를 연속 실행하지 않고 최신 state 재조회로 넘긴다.
[ ] 개발 카드 사용 로그가 카드 종류를 과도하게 노출하지 않는다.
[ ] 승점 카드는 상대 view에 종류가 노출되지 않는다.
[ ] 같은 카드/같은 payload 실패를 같은 턴에 반복하지 않는다.
[ ] 개발 카드 사용 성공 후 최신 state에서 winner/pending/usedDevThisTurn을 확인한다.
```

## 검증 계획

자동:

```text
봇이 풍년 카드로 부족 자원 2개를 선택한다.
풍년에서 같은 자원 2개를 선택할 때 은행 재고 2장 이상 조건을 지킨다.
은행 재고가 부족하면 풍년을 사용하지 않는다.
봇이 기사 카드 사용 후 강도 흐름을 완료한다.
봇이 구매한 턴의 개발 카드를 즉시 사용하지 않는다.
usedDevThisTurn이 true이면 다른 개발 카드를 사용하지 않는다.
pendingPlayerTrade 또는 pendingFreeRoads가 있으면 개발 카드를 사용하지 않는다.
승점 카드는 공개되지 않지만 승리 조건에는 반영된다.
승점 카드에 playDevCard command를 보내지 않는다.
독점/도로건설 카드는 1차 범위에서 자동 사용하지 않는다.
풍년 사용 후 추가 행동은 최신 state 기준으로 bot-04가 판단한다.
같은 카드/같은 payload 실패를 반복하지 않는다.
```

수동:

```text
봇에게 기사/풍년/승점 카드를 가진 fixture를 만든다.
봇 턴이 멈추지 않고 카드 사용 흐름을 완료하는지 확인한다.
로그에 비공개 개발 카드 정보가 노출되지 않는지 확인한다.
```

## 위험 요소

```text
개발 카드 구매 턴 사용 금지 규칙과 충돌할 수 있다.
기사 사용 후 강도 pending이 남을 수 있다.
풍년 자원 선택이 은행 재고와 충돌할 수 있다.
승점 카드가 로그나 상대 view에 노출될 수 있다.
풍년 사용 직후 오래된 state로 건설 command를 보내 자원 불일치가 날 수 있다.
승점 카드를 사용형 카드처럼 처리해 잘못된 command를 보낼 수 있다.
독점/도로건설이 1차 범위에 섞여 pending이 늘어날 수 있다.
서버가 지원하는 개발 카드 전체를 봇 선택기에 그대로 열어 1차 범위가 커질 수 있다.
구형 `boughtTurn` 기준과 서버의 `boughtRound/boughtTurnSeat` 기준이 섞여 구매 턴 카드를 사용하려 할 수 있다.
같은 실패 payload를 반복해 runner가 턴을 길게 잡을 수 있다.
기사 사용 후 일반 행동 루프가 계속되어 pending 상태에서 build/endTurn을 시도할 수 있다.
```

## 롤백/복구 방법

```text
개발 카드 사용이 불안정하면 구매만 유지하고 자동 사용을 끈다.
풍년 자동 선택이 문제면 기사만 1차 범위로 축소한다.
기사 pending 연결이 문제면 풍년만 남기고 기사 자동 사용을 끈다.
독점/도로건설은 별도 후속 단계로 남긴다.
승점 관련 문제가 있으면 playDevCard 대상에서 victory를 명시적으로 제외하고 점수 계산 회귀만 남긴다.
반복 실패 문제가 있으면 개발 카드 자동 사용은 턴당 1회 시도만 허용한다.
```

## 테스트 산출물

```text
docs/test_plans/2026-05-26_bot-06-dev-cards-test-plan.md
docs/final_reports/2026-05-26_bot-06-dev-cards-final-report.md
```

## 완료 기준

```text
봇이 승점/기사/풍년을 기본 처리한다.
개발 카드 사용으로 pending action이 방치되지 않는다.
비공개 개발 카드 정보가 노출되지 않는다.
승점 카드는 사용 command 없이 점수/승리 조건에만 반영된다.
독점/도로건설은 1차 구현에서 자동 사용되지 않는다.
구매 턴 카드, 이미 개발 카드를 사용한 턴, blocking 상태에서는 개발 카드를 사용하지 않는다.
풍년은 은행 재고와 payload 검증을 만족할 때만 사용한다.
개발 카드 사용 실패가 같은 턴 반복 시도로 이어지지 않는다.
```
