# Catan 플레이봇 참고자료 기반 구현 가이드라인

작성일: 2026-05-27

## 목적

이 문서는 Catan 플레이봇을 구현할 때 참고할 만한 외부 자료를 바탕으로, 현재 프로젝트에 맞는 구현 원칙을 정리한다. 목표는 강한 AI 연구가 아니라 서버 권위 온라인 게임에서 멈추지 않고, 규칙을 우회하지 않고, 사람 플레이어에게 자연스럽게 보이는 기본 봇을 만드는 것이다.

## 참고 자료

```text
1. Catanatron documentation
   https://docs.catanatron.com/
   Catan AI를 개발/테스트/벤치마크하기 위한 시뮬레이터 문서다. 수천 게임 시뮬레이션, 봇 인터페이스, weighted decision tree, 강화학습 환경 같은 방향을 참고할 수 있다.

2. Nakama Authoritative Multiplayer
   https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/
   서버가 게임 데이터를 검증하고 상태 변경을 broadcast하는 authoritative multiplayer 모델을 설명한다. 현재 프로젝트의 서버 검증 중심 봇 구조와 잘 맞는다.

3. UC Berkeley CS188 Monte Carlo Tree Search
   https://inst.eecs.berkeley.edu/~cs188/textbook/games/monte-carlo.html
   MCTS의 rollout 평가와 selective search 개념을 설명한다. 후속 고급 봇 후보로 참고하되, 1차 기본 봇에는 과하다.

4. Catan AI - Playing Catan with Monte Carlo Tree Search
   https://catan-ai.github.io/project/
   Catan 상태/행동 공간을 Player, Board, Action으로 나누고 가능한 action을 열거하는 접근이 유용하다. 다만 해당 프로젝트는 거래/항구/기사 등을 줄여 복잡도를 낮춘 전제가 있으므로 그대로 적용하지 않는다.

5. Monte Carlo Tree Search review
   https://arxiv.org/abs/2103.04931
   MCTS가 게임 봇과 순차 의사결정에 강력하지만, 복잡한 게임에서는 도메인별 수정과 하이브리드 접근이 필요하다는 점을 참고한다.

6. OpenFront technical architecture
   https://openfrontio-openfrontio.mintlify.app/technical/overview
   intent와 execution을 분리하고 deterministic simulation을 중시하는 구조를 참고한다. 현재 프로젝트는 서버가 simulation을 담당하므로 구조는 다르지만, "의도와 검증된 실행 분리" 원칙은 유용하다.
```

## 현재 프로젝트에 맞는 결론

```text
1. 1차 봇은 MCTS/RL이 아니라 rule-based + utility score 방식으로 구현한다.
2. 봇은 서버에서 실행되는 일반 player seat이어야 한다.
3. 봇 command는 사람 command와 같은 검증 경로를 통과해야 한다.
4. 봇 판단은 항상 "가능한 action 열거 -> 점수화 -> shared command 실행 -> 최신 state 재조회" 순서로 한다.
5. 봇 내부 상태, 평가 점수, timer, 후보 목록은 public state에 노출하지 않는다.
6. 비공개 정보는 봇이 서버 안에서 볼 수 있더라도 판단에 사용하지 않는다.
7. 자동 테스트는 deterministic fixture 중심으로 만든다.
```

## AI 방식 선택 기준

### 1차: 규칙 기반 봇

현재 구현 목표에 가장 적합하다.

```text
장점:
- 구현 난이도가 낮다.
- 서버 검증 흐름과 결합하기 쉽다.
- 디버깅과 테스트가 쉽다.
- "멈추지 않는 봇" 목표에 적합하다.

단점:
- 강한 플레이를 기대하기 어렵다.
- 특정 상황에서 사람이 보기에 어색한 판단을 할 수 있다.
```

권장 적용:

```text
초기 배치: 생산 확률, 자원 다양성, 항구, 확장성 점수
일반 턴: 도시 > 정착지 > 도로 > 개발 카드 > 교역 > 턴 종료
강도: 내 건물 감점, 앞선 상대/6·8 타일 가산점
거래: 확실히 이득이면 수락, 애매하면 거절
```

### 2차 후보: Utility AI

규칙 기반 봇이 너무 딱딱해지면 다음 단계로 고려한다.

```text
핵심:
- 각 action에 점수를 준다.
- 같은 action type 안에서 점수로 후보를 고른다.
- 점수 함수는 작고 독립적으로 유지한다.
```

현재 계획서의 `chooseBotBuildCity`, `chooseBotBuildSettlement`, `chooseBotBankTradeForGoal` 구조는 Utility AI로 확장하기 쉽다.

### 3차 후보: MCTS

후속 연구용으로만 둔다.

```text
적용 전제:
- 가능한 action을 완전하게 열거할 수 있어야 한다.
- state transition을 빠르게 복제/시뮬레이션할 수 있어야 한다.
- 주사위, 개발 카드, 숨은 손패 같은 stochastic/hidden information을 다룰 정책이 필요하다.
- 시간 예산과 timeout이 명확해야 한다.
```

현재 프로젝트에서는 다음 이유로 1차 구현에 적합하지 않다.

```text
- Catan의 branching factor가 크다.
- 거래, 강도, 개발 카드, 숨은 정보 때문에 rollout 품질 관리가 어렵다.
- 서버 실시간 방에서 긴 탐색은 턴 지연과 timer 문제를 만든다.
- 기본 목표는 강한 AI가 아니라 안정적인 자동 플레이어다.
```

## 아키텍처 원칙

