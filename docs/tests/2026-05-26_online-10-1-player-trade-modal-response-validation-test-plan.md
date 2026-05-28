# 온라인 10-1 플레이어 교환 모달/응답 검증 테스트 계획

작성일: 2026-05-26

## 테스트 대상

온라인 플레이어 간 교환 모달의 10-1 UX 보강을 검증한다.

```text
요청자 모달 3구역 분리
응답자 수락 버튼 자원 보유 검증
흥정 보내기 버튼 자원 보유 검증
흥정 조건 반영 버튼 자원 보유 검증
상대 자원 상세 미노출 유지
기존 10단계 WebSocket 프로토콜 회귀 방지
오프라인 플레이어 교환 회귀 방지
```

## 관련 구현 계획서

```text
docs/plans/2026-05-26_online-10-1-player-trade-modal-response-validation-plan.md
docs/plans/2026-05-26_online-10-player-trade-plan.md
```

## 변경 파일 목록

```text
script.js
styles.css
docs/plans/2026-05-26_online-10-1-player-trade-modal-response-validation-plan.md
scripts/online-10-1-player-trade-ui-static-test.js
```

## 테스트 환경

```text
Windows PowerShell
Node.js
로컬 파일 정적 점검
기존 WebSocket 자동 테스트 서버
```

## 자동 테스트 항목

```text
node --check script.js
node --check server.js
node --check scripts/online-10-player-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
node --check scripts/online-10-1-player-trade-ui-static-test.js
node scripts/online-10-1-player-trade-ui-static-test.js
```

10-1 정적 UI 테스트:

```text
hasBundleResources helper가 추가되었는지 확인한다.
onlineViewerGamePlayer helper가 추가되어 응답자 본인 자원을 기준으로 계산하는지 확인한다.
요청자 모달에 내가 줄 자원/받을 자원/응답 구역 문구가 포함되는지 확인한다.
응답자 수락 버튼이 canAccept 조건으로 disabled 처리되는지 확인한다.
counterOffer 부족 시 흥정 보내기 버튼이 disabled 되는지 확인한다.
counterRequest 부족 시 흥정 조건 반영 버튼이 disabled 되는지 확인한다.
흥정 조건 반영이 showOnlinePlayerTradeComposer({ trade, counter }) 재요청 흐름을 사용하는지 확인한다.
styles.css에 3구역 레이아웃과 모바일 1열 규칙이 포함되는지 확인한다.
```

기존 10단계 WebSocket 회귀 테스트:

```text
openPlayerTrade 성공
respondPlayerTrade accept/counter 처리
counter choose 거절
updatePlayerTradeOffer 재요청
choosePlayerTradeResponse 자원 이동
cancelPlayerTrade pending 제거
상대 자원 상세 미노출
pending 중 다른 command 차단
```

## 수동 테스트 항목

온라인 3브라우저:

```text
1. 서버를 재시작하고 새 방을 만든다.
2. Chrome 일반 창, 시크릿 창, 다른 브라우저 또는 실제 기기로 3명이 접속한다.
3. 초기 배치 완료 후 play phase에 진입한다.
4. 현재 차례 플레이어가 주사위를 굴린 뒤 플레이어 교환을 연다.
5. 요청자 모달이 "내가 줄 자원 / 받을 자원 / 응답" 3구역으로 보이는지 확인한다.
6. 요청자 offer가 부족한 상태에서는 요청/재요청 버튼이 비활성화되고 "자원이 없습니다"가 보이는지 확인한다.
7. 응답자가 trade.request 자원을 충분히 가지면 수락 버튼이 활성화되는지 확인한다.
8. 응답자가 trade.request 자원이 부족하면 수락 버튼이 비활성화되고 "자원이 없습니다"가 보이는지 확인한다.
9. 자원 부족 응답자도 거절 버튼을 누를 수 있는지 확인한다.
10. 자원 부족 응답자도 흥정 모달을 열 수 있는지 확인한다.
11. counterOffer 자원이 부족하면 흥정 보내기 버튼이 비활성화되고 "자원이 없습니다"가 보이는지 확인한다.
12. 요청자가 counterRequest 자원이 부족하면 흥정 조건 반영 버튼이 비활성화되고 "자원이 없습니다"가 보이는지 확인한다.
13. 흥정 조건 반영은 즉시 확정이 아니라 조건 수정/재요청으로 이어지는지 확인한다.
14. 상대 자원 상세가 노출되지 않는지 확인한다.
15. 거래 확정/취소/재요청 흐름이 기존처럼 동작하는지 확인한다.
```

오프라인 회귀:

```text
1. 오프라인 게임을 시작한다.
2. play phase에서 주사위를 굴린다.
3. 기존 플레이어 교환 버튼을 눌러 로컬 교환 모달을 연다.
4. 상대, 제공 자원, 요청 자원을 선택한다.
5. 수락/거절/수정 흐름이 기존처럼 동작하는지 확인한다.
```

## 브라우저 검증 항목

```text
모달 텍스트와 버튼이 부모 영역 밖으로 넘치지 않는다.
데스크톱에서 3구역이 한눈에 구분된다.
모바일 폭에서 1열로 안정적으로 쌓인다.
응답 row의 이름, 상태, 버튼이 겹치지 않는다.
자원 수량 조절 버튼 크기가 흔들리지 않는다.
```

## 규칙 검증 항목

```text
서버 최종 자원 검증은 그대로 유지된다.
새 서버 command가 추가되지 않는다.
counter 응답은 즉시 확정되지 않는다.
counter 응답은 updatePlayerTradeOffer 재요청 흐름으로만 반영된다.
```

## 실패 시 확인할 로그 또는 상태

```text
브라우저 콘솔 오류
onlineSession.state.pendingPlayerTrade
game.viewerSeatIndex
current viewer의 game.players[viewerSeatIndex].resources
WebSocket error code/message
scripts/online-10-player-trade-ws-test.js 결과
```

## 완료 기준

```text
정적 점검과 자동 테스트가 통과한다.
기존 10단계 WebSocket 테스트가 통과한다.
오프라인 player trade 함수 경로가 변경되지 않았음을 확인한다.
수동 테스트가 필요한 항목은 최종 보고서에 수행 여부와 남은 위험으로 기록한다.
```
