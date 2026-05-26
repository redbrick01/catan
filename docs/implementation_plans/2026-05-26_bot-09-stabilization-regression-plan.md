# 봇 09 안정화 및 회귀 테스트 계획

작성일: 2026-05-26

## 목적

봇 포함 게임이 실제 브라우저와 WebSocket 테스트에서 멈추지 않는지 검증하고, 기존 사람 전용 온라인/오프라인 게임의 회귀를 확인한다.

## 2차 꼼꼼 피드백 요약

```text
1. 단순 "여러 턴 진행"만으로는 부족하며 pending signature, trade round, 개발 카드 사용 제한 같은 세부 계약을 통합 테스트에 포함해야 한다.
2. bot runner/timer는 종료 후 남지 않는 것뿐 아니라 같은 revision/signature에서 중복 command를 만들지 않는지도 확인해야 한다.
3. 비공개 정보 검사는 로그뿐 아니라 public state, pending view, winner summary, 브라우저 콘솔, 서버 로그까지 포함해야 한다.
4. UI 회귀는 봇 배지 표시뿐 아니라 사람 pending/trade 모달 우선순위와 320px 긴 이름 조합까지 확인해야 한다.
5. bot-04~bot-07의 blocking 상태 계약이 실제 통합 흐름에서 서로 충돌하지 않는지 확인해야 한다.
6. P0/P1 판단 기준에 "불필요한 victim command", "오래된 trade round 응답", "public state 내부 정보 노출"을 명시해야 한다.
7. 최종 보고서는 실행 명령만이 아니라 fixture/seed/dice/dev deck/trade round 등 재현 정보를 같이 남겨야 한다.
```

## 범위

포함:

```text
자동/WebSocket 테스트 정리
재현 가능한 봇 테스트 환경
다중 브라우저 수동 테스트
오프라인 회귀 테스트
사람 전용 온라인 회귀 테스트
비공개 정보 노출 검사
서버/브라우저 콘솔 오류 검사
브라우저 화면 캡처 또는 검증 기록
실행 명령/로그 요약 기록
known issues 정리
최종 보고서 작성
```

제외:

```text
공식 배포 품질의 부하 테스트
장시간 서버 운영 테스트
대규모 매치메이킹 테스트
고급 봇 실력 평가
모든 브라우저/모든 모바일 기기 호환성 보증
```

## 테스트 조건

재현 가능한 자동 테스트:

```text
NODE_ENV=test에서 봇 delay 제거 또는 최소화
forced dice 사용
고정 보드 또는 고정 random seed 사용
고정 개발 카드 덱 사용
테스트 종료 시 bot timer 정리
거래 round/update fixture 사용
피해자 0명/1명/2명 이상 강도 fixture 사용
긴 이름/모바일 UI fixture 사용
```

수동 조합:

```text
사람 1 + 봇 2
사람 2 + 봇 1
사람 2 + 봇 2
온라인 방장 + 봇
기존 사람 3~4명 온라인
기존 오프라인 3~4명
```

"여러 턴 진행"의 최소 기준:

```text
각 봇 포함 조합에서 사람 플레이어가 최소 2회 이상 자기 턴을 다시 받는다.
연속 봇 턴이 있는 조합에서는 봇 2명이 연속으로 턴을 마친다.
forced dice 또는 fixture로 최소 1회 이상 7/강도 흐름을 확인한다.
봇 대상 거래 응답을 최소 1회 확인한다.
개발 카드 knight/yearPlenty/victory 회귀를 최소 1회 확인한다.
봇 응답 후 사람 pending/trade 모달이 막히지 않는 상황을 최소 1회 확인한다.
```

브라우저 권장 조합:

```text
Chrome 일반 창: 방장
Chrome 시크릿 창: 참가자
Edge 또는 다른 기기 Chrome: 추가 참가자
모바일 폭 viewport: UI 회귀 확인
```

검증 기록에는 실제 사용한 브라우저/기기/viewport를 남긴다.

## 검증 항목

