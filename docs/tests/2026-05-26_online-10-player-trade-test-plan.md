# 온라인 모드 10단계 플레이어 간 교환 테스트 계획

작성일: 2026-05-26

## 목적

온라인 `play` phase에서 플레이어 간 교환이 서버 `room.pendingPlayerTrade` 기반으로 요청, 응답, 흥정, 재요청, 취소, 최종 확정되는지 검증한다. 진행 중에는 다른 진행 command가 차단되고, 요청자/응답자/제3자 view가 분리되어 자원 상세 노출이 제한되어야 한다.

## 변경 파일

```text
server.js
script.js
styles.css
scripts/online-10-player-trade-ws-test.js
docs/plans/2026-05-26_online-10-player-trade-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
node --check scripts/online-10-player-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

WebSocket 테스트 범위:

```text
1. 3인 온라인 방을 만들고 초기 배치 완료 후 play phase fixture를 구성한다.
2. 현재 차례 플레이어가 openPlayerTrade에 성공하는지 확인한다.
3. 요청자/응답자 view가 role별로 다르게 전달되는지 확인한다.
4. 응답자에게 요청자용 responses 상세가 노출되지 않는지 확인한다.
5. pending trade 중 bankTrade/endTurn/openPlayerTrade가 거절되는지 확인한다.
6. 응답자의 accept/reject/counter 응답을 처리한다.
7. counter 응답은 choose 대상으로 선택할 수 없는지 확인한다.
8. 모든 응답 후 accept 응답자를 choose하면 양쪽 자원이 이동하고 pending이 제거되는지 확인한다.
9. 상대 viewer에 자원 상세가 노출되지 않는지 확인한다.
10. 요청자의 respond 시도와 응답자의 update 시도가 거절되는지 확인한다.
11. updatePlayerTradeOffer 성공 시 round가 증가하고 이전 round 응답이 거절되는지 확인한다.
12. cancelPlayerTrade 성공 시 pending이 제거되는지 확인한다.
13. choose 시점에 자원 상태가 바뀌면 거래가 invalidated로 취소되는지 확인한다.
```

## 온라인 3브라우저 수동 테스트

```text
1. Chrome 일반 창, 시크릿 창, 다른 브라우저 또는 실제 기기 1대를 준비한다.
2. http://100.88.125.81:4173/ 또는 현재 서버 Network URL로 3명이 같은 방에 접속한다.
3. 게임 시작 후 초기 배치를 완료하고 play phase에 진입한다.
4. 현재 차례 플레이어가 주사위를 굴린 뒤 플레이어 교환 버튼을 누른다.
5. 요청자 모달에서 내가 지불할 자원/받을 자원 종류와 개수를 조절하고 요청한다.
6. 모든 참가자에게 거래 모달이 표시되는지 확인한다.
7. 요청자 모달 우측에 응답 상태가 표시되는지 확인한다.
8. 응답자 모달에서 수락, 거절, 흥정이 각각 동작하는지 확인한다.
9. 요청자가 수락한 유저를 선택해야만 거래 확정이 가능한지 확인한다.
10. 모든 응답 전에는 거래 확정이 불가능한지 확인한다.
11. 흥정 조건을 바탕으로 요청자가 조건 수정 후 재요청할 수 있는지 확인한다.
12. 거래 취소 시 모든 유저에게 취소 알림 모달이 표시되는지 확인한다.
13. 거래 완료 시 모든 유저에게 완료 알림 모달이 표시되고 자원 총량이 동기화되는지 확인한다.
14. pending trade 중 턴 종료, 건설, 은행/항구 교환, 추가 플레이어 교환이 차단되는지 확인한다.
15. 새로고침/재접속 후 pending trade UI가 복구되는지 확인한다.
16. 상대 자원 상세가 노출되지 않는지 확인한다.
17. 방 종료 상태에서 player trade command가 차단되는지 확인한다.
```

## 오프라인 회귀 테스트

```text
1. 오프라인 게임을 시작한다.
2. play phase에서 현재 플레이어가 주사위를 굴린다.
3. 기존 플레이어 교환 버튼을 눌러 로컬 플레이어 교환 모달을 연다.
4. 상대, 제공 자원, 요청 자원을 선택한다.
5. 수락 시 기존 로컬 자원 이동과 로그가 정상 동작하는지 확인한다.
6. 자원 부족, 교환 불가 타이밍, 취소/거절 흐름이 기존처럼 유지되는지 확인한다.
```

## 통과 기준

```text
온라인 플레이어 교환은 서버 pending state로만 관리된다.
현재 차례 + rolled=true 플레이어만 openPlayerTrade를 할 수 있다.
모든 응답자가 응답하기 전에는 choose가 거절된다.
최종 선택 시점에 양쪽 자원을 재검증한다.
거래 완료/취소/무효화 시 pending이 제거되고 모든 클라이언트에 state가 broadcast된다.
pending trade 중 다른 진행 command는 차단된다.
요청자/응답자/제3자 view는 필요한 정보만 제공한다.
오프라인 플레이어 교환은 기존 로컬 동작을 유지한다.
```
