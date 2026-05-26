# 온라인 10-1 플레이어 교환 모달/응답 검증 보강 계획

작성일: 2026-05-26

## 작업 목적

10단계에서 구현된 온라인 플레이어 간 교환 UI를 실제 플레이 흐름에 맞게 보강한다.

핵심 목표는 거래 요청자 모달을 더 명확한 3구역 구조로 나누고, 응답자 또는 흥정 수락자가 실제로 필요한 자원을 보유한 경우에만 응답/수락 버튼을 활성화하는 것이다. 자원이 부족한 경우에는 버튼을 막고, 사용자에게 "자원이 없습니다" 안내를 모달 안에서 명확히 표시한다.

## 2026-05-26 구현 전 갱신

현재 코드 확인 결과 10-1은 서버 프로토콜 변경 없이 클라이언트 모달 UX와 사전 검증만으로 구현한다.

```text
server.js는 수정하지 않는다.
새 WebSocket command를 추가하지 않는다.
counter 응답은 즉시 확정하지 않는다.
흥정 조건 반영은 기존 showOnlinePlayerTradeComposer({ trade, counter })와 updatePlayerTradeOffer 재요청 흐름을 사용한다.
응답자/요청자 자원 보유 검증은 viewer 본인의 private resources만 기준으로 계산한다.
```

이 작업에서 수정할 파일은 아래로 확정한다.

```text
script.js
styles.css
docs/test_plans/2026-05-26_online-10-1-player-trade-modal-response-validation-test-plan.md
docs/final_reports/2026-05-26_online-10-1-player-trade-modal-response-validation-final-report.md
```

## 관련 문서

```text
catan_implementation_process_guideline.md
docs/implementation_plans/2026-05-26_online-00-mvp-roadmap.md
docs/implementation_plans/2026-05-26_online-10-player-trade-plan.md
docs/final_reports/2026-05-26_online-10-player-trade-final-report.md
```

## 현재 구현 상태

```text
온라인 플레이어 교환은 room.pendingPlayerTrade 기반으로 동작한다.
요청자는 offer/request를 입력하고 나머지 유저의 응답을 볼 수 있다.
응답자는 수락/거절/흥정으로 응답할 수 있다.
흥정은 counterOffer/counterRequest로 서버에 전달된다.
최종 선택 시 서버가 양쪽 자원을 재검증한다.
pending trade 중 다른 진행 command는 차단된다.
```

## 문제점

```text
요청자 모달에서 "내가 줄 자원", "받을 자원", "응답 목록"의 시각적 구역이 충분히 분리되어 있지 않다.
응답자 화면에서 요청 조건을 수락할 자원이 없는 경우에도 수락 버튼이 눌릴 수 있어, 서버 오류 응답을 받은 뒤에야 실패를 알게 된다.
흥정 요청을 받은 요청자도 상대 흥정 조건을 수락할 자원이 부족한 경우를 UI에서 먼저 알기 어렵다.
자원 부족 상태가 버튼 비활성화 이유로 명확히 표시되지 않는다.
서버 최종 검증은 필요하지만, UI에서도 가능한 실패를 미리 안내해야 플레이 감각이 자연스럽다.
```

## 구현 범위

### 1. 요청자 모달 3구역 분리

요청자 모달을 아래 3구역으로 명확히 나눈다.

```text
1. 내가 줄 자원
2. 받을 자원
3. 응답
```

구역별 역할:

```text
내가 줄 자원:
- 요청자가 제공할 자원 종류와 개수를 조절한다.
- 본인 보유량을 넘는 + 조작은 비활성화한다.
- 총 제공량이 0이면 요청/재요청 버튼을 비활성화한다.

받을 자원:
- 요청자가 받고 싶은 자원 종류와 개수를 조절한다.
- 상대 보유 상세는 알 수 없으므로 보유량 기반 제한은 하지 않는다.
- 총 요청량이 0이면 요청/재요청 버튼을 비활성화한다.

응답:
- 나머지 유저들의 응답 상태를 표시한다.
- 수락/거절/흥정 상태를 구분한다.
- 수락한 유저 선택 버튼은 모든 응답자가 응답한 뒤에만 활성화한다.
- 흥정 응답이 있으면 흥정 조건과 수락 가능 여부를 표시한다.
```

