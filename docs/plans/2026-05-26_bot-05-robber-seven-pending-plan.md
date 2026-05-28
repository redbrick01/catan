# 봇 05 7/강도/pending action 계획

작성일: 2026-05-26

## 목적

7이 나오거나 기사 카드로 강도 흐름이 시작되었을 때 봇이 필요한 응답을 자동 처리하게 한다. 이 단계는 봇 포함 게임이 멈추지 않기 위한 핵심 안정화 단계다.

## 2차 꼼꼼 피드백 요약

```text
1. 피해자 0명/1명인 경우 서버가 robber flow를 자동 종료할 수 있으므로 봇이 chooseRobberVictim을 억지로 호출하면 안 된다.
2. 현재 서버 검증 기준에서는 victimSeatIndex null command 경로가 없으므로 "victim 없음"은 command가 아니라 최신 state 확인으로 처리해야 한다.
3. discardForSeven pending은 여러 플레이어가 동시에 대상일 수 있어, 봇별 중복 discard 방지 signature가 필요하다.
4. runner는 pendingAction.type만 보면 부족하고 role(actor/discarder/waiting), actorSeatIndex, discard entry 상태를 함께 판정해야 한다.
5. 강도 이동 타일 평가는 공정해야 하며, 상대의 정확한 자원 종류나 숨은 개발 카드 정보는 쓰지 않아야 한다.
6. moveRobber 성공 후에는 chooseRobberVictim을 같은 tick에서 이어붙이기보다 최신 revision을 다시 읽고 별도 step으로 예약해야 한다.
7. pending 처리 실패는 일반 턴 fallback으로 넘기면 안 되고, 해당 pending command의 제한된 재시도 또는 대기 상태로 끝나야 한다.
```

## 범위

포함:

```text
봇의 discardForSeven 자동 선택
봇의 robber tile 선택
봇의 robber victim 선택
pending action actor가 봇인지 감지
합법 fallback
7로 시작된 discard -> robber move -> victim choice 순서 유지
기사 카드로 시작된 robber flow와 7 robber flow 모두 대응
```

제외:

```text
기사 카드 사용 시점 판단
고급 견제 전략
상대 손패 정밀 추정
```

## 자원 버리기

기본 정책:

```text
버려야 할 정확한 수량을 맞춘다.
가장 많이 가진 자원부터 버린다.
현재 목표에 필요한 희소 자원은 가능하면 보존한다.
판단 실패 시 보유량 순서대로 버린다.
```

목표 보존 예시:

```text
도시 목표: 밀/광석 보존
정착지 목표: 나무/벽돌/양/밀 보존
도로 목표: 나무/벽돌 보존
```

discard 결과는 반드시 다음을 만족해야 한다.

```text
선택한 총량 === required discard count
선택한 각 자원 수량 <= 봇 보유량
음수/소수/알 수 없는 자원 없음
```

discard 대상 판정:

```text
pendingAction.type === "discardForSeven"이어야 한다.
pendingAction.discards 안에 봇 seatIndex entry가 있어야 한다.
entry.discarded가 false여야 한다.
entry.needed가 1 이상이어야 한다.
봇의 현재 자원 총량이 entry.needed 이상이어야 한다.
```

discard 선택은 deterministic해야 한다. 보유량과 보존 점수가 같으면 고정 `resourceTypes` 순서의 역순 또는 문서화된 tie-break 하나를 사용한다. 같은 state에서 같은 discard 결과가 나와야 테스트가 안정적이다.

discard command 성공 후에는 최신 state를 다시 읽는다. 봇이 마지막 discard 대상자였다면 서버가 즉시 `moveRobber` pending으로 전환할 수 있으므로, 기존 `discardForSeven` state를 기준으로 다음 행동을 이어가지 않는다.

## 강도 이동

타일 평가:

```text
내 건물이 붙은 타일은 감점
상대 건물이 붙은 타일은 가산점
6/8 타일은 가산점
현재 1등 또는 나보다 앞선 플레이어의 타일은 가산점
자원이 생산되지 않는 사막은 감점
현재 강도 위치와 같은 타일은 제외
```

강도 이동은 다음 조건에서만 실행한다.

```text
모든 discard 대상자가 discard를 완료했다.
현재 pending actor가 봇이다.
현재 pending kind가 robber move다.
이동 대상 tile이 현재 robber tile이 아니다.
이동 대상 tile이 존재한다.
```

7로 시작된 강도와 기사 카드로 시작된 강도는 시작 원인이 다르지만, 이동/피해자 선택 command는 같은 검증 경로를 사용한다.

타일 평가에 사용할 수 있는 정보:

```text
타일 번호/자원/강도 위치
타일 인접 vertex의 owner/city 여부
공개 점수, 공개 기사 수, 공개 건물 수
상대 resourceCount
```

사용하면 안 되는 정보:

```text
상대의 정확한 손패 자원 종류
상대의 숨은 개발 카드 종류
훔칠 자원을 미리 아는 정보
서버 내부 random 결과
```

타일 fallback:

```text
1. 현재 robberTile이 아닌 합법 타일 전체를 만든다.
2. 평가 점수가 가장 높은 타일을 고른다.
3. 동점이면 상대 resourceCount 합이 큰 타일을 고른다.
4. 그래도 동점이면 낮은 tileId를 고른다.
5. 평가 함수가 실패하면 현재 robberTile이 아닌 가장 낮은 tileId를 고른다.
```

## 피해자 선택

```text
자원 카드가 있는 플레이어만 후보
승점이 높은 플레이어 우선
현재 1등 우선
같은 조건이면 자원 총량이 많은 플레이어 우선
```

피해자 선택은 강도 이동 command와 분리한다.

```text
moveRobber 성공 후 victim choice pending이 생기면 chooseRobberVictim을 별도 step에서 실행한다.
피해자 후보가 없으면 서버가 pendingAction을 종료했는지 최신 state로 확인하고 command를 보내지 않는다.
피해자 후보가 1명이면 서버가 자동 steal 후 pendingAction을 종료할 수 있으므로 chooseRobberVictim을 보내지 않는다.
피해자 후보가 2명 이상이고 pendingAction.type이 chooseRobberVictim일 때만 chooseRobberVictim을 보낸다.
moveRobber와 chooseRobberVictim을 같은 오래된 state 기준으로 연속 실행하지 않는다.
```

피해자 선택 command 조건:

```text
pendingAction.type === "chooseRobberVictim"
pendingAction.actorSeatIndex === bot.seatIndex
pendingAction.victimSeatIndexes.length >= 2
선택한 victimSeatIndex가 victimSeatIndexes에 포함됨
선택한 victim의 resourceCount > 0
```

선택 기준은 공개 정보만 사용한다.

```text
1. 현재 점수가 가장 높은 플레이어
2. 봇보다 앞선 플레이어
3. resourceCount가 가장 많은 플레이어
4. 기사 수/최장 교역로 등 공개 보너스 경쟁자
5. 동점이면 낮은 seatIndex
```

## 구현 순서

```text
1. pending action 종류 판별 helper 추가
2. chooseBotDiscardResources 추가
3. scoreRobberTileForBot 추가
4. chooseBotRobberTile 추가
5. chooseBotRobberVictim 추가
6. runner에서 pending action 우선 처리
7. discard 전체 완료 전 robber move 금지 조건 추가
8. moveRobber 후 최신 state에서 victim pending 재확인
9. 실패 시 합법 fallback 적용
10. pending signature로 같은 pending에 대한 중복 command 방지
11. 피해자 0명/1명 자동 처리 경로 테스트 추가
```

## 수정 대상 파일

