# 봇 07 거래 응답 계획

작성일: 2026-05-26

## 목적

사람 플레이어가 봇에게 플레이어 거래를 제안했을 때 봇이 자동으로 수락 또는 거절하게 한다. 이 단계의 핵심은 거래 pending이 봇 때문에 방치되지 않게 하는 것이다.

## 2차 꼼꼼 피드백 요약

```text
1. 현재 서버 거래는 accept 즉시 체결이 아니라 응답 기록 후 requester가 최종 선택하는 구조다.
2. 봇은 이 단계에서 counter를 절대 보내지 않고 accept/reject만 보낸다.
3. 응답 command에는 tradeId와 round를 반드시 포함해 오래된 거래/수정 전 거래에 응답하지 않아야 한다.
4. requester가 offer를 주고 target이 request를 주는 구조이므로, 봇 responder 기준에서는 botGives = trade.request, botReceives = trade.offer다.
5. trade.update로 round가 바뀌면 기존 봇 평가와 timer는 폐기해야 한다.
6. 봇이 accept했더라도 체결 시점에 자원이 바뀌면 서버가 invalidated 처리할 수 있으므로, accept는 "체결 보장"이 아니다.
7. 여러 responder가 있는 거래에서 봇 응답은 전체 pending 종료가 아니라 자신의 response 기록까지만 책임진다.
```

## 범위

포함:

```text
봇 대상 거래 제안 감지
거래 수락/거절 평가
자동 accept/reject 실행
거래 pending 방치 방지
비공개 정보 미사용 원칙 적용
거래에서 requester/receiver 관점의 give/receive 의미 명확화
```

제외:

```text
봇이 먼저 플레이어 거래를 제안하는 기능
고급 교역 협상
상대 개발 카드 추론
상대 손패 정밀 추정
```

## 수락 기준

```text
봇의 다음 목표에 필요한 자원을 받는다.
내주는 자원이 현재 목표에 덜 중요하다.
거래 후 즉시 유의미한 행동이 가능하다.
상대가 1등이 아니거나, 상대에게 과도한 이득이 아니다.
```

기본 정책은 보수적으로 둔다.

```text
확실히 봇에게 이득인 거래만 수락한다.
판단이 애매하면 거절한다.
거절은 게임 진행을 막지 않는 안전한 fallback이다.
```

거래 평가는 절대값 하나가 아니라 최소 세 값으로 나눈다.

```text
botGainScore: 봇 목표에 얼마나 가까워지는가
opponentRiskScore: 상대가 얼마나 즉시 강해지는가
fairnessScore: 교환 비율이 지나치게 불리하지 않은가
```

## 거절 기준

```text
봇의 다음 목표에서 멀어진다.
상대가 즉시 승점 행동을 할 가능성이 크다.
1등 플레이어에게 과도하게 유리하다.
봇이 희소하게 필요한 자원을 내줘야 한다.
제안 payload가 비정상이거나 자원 수량이 맞지 않는다.
거래 방향을 해석할 수 없다.
봇이 내줘야 하는 자원이 부족하다.
거래 round가 평가 당시와 다르다.
이미 봇이 응답했다.
```

## 거래 방향 계약

거래 평가 전, 서버의 기존 trade 모델 기준으로 봇 관점의 교환 묶음을 명확히 계산한다.

```text
botGives: 거래가 성사되면 봇이 잃는 자원
botReceives: 거래가 성사되면 봇이 얻는 자원
requesterGives/requesterReceives 원본 필드는 직접 판단에 사용하지 않고, botGives/botReceives로 정규화한 뒤 평가한다.
```

현재 서버의 player trade 모델 기준:

```text
trade.offer: requester가 내놓는 자원
trade.request: responder가 내놓아야 하는 자원
```

이 단계에서 봇은 responder로만 동작한다.

```text
botGives = trade.request
botReceives = trade.offer
```

봇이 requester인 거래 또는 counter 거래 제안은 이 단계에서 평가하지 않는다. 혹시 trade.requesterPlayerId가 봇이면 runner는 아무 응답도 보내지 않는다.

검증은 항상 `botGives` 기준으로 한다.

