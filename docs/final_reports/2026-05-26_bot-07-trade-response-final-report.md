# Bot 07 플레이어 거래 응답 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/implementation_plans/2026-05-26_bot-04-basic-actions-plan.md
docs/implementation_plans/2026-05-26_bot-07-trade-response-plan.md
catan_bot_development_process_guideline.md
catan_playbot_reference_guideline.md
```

## 목표

사람 플레이어가 봇에게 플레이어 거래를 제안했을 때, 봇이 자동으로 `accept` 또는 `reject`를 기록해 거래 pending이 방치되지 않게 한다.

bot-07 범위:

```text
봇 responder 자동 감지
거래 방향 정규화
accept/reject 자동 응답
tradeId/round stale 응답 방지
counter 금지
기존 거래 체결 정책 유지
```

봇이 먼저 거래를 제안하거나 counter를 보내는 기능은 구현하지 않았다.

## 변경 파일

```text
server.js
```

UI 변경은 bot-07 범위에서 추가하지 않았다. 기존 player trade modal은 봇 응답 후 state broadcast에 따라 갱신된다.

## 구현 요약

### 봇 trade responder 감지

bot runner의 actor 감지 흐름에 `tradeResponder`를 추가했다.

조건:

```text
room.pendingPlayerTrade 존재
room.status === "playing"
game.phase === "play"
winner 없음
trade.requesterPlayerId가 봇이 아님
trade responder 목록에 봇 playerId 포함
trade.responses[botPlayerId]가 아직 없음
trade가 응답 가능한 상태
```

봇이 requester인 거래는 bot-07에서 처리하지 않는다.

### 거래 방향 정규화

`normalizeTradeForBot(room, trade, botPlayerId)`를 추가했다.

현재 서버 trade 모델:

```text
trade.offer: requester가 내놓는 자원
trade.request: responder가 내놓아야 하는 자원
```

bot-07에서 봇은 responder로만 동작한다.

따라서 정규화 방향:

```text
botGives = trade.request
botReceives = trade.offer
```

거래 평가는 원본 `requesterGives/requesterReceives` 표현이 아니라 반드시 `botGives/botReceives` 기준으로 수행한다.

정규화 실패 조건:

```text
trade 없음
bot player 없음
requester가 봇
봇이 responder가 아님
이미 봇 응답 있음
trade status가 응답 불가
botGives 또는 botReceives가 비어 있음
알 수 없는 resource type
수량이 양의 정수가 아님
```

정규화는 거래 방향과 payload 형태를 검증하는 단계다. 봇 보유 자원이 `botGives` 이상인지, 거래가 봇 목표에 도움이 되는지는 `evaluateTradeForBot` 평가 단계에서 reject 조건으로 처리한다.

### 거래 평가

`evaluateTradeForBot(matchState, botSeatIndex, trade)`를 추가했다.

평가 원칙:

```text
확실히 봇에게 이득인 거래만 accept
판단이 애매하면 reject
```

수락 기준:

```text
botReceives가 봇의 다음 목표에 필요한 자원
botGives가 현재 목표에 덜 중요한 자원
거래 후 즉시 유의미한 행동 가능
상대가 1등이 아니거나 상대에게 과도한 이득이 아님
botGainScore, opponentRiskScore, fairnessScore를 분리 평가
```

거절 기준:

```text
정규화 실패
payload 비정상
봇 보유 자원 부족
거래 방향 해석 불가
봇의 다음 목표에서 멀어짐
봇이 희소하게 필요한 자원을 내줘야 함
상대가 즉시 승점 행동을 할 가능성이 큼
1등 플레이어에게 과도하게 유리함
이미 봇이 응답함
판단이 애매함
```

평가 책임 경계:

```text
normalizeTradeForBot: 거래 방향, responder 자격, status, bundle 형태 검증
evaluateTradeForBot: 봇 보유 자원, 목표 달성 가능성, botGainScore, opponentRiskScore, fairnessScore 평가
executeBotTradeResponse: 최신 tradeId/round signature 확인 후 accept/reject command 전송
```

`evaluateTradeForBot`의 public score 계산은 현재 game player의 `id`가 seatIndex와 같은 구조에 기대는 부분이 있다. 의미상 seatIndex 기반 helper이므로, 향후에는 `publicScoreForSeat(matchState, index)`처럼 명시적인 seatIndex 순회로 바꾸는 것을 후속 안정화 항목으로 둔다.

### 응답 실행

`executeBotTradeResponse(room, actor, runner)`를 추가했다.

봇 응답 payload:

```js
{
  name: "respondPlayerTrade",
  tradeId: trade.id,
  round: trade.round,
  response: "accept" | "reject"
}
```

봇은 `counter`를 절대 보내지 않는다.

응답은 `runBotCommand`를 통해 기존 `respondPlayerTrade` handler로 실행된다.

### trade response signature

중복/오래된 응답을 막기 위해 signature를 둔다.

```text
trade.id + trade.round + botPlayerId
```

runner 내부 상태:

```text
completedTradeResponseSignatures
```

정책:

```text
같은 tradeId/round/botPlayerId에는 한 번만 응답
trade round가 증가하면 이전 signature는 더 이상 현재 signature와 일치하지 않음
거래가 취소/완료/만료되면 응답하지 않음
이미 응답한 봇은 재응답하지 않음
```

accept 실패 시 최신 trade state를 다시 확인하고, 아직 같은 signature가 유효하며 봇이 미응답이면 안전하게 reject fallback을 시도한다. reject도 실패하거나 거래가 종료되었으면 중단한다.

`completedTradeResponseSignatures`는 room runner 내부 상태로 유지된다. 현재는 room lifecycle 동안 누적되며, 장시간 게임에서 완료된 trade signature cleanup이 필요한지는 후속 안정화 항목으로 남긴다.

## 기존 거래 체결 정책 유지

봇 accept는 즉시 자원 이동이 아니다.

서버 정책:

```text
accept/reject는 trade.responses에 응답을 기록
모든 responder가 응답하면 trade.status가 readyToChoose
requester가 최종 target을 선택해야 자원 이동
최종 선택 시점에 자원이 부족하면 invalidated 처리 가능
```

bot-07은 이 정책을 변경하지 않는다.

## command 실행 경로

봇 거래 응답은 `runBotCommand`를 통해 기존 `respondPlayerTrade` handler를 호출한다.

따라서 다음 검증은 사람 command와 같은 경로를 통과한다.

```text
tradeId 존재
round 일치
requester는 응답 불가
responder만 응답 가능
이미 응답한 player 재응답 금지
accept/reject/counter payload 검증
trade status 갱신
readyToChoose 전환
```

봇 구현은 `trade.responses`나 resources를 직접 수정하지 않는다.

## 제외 범위 준수

bot-07에서는 다음을 구현하지 않았다.

```text
봇이 먼저 플레이어 거래 제안
counter response
고급 교역 협상
상대 개발 카드 추론
상대 손패 정밀 추정
거래 체결 정책 변경
UI/로그 고도화
MCTS/RL
```

## 공정성 및 비공개 정보

봇 평가는 공개 정보와 봇 자신의 손패만 사용한다.

사용하지 않는 정보:

```text
상대의 정확한 비공개 개발 카드 종류
상대의 정확한 손패 자원 종류
서버 내부 전체 자원 정보를 이용한 완벽한 거래 판단
```

상대 자원 판단은 공개 `resourceCount`와 공개 행동 결과 수준으로 제한한다.

## 안정성 설계 반영

### 방향 오류 방지

모든 평가는 `botGives = trade.request`, `botReceives = trade.offer` 정규화 이후에만 수행한다.

### stale round 방지

응답 직전 최신 trade의 signature를 다시 확인한다. trade update로 round가 바뀌면 이전 예약/평가 결과는 폐기된다.

### 중복 응답 방지

`completedTradeResponseSignatures`로 같은 tradeId/round에 중복 응답하지 않는다.

### fallback 보수화

accept 실패 시에도 자동 체결이나 counter로 넘어가지 않는다. 가능한 경우 reject fallback만 시도한다.

## 검증 결과

bot-09 안정화 단계에서 bot-07 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\online-10-player-trade-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

기존 WebSocket 회귀에서 확인:

```text
openPlayerTrade role-specific view
pending 중 bankTrade/endTurn 차단
counter response는 requester가 최종 선택할 수 없음
accepted response 선택 시에만 자원 이동
trade update로 round 증가
old round response는 TRADE_ROUND_CHANGED
cancel 후 trade clear
최종 선택 시 자원 부족하면 invalidated
```

bot-09 통합 테스트에서 확인:

```text
봇 대상 거래에 자동 accept 또는 reject 기록
봇은 counter를 보내지 않음
봇 응답 직후 자원 이동 없음
trade response 이후 public state leak 없음
사람 전용 3인 온라인 회귀 smoke 통과
```

구체적인 bot-09 확인 근거:

- `testRunnerTurnsAndTrade()`에서 사람이 봇을 responder로 포함하는 `openPlayerTrade`를 실행한다.
- `waitFor(..., "bot trade response")`가 `pendingPlayerTrade.responses` 안에 봇 player의 응답이 생길 때까지 기다린다.
- 봇 응답이 없으면 `bot did not respond to player trade`로 실패 처리한다.
- 봇 응답 중 `type === "counter"`가 있으면 `bot sent counter response`로 실패 처리한다.
- 봇 응답 직후 봇의 `resourceCount`가 변하면 `bot accept/reject moved resources before requester choice`로 실패 처리한다.
- `assertNoPublicLeak(host.state, "state after bot trade response")`로 내부 평가 점수/signature 미노출을 확인한다.

직접 검증되지 않은 항목:

- 좋은 거래 accept, 불가능한 자원 요구 reject, 애매한 거래 reject, 1등에게 유리한 거래 reject를 각각 분리한 bot-07 전용 fixture는 아직 없다.
- 봇 응답 예약 후 requester가 `updatePlayerTradeOffer`로 round를 올렸을 때 이전 timer가 실제로 응답하지 않는지 직접 검증하는 봇 전용 fixture는 아직 없다. 기존 `online-10-player-trade-ws-test.js`는 사람 command 기준으로 old round `TRADE_ROUND_CHANGED`를 검증한다.

## 비공개 정보 점검

노출 금지 항목:

```text
상대 정확한 손패 자원 종류
상대 숨은 개발 카드 type
봇 거래 평가 점수
botGainScore/opponentRiskScore/fairnessScore 내부 값
completedTradeResponseSignatures
```

결과: bot-09 public state smoke에서 노출 없음.

## 남은 위험

- 거래 수락 기준은 보수적인 heuristic이라 봇이 좋은 거래도 거절할 수 있다.
- accept/reject 평가 경로별 bot-07 전용 fixture는 아직 없다.
- 봇 응답 예약 timer가 trade round 변경 후 폐기되는지 직접 확인하는 bot 전용 stale timer 테스트는 아직 없다.
- `evaluateTradeForBot`의 top score 계산은 현재 구조에서 동작하지만, 의미상 seatIndex 기반 순회로 더 명확히 만들 여지가 있다.
- `completedTradeResponseSignatures`는 room lifecycle 동안 누적되며, 장시간 게임에서 cleanup이 필요한지는 후속 검토 대상이다.
- 다자 거래에서 봇 응답은 자신의 response 기록까지만 책임지고, 최종 선택은 requester에게 남는다.
- 브라우저 trade modal의 모든 다자 조합 시각 검증은 bot-09에서 자동화 제한으로 부분 수행이다.

## 최종 판정

완료.

bot-07의 핵심 계약인 “봇 responder가 거래 방향을 botGives/botReceives로 정확히 정규화하고, tradeId/round 일치 시 accept 또는 reject만 기존 respondPlayerTrade 검증 경로로 한 번 기록하며, 기존 requester 최종 선택 정책을 바꾸지 않는다”는 구현 및 통합 회귀 검증을 통과했다.

## 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- `normalizeTradeForBot`과 `evaluateTradeForBot`의 책임 경계를 분리해, 봇 보유 자원 부족은 평가 단계의 reject 조건임을 명확히 했다.
- `evaluateTradeForBot`의 top score 계산은 향후 seatIndex 기반 순회로 더 명확히 할 수 있음을 남은 위험에 기록했다.
- bot-09의 `testRunnerTurnsAndTrade()`가 확인한 봇 응답, no counter, 즉시 자원 이동 없음, public leak 검사 근거를 검증 섹션에 연결했다.
- accept/reject 경로별 fixture와 봇 예약 timer의 stale round 직접 검증이 아직 부족하다는 점을 직접 검증되지 않은 항목과 남은 위험에 명시했다.
- `completedTradeResponseSignatures` cleanup 필요성은 장시간 게임 후속 안정화 항목으로 남겼다.