### 2. 응답자 수락 버튼 자원 검증

나머지 유저는 현재 요청을 수락하려면 `pendingPlayerTrade.request`에 해당하는 자원을 제공해야 한다.

정책:

```text
응답자가 요청된 자원을 충분히 보유하면 수락 버튼을 활성화한다.
응답자가 요청된 자원을 충분히 보유하지 않으면 수락 버튼을 비활성화한다.
수락 버튼 주변 또는 요청 요약 하단에 "자원이 없습니다" 안내를 표시한다.
거절 버튼은 자원 부족과 관계없이 활성화한다.
흥정 버튼은 자원 부족과 관계없이 열 수 있다.
흥정 보내기 버튼은 counterOffer에 필요한 자원을 본인이 충분히 보유할 때만 활성화한다.
```

예:

```text
요청자 조건: 요청자가 나무 1개를 주고, 양 2개를 받고 싶음
응답자 보유 양: 1개
결과: 수락 버튼 비활성화, "자원이 없습니다" 표시
```

### 3. 흥정 받은 요청자의 흥정 수락 버튼 자원 검증

흥정 응답은 응답자 기준으로 작성된다.

```text
counterOffer: 응답자가 줄 자원
counterRequest: 응답자가 받을 자원
```

요청자가 흥정을 수락하려면 요청자는 `counterRequest`에 해당하는 자원을 상대에게 줄 수 있어야 한다.

정책:

```text
요청자가 counterRequest 자원을 충분히 보유하면 해당 흥정 수락 버튼을 활성화한다.
요청자가 counterRequest 자원을 충분히 보유하지 않으면 해당 흥정 수락 버튼을 비활성화한다.
비활성 상태에는 "자원이 없습니다" 안내를 표시한다.
흥정 수락은 기존 choosePlayerTradeResponse가 아니라 별도 command가 필요한지 검토한다.
10-1 최소 구현에서는 안전하게 updatePlayerTradeOffer로 조건을 반영해 재요청하는 경로를 우선한다.
```

주의:

```text
10단계 기존 정책은 counter 응답을 직접 choose할 수 없고, 요청자가 조건을 수정해 재요청하는 방식이다.
10-1에서 "흥정 수락" 버튼을 실제 즉시 거래 확정으로 바꿀 경우 서버 command가 추가로 필요하다.
따라서 10-1 계획의 기본안은 "흥정 수락" 클릭 시 counterOffer/counterRequest를 요청자 관점 offer/request로 변환해 재요청하는 것이다.
즉시 확정형 흥정 수락은 후속 확장으로 분리할 수 있다.
```

### 4. 자원 부족 안내

모달 안에 아래 안내를 표시한다.

```text
자원이 없습니다
```

표시 위치:

```text
응답자:
- 수락 버튼 근처
- 요청 요약 하단

요청자:
- 흥정 응답 카드의 흥정 수락 버튼 근처
- 내가 줄 자원 구역 하단
```

표시 조건:

```text
요청/재요청 offer 자원이 본인 보유량보다 많음
응답자 accept에 필요한 request 자원이 부족함
응답자 counterOffer 자원이 본인 보유량보다 많음
요청자가 counterRequest 자원이 부족해 흥정 조건을 받아들일 수 없음
```

## 구현하지 않을 범위

```text
서버 권위 최종 자원 검증 제거
상대 전체 자원 상세 공개
동시 다중 거래
거래 채팅
거래 타이머
오프라인 플레이어 교환 UX 전면 개편
개발 카드/강도/7 처리와 거래 UI 통합
```

서버 검증은 그대로 유지한다. UI 버튼 비활성화는 사용자 편의와 사전 안내를 위한 것이며, 보안 또는 정합성의 최종 기준은 서버다.

## 수정 대상 파일