```text
봇 보유 자원 >= botGives
botReceives에 알 수 없는 자원 없음
botGives와 botReceives가 모두 비어 있지 않음
수량은 양의 정수
trade.responderPlayerIds에 봇 playerId가 포함됨
trade.responses[botPlayerId]가 아직 없음
trade.status가 collecting 또는 응답 가능한 상태임
```

## 공정성

```text
기본 봇은 상대의 정확한 비공개 개발 카드 종류를 판단에 사용하지 않는다.
상대 자원 판단은 공개 총량과 공개 행동 로그 수준으로 제한한다.
서버 내부 전체 정보를 그대로 이용해 완벽한 거래 판단을 하지 않는다.
```

## 구현 순서

```text
1. evaluateTradeForBot(matchState, botSeatIndex, trade) 추가
2. 봇의 다음 목표 계산 helper 재사용
3. normalizeTradeForBot(trade, botPlayerId)를 추가해 botGives/botReceives 계산
4. 봇 대상 trade pending 감지
5. accept/reject command를 runBotCommand로 실행
6. 응답 실패 시 reject fallback 적용 여부를 trade 상태 재확인 후 결정
7. 거래 로그의 비공개 정보 노출 여부 점검
8. tradeId/round를 포함한 응답 payload 구성
9. trade round 변경 시 예약된 봇 응답 무효화
10. counter 응답을 봇 선택지에서 제외
```

## 수정 대상 파일

```text
server.js
- trade pending 조회
- 봇 거래 평가 함수
- accept/reject 자동 command
- 거래 로그 공개 범위 점검

script.js
- 봇 응답 후 거래 모달 상태 표시 점검

scripts/
- 봇 거래 응답 WebSocket 테스트
```

## 응답 타이밍

```text
봇 응답은 제안 직후 짧은 delay 후 실행한다.
사람 응답자가 함께 있는 다자 응답 구조라면 봇 응답만 먼저 기록하고 pending 전체 종료 조건은 기존 로직을 따른다.
거래가 이미 취소/완료/만료되었으면 응답하지 않는다.
tradeId 또는 round가 예약 당시와 달라졌으면 응답하지 않는다.
```

봇 응답 payload:

```text
{
  name: "respondPlayerTrade",
  tradeId: trade.id,
  round: trade.round,
  response: "accept" | "reject"
}
```

봇은 `response: "counter"`를 보내지 않는다. counter는 사람 협상 UI 기능으로 남기고, 봇 자동 응답은 단순 수락/거절로 제한한다.

봇의 accept는 반드시 기존 거래 시스템의 의미를 따른다.

```text
현재 서버 로직에서는 봇 accept가 즉시 체결되지 않고 trade.responses에 기록된다.
모든 responder 응답 후 trade.status가 readyToChoose가 되면 requester가 최종 target을 선택한다.
최종 선택 시점에 자원이 부족하면 거래는 invalidated 될 수 있다.
봇 계획서는 기존 거래 체결 정책을 바꾸지 않는다.
```

응답 예약 signature:

```text
trade.id + trade.round + botPlayerId
```

같은 signature에는 한 번만 응답한다. trade가 update되어 round가 증가하면 이전 signature timer와 평가 결과는 폐기한다.

## 상세 구현 체크리스트

```text
[ ] trade requester가 봇 자신이면 이 단계에서는 처리하지 않는다.
[ ] bot이 responder 목록에 있는 경우만 처리한다.
[ ] trade를 botGives/botReceives로 정규화한다.
[ ] responder 봇 기준 botGives = trade.request, botReceives = trade.offer로 계산한다.
[ ] 봇 보유 자원이 botGives 요구량을 만족하는지 확인한다.
[ ] payload 자원 타입과 수량을 검증한다.
[ ] 평가가 애매하거나 정규화가 실패하면 reject를 선택한다.
[ ] 봇은 counter response를 보내지 않는다.
[ ] respondPlayerTrade payload에 tradeId와 round를 포함한다.
[ ] trade round가 바뀌면 기존 평가와 timer를 폐기한다.
[ ] accept 실패 시 trade 최신 상태를 다시 확인한 뒤 fallback 여부를 결정한다.
[ ] 이미 응답한 봇은 다시 응답하지 않는다.
[ ] accept는 응답 기록일 뿐 즉시 체결 보장이 아님을 테스트한다.
[ ] 거래 완료 후 모든 클라이언트에서 모달이 정리되는지 확인한다.
```