```text
server.js
- pending action actor 감지
- discard 자원 선택
- robber tile/victim 평가
- runner의 pending 우선 처리

scripts/
- forced dice 7 테스트
- robber pending 테스트
```

## pending 처리 우선순위

runner는 일반 턴보다 pending action을 먼저 처리한다.

```text
1. 봇이 discard 대상이면 discardForSeven
2. discard pending이 남아 있으면 robber move를 하지 않음
3. 봇이 robber move actor이면 moveRobber
4. moveRobber 후 최신 state에서 봇이 victim choice actor이고 후보가 2명 이상이면 chooseRobberVictim
5. pending이 봇과 관련 없으면 대기
```

여러 봇이 discard 대상이면 각 봇의 runner가 순차적으로 응답하되, 같은 pending revision에서 중복 discard하지 않게 한다.

사람이 응답해야 하는 pending은 봇 runner가 해결하려고 시도하지 않는다.

pending 판정 helper는 다음 정보를 함께 반환한다.

```text
kind: none | discardForSeven | moveRobber | chooseRobberVictim | wait
role: actor | discarder | waiting
pendingId: type + source + actorSeatIndex + createdAt
seatIndex
needed
victimSeatIndexes
reason
```

중복 실행 방지 signature:

```text
discardForSeven: pendingId + seatIndex + needed
moveRobber: pendingId + actorSeatIndex + fromTileId
chooseRobberVictim: pendingId + actorSeatIndex + tileId + victimSeatIndexes.join(",")
```

runner는 성공한 signature와 validation 실패한 signature를 구분해서 저장한다. 성공한 signature는 같은 pending에서 재실행하지 않는다. validation 실패 signature는 fallback을 한 번만 허용하고, fallback도 실패하면 해당 pending을 대기 상태로 두고 서버 로그에 남긴다.

## 공정성 기준

```text
강도 피해자 선택 시 상대의 정확한 자원 종류는 사용하지 않는다.
상대 resourceCount와 공개 승점/건물 정보만 사용한다.
훔친 자원 종류는 피해자와 actor에게만 허용된 기존 view 정책을 따른다.
봇의 타일/피해자 평가는 공개 상태와 봇 자신의 손패만 사용한다.
discard 선택은 봇 자신의 자원만 사용한다.
```

전역 게임 로그에는 다음 정도만 남긴다.

```text
봇이 7 규칙으로 N장을 버림
봇이 강도를 tileId 또는 타일 이름으로 이동
봇이 피해자를 선택함
```

전역 로그에 훔친 자원 종류, 상대 손패 구성, 선택 사유의 숨은 정보 추정은 남기지 않는다.

## 상세 구현 체크리스트

```text
[ ] 7 discard pending에서 봇 대상 entry만 처리한다.
[ ] 사람 discard pending이 남아 있으면 robber move를 실행하지 않는다.
[ ] discard command 실패 시 한 번만 fallback discard를 재계산한다.
[ ] robber tile은 현재 robber tile과 다른 tile만 선택한다.
[ ] moveRobber command 후 최신 state를 다시 읽는다.
[ ] 피해자 후보가 없으면 chooseRobberVictim command를 보내지 않는다.
[ ] 피해자 후보가 1명이면 서버 자동 steal/종료 경로를 확인하고 command를 보내지 않는다.
[ ] 피해자 후보가 2명 이상인 chooseRobberVictim pending에서만 victim command를 보낸다.
[ ] 강도 이동 후 victim pending이 새로 생기는지 확인한다.
[ ] actor가 사람이면 봇 runner는 해당 pending을 건드리지 않는다.
[ ] 로그에 훔친 자원 종류가 전역 노출되지 않는지 확인한다.
[ ] pending signature로 같은 discard/move/victim command를 중복 실행하지 않는다.
[ ] fallback은 pending command별 1회로 제한한다.
[ ] pending 처리 실패 후 일반 턴 행동이나 endTurn으로 넘어가지 않는다.
[ ] 타일/피해자 평가는 상대의 정확한 자원 종류를 사용하지 않는다.
```