```text
봇 포함 게임이 시작된다.
초기 배치가 끝난다.
봇 일반 턴이 끝난다.
7/강도/pending action이 종료된다.
봇 대상 거래 pending이 방치되지 않는다.
tradeId/round가 바뀐 오래된 봇 응답이 실행되지 않는다.
봇이 이기면 게임이 종료된다.
개발 카드 구매 턴/usedDevThisTurn/blocking 상태 규칙을 위반하지 않는다.
상태가 여러 브라우저에 동기화된다.
서버 콘솔에 치명 오류가 없다.
브라우저 콘솔에 반복 오류가 없다.
사람 전용 게임이 회귀하지 않는다.
봇 runner timer가 테스트 종료 후 남지 않는다.
같은 pending signature/trade signature/dev card signature에서 중복 command가 실행되지 않는다.
비공개 정보가 public state, state view, 전역 로그, 브라우저 콘솔, 서버 로그에 노출되지 않는다.
```

단계별 통합 게이트:

```text
bot-01: publicPlayer/makePlayerView에 isBot은 있고 token/runner 내부 상태는 없다.
bot-02: 같은 broadcast/revision에서 runner가 중복 예약되어도 command는 중복 실행되지 않는다.
bot-03: setupPlacement는 도로 배치 후 clear되고 public state에 노출되지 않는다.
bot-04: pendingPlayerTrade/pendingFreeRoads/pendingAction 중 일반 행동과 endTurn이 실행되지 않는다.
bot-05: 피해자 0명/1명 경로에서 chooseRobberVictim command를 보내지 않는다.
bot-06: 구매 턴 카드, usedDevThisTurn, 은행 재고 부족 풍년을 거절한다.
bot-07: trade update로 round가 바뀐 뒤 이전 timer가 응답하지 않는다.
bot-08: 사람 pending/trade UI가 봇 턴 대기 안내보다 우선한다.
```

## 구현 순서

```text
1. WebSocket 봇 테스트 스크립트 정리
2. forced dice/고정 상태 fixture 정리
3. 봇 타이머 테스트 정리 방법 확인
4. 브라우저 수동 테스트 진행
5. 오프라인/사람 전용 온라인 회귀 테스트 진행
6. 비공개 정보 노출 점검
7. 브라우저 화면 캡처 또는 검증 기록 저장
8. known issues 작성
9. 최종 보고서 작성
10. 필수 게이트별 pass/fail 표 작성
11. P0/P1 잔존 여부 재확인
```

## 수정 대상 파일

```text
scripts/
- bot-01~bot-08 자동/회귀 테스트 스크립트

docs/test_plans/
- bot-09 통합 테스트 계획서

docs/final_reports/
- bot-09 최종 안정화 보고서

docs/known_issues/
- 남은 봇 관련 이슈가 있으면 기록

docs/test_plans/
- 테스트 중 생성한 스크린샷 또는 검증 이미지가 있으면 같은 날짜 파일명으로 저장

docs/final_reports/
- fixture/seed/dice/dev deck/trade round/viewport 기록
```

## 통합 테스트 매트릭스

```text
사람 1 + 봇 2: 시작, 초기 배치, 여러 턴, 7
사람 2 + 봇 1: 거래 응답, 강도 피해자, 재접속
사람 2 + 봇 2: 연속 봇 턴, 봇 간 순서, 로그 과다
사람 1 + 봇 3: 최대 봇 수, 연속 봇 3명, host/remove UI 회귀
사람 3: 기존 온라인 회귀
사람 4: 기존 온라인 회귀
오프라인 3: 기존 오프라인 회귀
오프라인 4: 기존 오프라인 회귀
모바일 폭: 로비 봇 버튼, 플레이어 카드, 로그 overflow
거래 update: trade round 변경 후 오래된 봇 응답 무효화
강도 피해자 0/1/2명: victim command 조건 확인
개발 카드: victory 비사용, knight pending 연결, yearPlenty 은행 재고
UI 정보 노출: public state에 runner/timer/evaluation 없음
```

## 자동 테스트 명령 기준