예상 수정 파일:

```text
script.js
styles.css
docs/test_plans/2026-05-26_online-10-1-player-trade-modal-response-validation-test-plan.md
docs/final_reports/2026-05-26_online-10-1-player-trade-modal-response-validation-final-report.md
```

필요 시 수정 파일:

```text
server.js
scripts/online-10-1-player-trade-response-validation-ws-test.js
```

`server.js` 수정 여부는 흥정 수락을 어떤 방식으로 처리할지에 따라 결정한다.

```text
재요청 방식만 사용: 기존 updatePlayerTradeOffer command 재사용 가능
즉시 확정 방식 사용: acceptCounterPlayerTrade 또는 choose counter 처리용 서버 command 필요
```

## 수정 대상 함수 또는 UI 영역

예상 대상:

```text
script.js
- showOnlinePlayerTradeComposer()
- showRequesterPendingTradeModal()
- showResponderPendingTradeModal()
- showCounterTradeModal()
- createResourceBundleEditor()
- buildTradeResourceSummary()
- resourceBundleText()
- resourceBundleTotal()
- player trade 관련 버튼 활성화 조건
- onlineErrorMessage 또는 모달 안내 표시 영역

styles.css
- player trade 모달 3구역 레이아웃
- 자원 부족 안내 문구
- 비활성 응답 버튼 상태
- 모바일 1열 레이아웃
```

현재 코드 확인 결과, 온라인 플레이어 교환 UI는 `showOnlinePlayerTradeComposer()`, `showRequesterPendingTradeModal()`, `showResponderPendingTradeModal()`, `showCounterTradeModal()`에서 처리한다. 10-1 구현은 이 네 함수와 공용 자원 편집 helper를 중심으로 진행한다.

## 구체화된 구현 결정

### 1. 서버 command 추가 여부

10-1에서는 새 서버 command를 추가하지 않는다.

```text
기존 10단계 정책:
- accept 응답만 choosePlayerTradeResponse로 최종 선택 가능
- counter 응답은 즉시 확정 대상이 아님
- requester가 counter 조건을 보고 updatePlayerTradeOffer로 재요청
```

따라서 10-1의 "흥정 수락"은 실제 즉시 거래 확정이 아니라 아래 동작으로 정의한다.

```text
흥정 조건 반영 버튼:
1. 응답자의 counterOffer/counterRequest를 읽는다.
2. requester 관점 offer = counterRequest로 변환한다.
3. requester 관점 request = counterOffer로 변환한다.
4. showOnlinePlayerTradeComposer({ trade, counter })로 조건 수정 모달을 연다.
5. requester가 재요청을 누르면 updatePlayerTradeOffer가 전송된다.
6. round가 증가하고 모든 응답자가 새 조건에 다시 응답한다.
```

버튼 문구는 혼동을 줄이기 위해 "흥정 수락"보다 "흥정 조건 반영"을 우선 사용한다. 사용자가 "수락"이라는 표현을 기대할 수 있으므로, UI 설명에는 "흥정 조건을 반영해 다시 요청합니다"를 표시한다.

### 2. 자원 보유 검증 helper

`script.js`에 아래 성격의 helper를 추가한다.

```text
hasBundleResources(player, bundle)
- player.resources가 bundle의 모든 자원을 충족하면 true
- viewer 본인 player에만 사용한다
- 상대 player의 상세 resources를 추론하거나 참조하지 않는다

resourceBundleShortfall(player, bundle)
- 부족한 자원 목록을 반환한다
- UI 기본 문구는 "자원이 없습니다"로 고정한다
- 필요하면 title/보조 텍스트에 부족 목록을 표시한다

canSubmitTradeBundle(player, bundle)
- resourceBundleTotal(bundle) > 0
- hasBundleResources(player, bundle)
```

주의:

```text
요청자가 받을 자원 request는 상대 상세 자원을 알 수 없으므로 요청자 UI에서 보유량 검증을 하지 않는다.
응답자 accept는 응답자 본인이 trade.request를 줄 수 있는지만 검증한다.
응답자 counterOffer는 응답자 본인이 counterOffer를 줄 수 있는지만 검증한다.
요청자 counter 반영은 요청자 본인이 counterRequest를 줄 수 있는지만 검증한다.
```

