# 온라인 모드 9단계 은행/항구 교환 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/guides/development-process-guideline.md
docs/plans/2026-05-26_online-09-bank-harbor-trade-plan.md
docs/tests/2026-05-26_online-09-bank-harbor-trade-test-plan.md
```

## 구현 요약

```text
오프라인/온라인 공용 교환 버튼을 "교환" 1개로 정리했다.
기존 인라인 은행 교환 드롭다운 UI를 제거하고 공용 은행/항구 교환 모달을 추가했다.
모달 상단에는 현재 플레이어가 보유한 항구 기준 교환 규칙을 표시한다.
모달 좌측에는 지불할 자원, 우측에는 받을 자원 선택 영역을 배치했다.
하단에는 실제 적용 비율과 교환 요약을 표시한다.
오프라인은 같은 모달에서 기존 로컬 은행/항구 교환 로직으로 자원과 은행 재고를 갱신한다.
온라인은 같은 모달에서 bankTrade command를 전송하고 서버 state broadcast로만 갱신한다.
```

## 서버 반영 내용

```text
server.js에 bankTrade command를 추가했다.
validatePlayCommand 기반으로 playing/play phase, 인증, active player, winner 없음 조건을 검증한다.
game.rolled=false이면 ROLL_REQUIRED로 거절한다.
pending action, ended, left, disconnected, connected=false 대기 상태를 거절한다.
give/get resource id, 같은 자원 선택, 자원 부족, 은행 재고 부족을 검증한다.
matchState.harbors와 vertices 소유자를 기준으로 보유 항구를 계산한다.
특정 자원 항구 2:1, 일반 항구 3:1, 기본 4:1 비율을 서버에서 직접 적용한다.
성공 시 player.resources, game.bank, room.revision을 갱신하고 viewer별 matchState를 broadcast한다.
viewer 본인에게만 trade.ownedHarbors/trade.ratios와 resources 상세를 포함한다.
상대에게는 resourceCount만 노출한다.
```

## 변경 파일

```text
server.js
script.js
index.html
styles.css
scripts/online-09-bank-trade-ws-test.js
docs/plans/2026-05-26_online-09-bank-harbor-trade-plan.md
docs/tests/2026-05-26_online-09-bank-harbor-trade-test-plan.md
docs/reports/2026-05-26_online-09-bank-harbor-trade-final-report.md
```

## 테스트 결과

```text
PASS node --check server.js
PASS node --check script.js
PASS node --check scripts/online-09-bank-trade-ws-test.js
PASS node scripts/online-09-bank-trade-ws-test.js
```

WebSocket 자동 테스트 주요 결과:

```text
ok - trade before roll: ROLL_REQUIRED
ok - wrong turn trade: NOT_YOUR_TURN
ok - same resource trade: SAME_RESOURCE
ok - invalid resource trade: INVALID_RESOURCE
ok - bankTrade success and private view preserved
ok - connected=false blocks trade: ROOM_NOT_READY
ok - bank resource empty blocks trade: BANK_RESOURCE_EMPTY
ok - ended room blocks trade: ROOM_ENDED
online-09 bank trade websocket tests passed
```

추가 검증:

```text
PASS BANK_RESOURCE_EMPTY 자동 테스트 추가 및 실행
PASS 오프라인 공용 교환 모달 수동 검증
```

## 확인한 항목

```text
온라인 bankTrade command 성공 경로
주사위 전 교환 거절
차례가 아닌 플레이어 교환 거절
같은 자원 교환 거절
잘못된 resource id 거절
은행 재고 0 상태 교환 거절
재접속 대기 connected=false 상태 교환 거절
ended 방 교환 거절
성공 후 본인 자원 상세 갱신
성공 후 상대 자원 상세 미노출
오프라인 모드에서 같은 교환 버튼/모달로 교환 동작
```

## 수행하지 못한 항목

```text
실제 Chrome 3개 또는 실제 기기 3개 수동 테스트는 수행하지 못했다.
항구 3:1/2:1은 서버 계산 로직과 viewer trade.ratios에 반영했지만, 자동 테스트 fixture는 특정 항구 위치를 안정적으로 강제하지 않아 전용 성공 케이스를 수행하지 못했다.
모바일 Chrome/Safari 표시 검증은 수행하지 못했다.
```

참고:

```text
오프라인 모달 교환은 사용자가 직접 수동 검증했다.
BANK_RESOURCE_EMPTY 거절 케이스는 test 전용 fixture command로 은행 재고를 0으로 만든 뒤 자동 검증했다.
```

## 남은 위험

```text
항구 2:1/3:1의 실제 UI 표시와 서버 적용이 특정 보드 상황에서 수동 확인되어야 한다.
플레이어 간 교환은 10단계 범위로 유지했으며, 온라인 play phase에서는 아직 비활성화된다.
```

## 최종 판단

부분 완료.

온라인 서버 command와 공용 모달 구현, 문법 검사, WebSocket 자동 테스트, 은행 재고 0 거절 테스트, 오프라인 모달 수동 검증은 완료했다.

다만 항구 3:1/2:1 전용 성공 케이스와 온라인 3브라우저/실기기 수동 테스트는 아직 남아 있으므로, 9단계는 핵심 구현 완료에 가깝지만 최종 안정화 전 보강 검증이 필요하다.