## 검증 계획

자동:

```text
봇 대상 거래 제안에 accept 또는 reject가 자동 기록된다.
봇이 accept한 직후에는 자원 이동이 일어나지 않는다.
requester가 봇 accept를 최종 선택한 뒤에는 자원 이동이 정확하다.
봇이 거절한 거래는 pending에서 제거된다.
봇에게 불가능한 자원을 요구하는 거래는 거절된다.
1등 플레이어에게 과도하게 유리한 거래는 거절된다.
거래 방향이 requester 기준으로 들어와도 botGives/botReceives로 정규화된다.
서버 모델에서 responder 봇은 trade.request를 내주고 trade.offer를 받는 것으로 평가한다.
애매한 거래는 수락하지 않고 거절된다.
기존 거래 체결 정책이 봇 응답으로 바뀌지 않는다.
봇 accept 후 즉시 자원 이동이 일어나지 않고 requester 선택 전까지 pending이 유지된다.
trade round가 변경되면 이전 봇 응답 timer는 실행되지 않는다.
봇은 counter response를 보내지 않는다.
이미 응답한 봇은 같은 tradeId/round에 다시 응답하지 않는다.
```

수동:

```text
사람이 봇에게 유리한 거래를 제안한다.
사람이 봇에게 불리한 거래를 제안한다.
봇 응답 후 모든 브라우저에서 거래 모달/pending이 정리되는지 확인한다.
```

## 위험 요소

```text
거래 응답 타이머가 사람 응답 흐름과 충돌할 수 있다.
봇이 너무 보수적으로 거절만 할 수 있다.
거래 로그에서 교환 자원 정보 공개 범위가 기존 정책과 어긋날 수 있다.
requester 기준 give/receive를 봇 관점으로 잘못 해석해 반대로 거래할 수 있다.
봇 accept가 기존 체결 정책을 우회해 즉시 자원 이동을 만들 수 있다.
거래가 이미 종료된 뒤 오래된 봇 응답 timer가 실행될 수 있다.
거래 update로 round가 바뀐 뒤 이전 평가 결과로 응답할 수 있다.
봇이 counter를 보내면 사람 협상 UI/서버 정책과 얽혀 범위가 커질 수 있다.
accept를 체결로 오해해 bot-04가 자원 이동 후 상태라고 착각할 수 있다.
봇 accept 후 최종 선택 시점에 자원이 부족해 invalidated가 발생할 수 있다.
```

## 롤백/복구 방법

```text
자동 수락이 위험하면 모든 봇 거래를 자동 거절하는 fallback으로 축소한다.
거래 평가 함수는 pending 정리 로직과 분리해 제거 가능하게 둔다.
봇 거래 응답 runner를 끄더라도 사람 간 거래는 유지되어야 한다.
normalizeTradeForBot이 불안정하면 수락 기능을 끄고 reject-only로 유지한다.
trade round/timer 처리가 불안정하면 즉시 reject-only로 낮추고 delay를 제거한다.
accept 처리에서 체결 오해가 생기면 accept 기능을 끄고 모든 봇 응답을 reject로 제한한다.
```

## 테스트 산출물

```text
docs/test_plans/2026-05-26_bot-07-trade-response-test-plan.md
docs/final_reports/2026-05-26_bot-07-trade-response-final-report.md
```

## 완료 기준

```text
봇 대상 거래 제안이 방치되지 않는다.
봇의 수락/거절이 기존 거래 규칙을 통과한다.
비공개 정보 기반의 불공정 판단을 하지 않는다.
거래 방향은 botGives/botReceives 기준으로 안전하게 해석된다.
판단이 애매한 거래는 수락하지 않는다.
봇 응답이 기존 거래 체결 정책을 바꾸지 않는다.
봇은 counter를 보내지 않는다.
tradeId/round 불일치 또는 이미 응답한 거래에는 응답하지 않는다.
봇 accept는 응답 기록으로만 처리되고 requester 최종 선택 흐름을 유지한다.
```