### 3. 요청자 신규/수정 모달 세부 구조

`showOnlinePlayerTradeComposer()`는 아래 구조로 변경한다.

```text
player-trade-composer
- player-trade-zone player-trade-zone-offer
  - 제목: 내가 줄 자원
  - createResourceBundleEditor(..., { owner: currentPlayer(), maxByOwner: true })
  - 보유량 초과 또는 총량 0 안내
- player-trade-zone player-trade-zone-request
  - 제목: 받을 자원
  - createResourceBundleEditor(..., { maxByOwner: false })
  - 총량 0 안내
- player-trade-zone player-trade-zone-summary
  - 제목: 요약
  - 내가 줌 / 내가 받음
  - 요청 또는 재요청 버튼 활성 조건 표시
```

요청/재요청 버튼 활성 조건:

```text
offer 총량 > 0
request 총량 > 0
currentPlayer가 offer 자원을 충분히 보유
온라인 play phase
방이 ended/reconnect-waiting 상태가 아님
```

버튼 비활성 안내:

```text
offer 총량 0: 줄 자원을 선택하세요
request 총량 0: 받을 자원을 선택하세요
offer 자원 부족: 자원이 없습니다
```

### 4. 요청자 pending 모달 3구역 구조

`showRequesterPendingTradeModal()`는 요청 진행 중 화면도 3구역으로 맞춘다.

```text
player-trade-requester-grid
- 내가 줄 자원
  - 현재 trade.offer 요약
  - 조건 수정 버튼
- 받을 자원
  - 현재 trade.request 요약
  - 재요청 안내
- 응답
  - responder별 응답 상태
  - accept 응답의 선택 버튼
  - counter 응답의 흥정 조건 반영 버튼
```

accept 선택 버튼 활성 조건:

```text
모든 responder가 응답함
response.type === "accept"
현재 pending trade round와 일치
```

counter 응답의 흥정 조건 반영 버튼 활성 조건:

```text
requester가 response.counterRequest 자원을 충분히 보유
```

counter 응답의 흥정 조건 반영 버튼 비활성 안내:

```text
자원이 없습니다
```

### 5. 응답자 모달 수락 버튼 조건

`showResponderPendingTradeModal()`에서 수락 버튼을 직접 DOM으로 만들고, 아래 조건을 적용한다.

```text
accept 가능:
- currentPlayer가 trade.request 자원을 충분히 보유
- 아직 같은 round 응답이 없거나, 응답 변경을 허용하는 정책이면 최신 응답으로 덮어쓰기 가능
```

10-1 기본 정책:

```text
응답 완료 후에는 수락/거절/흥정 버튼을 비활성화한다.
서버는 같은 round 재응답을 허용하더라도 UI는 중복 응답을 줄인다.
재요청으로 round가 증가하면 다시 응답 가능 상태가 된다.
```

응답자 버튼 정책:

```text
수락:
- trade.request 자원이 충분할 때만 활성화
- 부족하면 비활성화하고 "자원이 없습니다" 표시

거절:
- 자원 부족과 관계없이 활성화
- 이미 응답했다면 비활성화

흥정:
- 자원 부족과 관계없이 열 수 있음
- 이미 응답했다면 비활성화
```

### 6. 흥정 모달 조건

`showCounterTradeModal()`은 `counterOffer` 검증을 강화한다.

```text
흥정 보내기 버튼 활성 조건:
- counterOffer 총량 > 0
- counterRequest 총량 > 0
- currentPlayer가 counterOffer 자원을 충분히 보유
```

비활성 안내:

```text
counterOffer 총량 0: 줄 자원을 선택하세요
counterRequest 총량 0: 받을 자원을 선택하세요
counterOffer 자원 부족: 자원이 없습니다
```

### 7. CSS 구체화