```text
node --check server.js
node --check script.js
node --check scripts/*.js
node scripts/bot-01-player-model-lobby-ws-test.js
node scripts/bot-02-turn-runner-ws-test.js
node scripts/bot-03-initial-placement-ws-test.js
node scripts/bot-04-basic-actions-ws-test.js
node scripts/bot-05-robber-seven-pending-ws-test.js
node scripts/bot-06-dev-cards-ws-test.js
node scripts/bot-07-trade-response-ws-test.js
node scripts/bot-08-ui-logging-regression-test.js
node scripts/bot-09-stabilization-regression-test.js
```

실제 스크립트명은 구현 단계에서 확정하되, 최종 보고서에는 실행한 정확한 명령을 기록한다.

## 상세 검증 체크리스트

```text
[ ] bot-01~bot-08 최종 보고서가 모두 존재한다.
[ ] 모든 bot 단계 테스트 계획서가 존재한다.
[ ] 자동 테스트 명령을 실제 실행했다.
[ ] 실패한 자동 테스트가 있으면 known issues 또는 수정 결과에 기록했다.
[ ] 최소 2개 브라우저로 온라인 동기화를 확인했다.
[ ] 봇 포함 게임에서 초기 배치부터 play phase까지 진행했다.
[ ] 각 봇 포함 조합에서 사람 플레이어가 최소 2회 이상 자기 턴을 다시 받았다.
[ ] 봇 포함 게임에서 7/강도/pending action을 확인했다.
[ ] 피해자 0명/1명/2명 이상 강도 흐름을 각각 확인했다.
[ ] 봇 대상 거래 응답을 확인했다.
[ ] trade round 변경 후 오래된 봇 응답이 실행되지 않음을 확인했다.
[ ] 봇 accept가 즉시 체결이 아니라 requester 선택 대기임을 확인했다.
[ ] 개발 카드 victory/knight/yearPlenty 회귀를 확인했다.
[ ] 구매 턴 카드와 usedDevThisTurn 상태에서 봇이 개발 카드를 쓰지 않음을 확인했다.
[ ] pendingPlayerTrade/pendingFreeRoads/pendingAction 중 봇 일반 행동이 멈추는지 확인했다.
[ ] 사람 전용 온라인 게임을 확인했다.
[ ] 오프라인 게임을 확인했다.
[ ] 비공개 정보 노출 로그/state view를 점검했다.
[ ] public state에 token/botRunner/timer/evaluation/setupPlacement가 노출되지 않음을 확인했다.
[ ] 사람 pending/trade 모달이 봇 턴 대기 안내보다 우선함을 확인했다.
[ ] 서버 콘솔과 브라우저 콘솔 오류를 기록했다.
[ ] 브라우저/기기/viewport 정보를 기록했다.
[ ] 320px 긴 이름 + 봇 배지 + 제거 버튼 조합을 확인했다.
[ ] 테스트 종료 후 bot timer 정리를 확인했다.
```

## 실패 분류

```text
P0: 서버 크래시, 게임 진행 불가, 비공개 정보 노출
P1: 봇 pending 방치, 동기화 불일치, 사람 전용 게임 회귀, 중복 runner command, 오래된 trade round 응답
P2: 봇 판단 품질 낮음, UI 표시 어색함, 로그 과다
P3: 튜닝/문구 개선
```

P0/P1 예시:

```text
P0: public state에 token 또는 숨은 개발 카드 타입 노출
P0: 서버 크래시 또는 방 전체 진행 불가
P1: 피해자 0/1명 경로에서 불필요한 chooseRobberVictim 반복
P1: pending 상태에서 bot-04가 endTurn/build를 반복 시도
P1: trade round 변경 뒤 이전 봇 timer가 응답
P1: 사람 pending/trade 모달이 봇 대기 안내에 가려 응답 불가
P1: 사람 전용 온라인/오프라인 기본 플로우 회귀
```

P0/P1은 최종 완료 전에 해결하거나 known issue로 남길 수 없다. P2/P3는 명확히 기록하고 후속으로 둘 수 있다.

