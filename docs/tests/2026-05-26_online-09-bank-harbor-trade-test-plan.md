# 온라인 모드 9단계 은행/항구 교환 테스트 계획

작성일: 2026-05-26

## 목적

오프라인/온라인 모두 하나의 교환 버튼과 공용 은행/항구 교환 모달을 사용하고, 온라인에서는 `bankTrade` command가 서버 권위로 4:1, 3:1, 2:1 비율을 검증하는지 확인한다.

## 변경 파일

```text
server.js
script.js
index.html
styles.css
scripts/online-09-bank-trade-ws-test.js
docs/plans/2026-05-26_online-09-bank-harbor-trade-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
node --check scripts/online-09-bank-trade-ws-test.js
node scripts/online-09-bank-trade-ws-test.js
```

WebSocket 테스트 범위:

```text
1. 3인 온라인 방을 만들고 초기 배치 완료 후 play phase fixture를 구성한다.
2. rolled=false 상태의 bankTrade가 ROLL_REQUIRED로 거절되는지 확인한다.
3. active player가 아닌 참가자의 bankTrade가 NOT_YOUR_TURN으로 거절되는지 확인한다.
4. give/get이 같은 자원인 요청이 SAME_RESOURCE로 거절되는지 확인한다.
5. 유효하지 않은 resource id가 INVALID_RESOURCE로 거절되는지 확인한다.
6. 현재 viewer의 trade.ratios 기준으로 bankTrade 성공 시 본인 자원 상세와 은행 재고가 갱신되는지 확인한다.
7. 상대 viewer에는 자원 상세가 노출되지 않고 resourceCount만 남는지 확인한다.
8. connected=false 참가자가 있으면 ROOM_NOT_READY로 거절되는지 확인한다.
9. ended 방에서는 ROOM_ENDED로 거절되는지 확인한다.
```

## 오프라인 모달 테스트

```text
1. 오프라인 게임을 시작한다.
2. play phase에서 현재 차례 플레이어가 주사위를 굴린다.
3. 교환 버튼을 눌러 공용 은행/항구 교환 모달이 열리는지 확인한다.
4. 모달 상단에 현재 보유 항구 기준 교환 규칙이 표시되는지 확인한다.
5. 좌측에서 지불 자원, 우측에서 받을 자원을 선택한다.
6. 하단 요약에 실제 적용 비율과 교환 요약이 표시되는지 확인한다.
7. 교환 실행 후 모달이 닫히고 현재 플레이어 자원과 은행 재고가 기존 로컬 로직대로 갱신되는지 확인한다.
8. 자원 부족, 같은 자원 선택, 은행 재고 부족 상태에서 실행 버튼이 비활성화되거나 오류 메시지가 표시되는지 확인한다.
```

## 온라인 3브라우저 수동 테스트

```text
1. Chrome 일반 창, 시크릿 창, 다른 브라우저 또는 실제 기기 1대를 준비한다.
2. http://100.88.125.81:4173/ 또는 현재 서버 Network URL로 3명이 같은 방에 접속한다.
3. 게임 시작 후 초기 배치를 완료하고 play phase에 진입한다.
4. 현재 차례 플레이어가 주사위를 굴린 뒤 교환 버튼을 누른다.
5. 모달에서 4:1 교환을 실행하고 모든 브라우저의 자원 총량/은행 상태가 동기화되는지 확인한다.
6. 항구를 가진 플레이어가 가능하면 3:1 또는 2:1 교환을 실행한다.
7. 차례가 아닌 브라우저에서는 교환 버튼이 비활성화되는지 확인한다.
8. 재접속 대기 모달이 떠 있는 동안 교환이 불가능한지 확인한다.
9. 방 나가기 후 ended 상태에서 교환이 불가능한지 확인한다.
10. 상대 브라우저에서 교환한 플레이어의 자원 상세가 보이지 않고 resourceCount만 바뀌는지 확인한다.
```

## 통과 기준

```text
오프라인/온라인 모두 교환 버튼은 1개만 사용한다.
공용 모달에서 지불/수령 자원과 실제 적용 비율을 확인할 수 있다.
온라인 bankTrade는 서버에서만 자원과 은행 재고를 변경한다.
서버가 항구 보유를 matchState.harbors와 vertices 기준으로 계산한다.
자원 부족, 은행 재고 부족, 잘못된 차례, 주사위 전, ended/left/disconnected 상태는 거절된다.
상대에게 자원 상세가 노출되지 않는다.
오프라인 기존 은행/항구 교환 동작은 유지된다.
```