`styles.css`에는 아래 클래스를 추가하거나 기존 클래스를 확장한다.

```text
.player-trade-composer
.player-trade-requester-grid
.player-trade-zone
.player-trade-zone-title
.trade-warning
.trade-warning.is-visible
.trade-response-row
.trade-response-actions
.trade-response-counter
```

레이아웃:

```text
데스크톱:
- 요청/수정 모달: 내가 줄 자원, 받을 자원, 요약을 3열 또는 2+1 그리드로 배치
- pending 요청자 모달: 내가 줄 자원, 받을 자원, 응답을 3열로 배치

모바일:
- 모든 구역을 1열로 쌓는다
- 응답 row의 버튼은 줄바꿈되어도 겹치지 않게 한다
- 자원 row는 기존 trade-resource-row의 고정 버튼 크기를 유지한다
```

### 8. 문구 정책

사용자-facing 문구는 아래로 통일한다.

```text
내가 줄 자원
받을 자원
응답
자원이 없습니다
줄 자원을 선택하세요
받을 자원을 선택하세요
흥정 조건 반영
흥정 조건을 반영해 다시 요청합니다
```

문서와 UI에서 "흥정 수락"이라는 표현은 직접 확정으로 오해될 수 있으므로, 즉시 확정 기능을 구현하지 않는 한 "흥정 조건 반영"으로 표기한다.

## 데이터 구조 변경 여부

기본안에서는 서버 데이터 구조 변경이 필요하지 않다.

사용하는 기존 데이터:

```text
pendingPlayerTrade.offer
pendingPlayerTrade.request
pendingPlayerTrade.responses
response.counterOffer
response.counterRequest
game.players[viewerSeatIndex].resources
```

추가 클라이언트 계산 값:

```text
canAcceptCurrentOffer
acceptBlockedReason
canSendCounterOffer
counterBlockedReason
canAcceptCounterOffer
counterAcceptBlockedReason
```

이 값들은 서버 state에 저장하지 않고 렌더링 시 계산한다.

## UI 변경 여부

UI 변경 있음.

요청자 모달:

```text
데스크톱: 3구역을 명확히 분리한다.
권장 레이아웃: 내가 줄 자원 / 받을 자원 / 응답
모바일: 세 구역을 위에서 아래로 쌓는다.
```

응답자 모달:

```text
요청 요약을 유지한다.
수락 가능 여부를 자원 보유량 기준으로 즉시 표시한다.
수락 불가 시 "자원이 없습니다"를 표시한다.
거절/흥정은 계속 가능하게 둔다.
```

흥정 카드:

```text
요청자에게 흥정 조건을 카드로 보여준다.
요청자가 해당 흥정 조건을 반영할 자원이 부족하면 수락/반영 버튼을 비활성화한다.
부족 사유는 "자원이 없습니다"로 표시한다.
```

## 예상 영향 범위

```text
온라인 플레이어 교환 UX
pendingPlayerTrade 모달 표시
응답 버튼 활성/비활성 조건
흥정 재요청 흐름
자원 부족 안내
모바일 모달 레이아웃
오프라인 플레이어 교환 회귀 위험
```

## 단계별 구현 순서

```text
1. 현재 player trade 모달 렌더링 함수와 CSS 구조를 확인한다.
2. 자원 보유 여부 계산 helper를 추가한다.
3. 요청자 모달을 "내가 줄 자원 / 받을 자원 / 응답" 3구역으로 분리한다.
4. 요청자 offer가 보유량을 초과하면 요청/재요청 버튼을 비활성화하고 "자원이 없습니다"를 표시한다.
5. 응답자 accept 가능 여부를 pendingPlayerTrade.request 기준으로 계산한다.
6. 응답자 수락 버튼을 자원 보유 여부에 따라 활성/비활성 처리한다.
7. 응답자 counterOffer 가능 여부를 본인 보유량 기준으로 검증한다.
8. 요청자의 흥정 응답 카드에서 counterRequest 보유 여부를 계산한다.
9. 흥정 수락/반영 버튼을 보유 여부에 따라 활성/비활성 처리한다.
10. 흥정 수락은 우선 updatePlayerTradeOffer 재요청 방식으로 연결한다.
11. 서버 즉시 확정이 필요한 흐름이 발견되면 계획서를 갱신하고 server.js 변경 범위를 추가한다.
12. 모바일/데스크톱 레이아웃을 점검한다.
13. 테스트 계획서를 작성한다.
14. 정적 점검과 가능한 WebSocket/UI 자동 테스트를 수행한다.
15. 최종 보고서를 작성한다.
```