완료 판정:

```text
완료: P0/P1 없음, 필수 자동 테스트 통과, 필수 수동 조합 통과
부분 완료: P0/P1 없음, 일부 P2/P3 또는 보조 브라우저 이슈 존재
보류: P0 또는 P1 존재, 또는 필수 테스트 미수행
실패: 서버 크래시/게임 진행 불가/비공개 정보 노출 재현
```

수행하지 못한 테스트는 최종 보고서에 다음 형식으로 남긴다.

```text
미수행 항목
미수행 이유
대체 확인 방법
남은 위험
후속 수행 조건
```

최종 보고서 재현 정보:

```text
실행 명령
NODE_ENV 및 서버 포트
사용 fixture 이름
forced dice 값
고정 dev deck 순서
tradeId/round 변경 시나리오
브라우저/기기/viewport
스크린샷 또는 콘솔 로그 파일 경로
```

## 위험 요소

```text
타이머가 테스트 종료 뒤에도 남을 수 있다.
랜덤성 때문에 실패 재현이 어려울 수 있다.
봇 포함 테스트만 통과하고 사람 전용 게임이 회귀할 수 있다.
비공개 정보 노출이 특정 로그 경로에서만 발생할 수 있다.
테스트 조합이 많아 일부 수동 테스트가 누락될 수 있다.
P2/P3 이슈가 너무 많이 남으면 실제 체감 품질이 낮을 수 있다.
세부 단계 테스트는 통과했지만 통합 순서에서 blocking 상태가 충돌할 수 있다.
오래된 timer가 희귀하게 실행되어 자동 테스트에서는 지나갈 수 있다.
public state 노출은 UI가 정상이어도 네트워크 state에 남을 수 있다.
모바일 UI는 screenshot 없이 육안 기록만 남기면 회귀를 놓칠 수 있다.
```

## 롤백/복구 방법

```text
봇 기능 전체를 로비 UI에서 숨길 수 있어야 한다.
서버 addBot command를 비활성화하면 사람 전용 온라인은 계속 가능해야 한다.
runner 예약 호출을 끄면 봇 자동 행동만 중단되어야 한다.
회귀가 발생하면 마지막으로 통과한 bot-XX 단계 기준으로 범위를 좁힌다.
P0/P1 발견 시 해당 단계의 final report를 완료로 작성하지 않고 수정 단계로 되돌린다.
UI만 문제면 addBot/removeBot UI를 숨기고 서버/사람 전용 게임 회귀를 먼저 보호한다.
거래/개발 카드 자동화가 문제면 해당 runner branch를 끄고 roll/endTurn fallback으로 축소한다.
pending 관련 P1이 있으면 bot-04 일반 행동보다 bot-05 pending 처리를 우선 수정한다.
```

## 테스트 산출물

```text
docs/test_plans/2026-05-26_bot-09-stabilization-regression-test-plan.md
docs/final_reports/2026-05-26_bot-09-stabilization-regression-final-report.md
docs/known_issues/2026-05-26_bot-known-issues.md
docs/test_plans/2026-05-26_bot-09-*.png 또는 검증 이미지
docs/final_reports/2026-05-26_bot-09-gate-summary.md
```

## 완료 기준

```text
봇 포함 게임이 실제 브라우저에서 여러 턴 진행된다.
서버 콘솔에 치명 오류가 없다.
브라우저 콘솔에 반복 오류가 없다.
비공개 정보 노출이 없다.
기존 온라인/오프라인 사람 전용 게임이 회귀하지 않는다.
봇 기능 최종 보고서가 작성된다.
P0/P1 이슈가 남아 있지 않다.
수행하지 못한 테스트와 남은 위험이 최종 보고서에 기록된다.
bot-01~bot-08 통합 게이트가 pass/fail로 기록된다.
재현 가능한 fixture/seed/dice/dev deck/trade round/viewport 정보가 남아 있다.
테스트 종료 후 bot runner/timer와 pending/trade/dev-card signature 상태가 정리된다.
```