## 검증 계획

자동:

```text
봇이 discard 대상이면 정확한 수량을 버린다.
봇이 강도 actor이면 합법 타일로 강도를 이동한다.
봇이 피해자 선택 actor이면 합법 피해자를 선택한다.
피해자가 없으면 victim command 없이 흐름이 종료된다.
피해자가 1명뿐이면 victim command 없이 서버 자동 steal/종료 흐름을 따른다.
피해자가 2명 이상이면 chooseRobberVictim command를 보낸다.
pending action 처리 후 다음 상태로 진행된다.
사람 discard가 남아 있으면 봇이 robber move를 하지 않는다.
moveRobber와 chooseRobberVictim이 최신 state 기준으로 분리 실행된다.
기사 카드로 시작된 robber flow에서도 봇이 이동/피해자 선택을 처리한다.
같은 pending signature에서 discard/move/victim command가 중복 실행되지 않는다.
fallback 실패 후 일반 턴 행동으로 넘어가지 않는다.
```

수동:

```text
forced dice 7로 봇 discard를 유도한다.
봇이 강도를 이동하는지 확인한다.
모든 브라우저에서 pending UI가 사라지는지 확인한다.
피해자 0명/1명/2명 이상 상황을 각각 강제 fixture로 확인한다.
```

## 위험 요소

```text
여러 플레이어 discard pending에서 봇 응답과 사람 응답 순서가 꼬일 수 있다.
피해자 없는 강도 이동에서 victim 선택을 시도할 수 있다.
피해자 1명 자동 steal 경로에서 불필요한 chooseRobberVictim command를 보내 오류가 날 수 있다.
훔친 자원 종류가 로그로 노출될 수 있다.
discard 완료 전 robber move를 시도해 서버 오류가 반복될 수 있다.
moveRobber 직후 오래된 state로 victim을 선택할 수 있다.
사람 pending을 봇이 대신 처리하려고 할 수 있다.
같은 pending revision에서 runner가 중복 command를 보내 `DISCARD_ALREADY_DONE` 또는 `INVALID_PENDING_ACTION` 오류를 반복할 수 있다.
pending 실패 후 일반 턴 fallback으로 넘어가면 서버가 계속 `pending action must be resolved first`를 반환할 수 있다.
```

## 롤백/복구 방법

```text
평가 함수가 문제를 만들면 첫 번째 합법 타일/피해자 fallback으로 축소한다.
discard 보존 로직이 문제면 보유량 많은 순서 버리기로 축소한다.
pending runner 연결만 끄면 일반 턴 runner는 유지할 수 있다.
victim 선택이 불안정하면 서버 자동 경로를 제외하고 2명 이상 후보에서 낮은 seatIndex만 고르는 보수 정책으로 축소한다.
중복 실행 문제가 생기면 pending signature 단위로 성공/실패 후 재시도를 완전히 끈다.
```

## 테스트 산출물

```text
docs/tests/2026-05-26_bot-05-robber-seven-pending-test-plan.md
docs/reports/2026-05-26_bot-05-robber-seven-pending-final-report.md
```

## 완료 기준

```text
7/강도 흐름에서 봇 때문에 게임이 멈추지 않는다.
봇의 모든 pending 응답은 합법 command로 처리된다.
비공개 자원 정보가 상대에게 노출되지 않는다.
discard가 모두 끝난 뒤에만 robber move가 실행된다.
moveRobber와 victim 선택은 최신 state 기준으로 분리 실행된다.
사람이 응답해야 하는 pending은 봇이 건드리지 않는다.
피해자 0명/1명 자동 처리 경로에서 불필요한 victim command를 보내지 않는다.
같은 pending에 대해 봇 command가 중복 실행되지 않는다.
pending 처리 실패가 일반 턴 행동 또는 endTurn fallback으로 번지지 않는다.
```