## 검증 방법 초안

정적 점검:

```text
node --check script.js
node --check server.js
```

자동 테스트 후보:

```text
응답자가 request 자원을 충분히 가진 경우 수락 가능 view가 표시된다.
응답자가 request 자원이 부족한 경우 수락 불가 view가 표시된다.
counterOffer 자원이 부족한 경우 흥정 보내기 버튼이 비활성화된다.
요청자가 counterRequest 자원이 부족한 경우 흥정 반영 버튼이 비활성화된다.
자원 부족 상태에서도 거절 버튼은 활성화된다.
```

수동 테스트 후보:

```text
온라인 3브라우저 방 생성
초기 배치 완료
주사위 굴림
요청자가 플레이어 교환 모달 열기
요청자 모달이 3구역으로 분리되어 보이는지 확인
응답자 A는 요청 자원 충분 -> 수락 버튼 활성 확인
응답자 B는 요청 자원 부족 -> 수락 버튼 비활성 및 "자원이 없습니다" 확인
응답자 B가 거절은 가능한지 확인
응답자 B가 보유 자원 범위 안에서 흥정 가능한지 확인
요청자가 흥정 응답을 받았을 때 필요한 자원 부족 시 흥정 반영 버튼이 비활성화되는지 확인
오프라인 플레이어 교환 기존 동작 확인
```

## 위험 요소

```text
클라이언트 자원 view는 viewer별 private state이므로, 상대 자원 상세를 기준으로 버튼을 판단하면 안 된다.
응답자 수락 가능 여부는 응답자 본인 브라우저에서만 본인 resources로 계산해야 한다.
요청자의 흥정 반영 가능 여부도 요청자 본인 resources로만 계산해야 한다.
UI에서 버튼을 비활성화해도 서버 최종 검증은 반드시 유지해야 한다.
흥정 수락을 즉시 거래 확정으로 구현하면 기존 10단계 command 정책과 충돌할 수 있다.
모달 레이아웃 변경으로 모바일에서 버튼이나 자원 수량 컨트롤이 잘릴 수 있다.
오프라인 player trade 경로와 온라인 player trade 경로가 섞이면 회귀가 생길 수 있다.
```

## 롤백 또는 복구 방법

```text
script.js의 player trade 모달 렌더링 변경을 이전 구조로 되돌린다.
styles.css의 10-1 전용 player trade 레이아웃 클래스를 제거하거나 비활성화한다.
server.js를 수정했다면 10단계 command 정책으로 되돌린다.
문제가 UI에 한정되면 서버 pendingPlayerTrade 구조는 유지한다.
```

## 완료 기준

```text
요청자 모달이 "내가 줄 자원 / 받을 자원 / 응답" 3구역으로 명확히 분리된다.
응답자는 요청에 필요한 자원이 있을 때만 수락 버튼이 활성화된다.
응답자에게 요청 자원이 부족하면 "자원이 없습니다"가 모달에 표시된다.
흥정 보내기는 응답자가 실제로 줄 수 있는 자원이 있을 때만 활성화된다.
요청자가 흥정 조건을 반영하려 할 때 필요한 자원이 부족하면 해당 버튼이 비활성화된다.
흥정 조건 반영 불가 사유로 "자원이 없습니다"가 표시된다.
서버 최종 자원 검증은 유지된다.
상대 자원 상세는 노출되지 않는다.
오프라인 플레이어 교환은 기존처럼 유지된다.
테스트 계획서와 최종 보고서가 작성된다.
```