### 서버 권위

봇은 클라이언트 자동 클릭이 아니라 서버 actor로 동작한다.

```text
사람: WebSocket command -> 서버 검증 -> 상태 변경 -> broadcast
봇: server runner -> runBotCommand -> 같은 서버 검증 -> 상태 변경 -> broadcast
```

금지:

```text
봇이 state를 직접 수정한다.
봇 전용 규칙 우회 함수를 만든다.
봇이 public view보다 많은 상대 비공개 정보를 전략 판단에 사용한다.
```

허용:

```text
서버 내부에서 합법 후보를 계산한다.
봇 자신의 손패와 공개 board state를 사용한다.
사람과 같은 command validator를 호출한다.
```

### Intent와 실행 분리

봇 판단은 "이 action을 하고 싶다"까지만 만든다. 실제 변경은 command validator가 한다.

```text
chooseBotAction(matchState, botSeatIndex) -> intent
runBotCommand(room, botPlayer, intent) -> validation + state change
after command -> latest matchState reread
```

이 구조는 OpenFront의 intent/execution 분리와 Nakama의 authoritative validation 원칙을 현재 서버 구조에 맞게 적용한 것이다.

## 행동 선택 원칙

### Action 열거

Catan AI 자료에서 가장 유용한 부분은 "가능한 action을 먼저 열거한다"는 점이다.

```text
1. 현재 phase 확인
2. active actor 확인
3. blocking 상태 확인
4. 자원/건물/덱/은행 재고 확인
5. 합법 위치 후보 생성
6. action 후보 생성
7. 점수화
8. shared command 실행
```

### 점수화

1차 점수는 단순하고 설명 가능해야 한다.

```text
생산 기대값
자원 다양성
현재 목표 비용과의 거리
건물/도로 재고
은행 재고
공개 승점 상황
pending 위험
```

피해야 할 점수:

```text
상대의 정확한 손패 자원 종류
상대의 숨은 개발 카드 종류
훔칠 자원 예측
서버 random 결과
내부 runner/timer 상태
```

## 테스트 원칙

### Deterministic fixture

외부 자료의 시뮬레이션/벤치마크 접근은 좋지만, 현재 프로젝트에서는 먼저 재현 가능한 회귀 테스트가 필요하다.

```text
NODE_ENV=test
forced dice
고정 board 또는 seed
고정 dev deck
고정 room/player/bot 조합
고정 trade round 시나리오
고정 pending victim 후보
```

### 필수 검증

```text
봇 command는 shared validation을 통과한다.
pending 상태에서 일반 행동을 하지 않는다.
같은 signature에서 command가 중복 실행되지 않는다.
테스트 종료 후 bot timer가 남지 않는다.
public state에 token/runner/timer/evaluation이 없다.
비공개 정보가 전역 로그나 콘솔에 남지 않는다.
사람 전용 온라인/오프라인 게임이 회귀하지 않는다.
```

## 단계별 적용 지침

```text
bot-01:
- isBot/botDifficulty만 public player identity로 노출한다.
- token, runner, 평가 정보는 절대 노출하지 않는다.

bot-02:
- room 단위 runner를 하나만 둔다.
- revision/signature가 오래된 runner는 실행하지 않는다.

bot-03:
- 초기 배치는 deterministic tie-break를 사용한다.
- setupPlacement는 내부 state로만 유지하고 도로 후 clear한다.

bot-04:
- rule-based 우선순위를 사용한다.
- bankTrade는 목표를 즉시 가능하게 할 때만 1회 사용한다.

bot-05:
- discard/move/victim은 pending signature로 중복 실행을 막는다.
- 피해자 0명/1명 자동 처리 경로에서는 victim command를 보내지 않는다.

bot-06:
- victory는 playDevCard 대상이 아니다.
- knight는 bot-05 pending으로 넘긴다.
- yearPlenty는 은행 재고와 즉시 목표 가능성을 확인한다.

bot-07:
- 봇은 counter를 보내지 않는다.
- responder 기준 botGives = trade.request, botReceives = trade.offer로 정규화한다.
- tradeId/round가 바뀌면 이전 응답 예약을 폐기한다.

bot-08:
- 사람 pending/trade 모달이 봇 처리 중 안내보다 우선한다.
- 봇은 연결된 사람처럼 표시하지 않는다.

bot-09:
- 각 단계 계약을 통합 게이트로 재검증한다.
- fixture/seed/dice/dev deck/trade round/viewport를 최종 보고서에 남긴다.
```

## 후속 고도화 기준

기본 봇이 안정화된 뒤에만 다음을 고려한다.

```text
1. Utility score weight 튜닝
2. 봇 성향 presets
3. Monte Carlo rollout 기반 후보 비교
4. self-play 시뮬레이션 통계
5. 승률/평균 점수/턴 수 기반 벤치마크
```

MCTS나 강화학습을 바로 붙이기 전에 반드시 필요한 선행 조건:

```text
빠른 cloneable game state
완전한 legal action enumerator
hidden information policy
deterministic random source
simulation timeout
대량 self-play runner
결과 분석 리포트
```

## 최종 원칙

```text
좋은 1차 봇은 강한 봇이 아니라 안전한 봇이다.
안전한 봇은 규칙을 우회하지 않는다.
안전한 봇은 pending을 방치하지 않는다.
안전한 봇은 사람의 비공개 정보를 훔쳐보지 않는다.
안전한 봇은 같은 상황에서 재현 가능하게 행동한다.
안전한 봇은 사람이 하던 게임을 망가뜨리지 않는다.
```
