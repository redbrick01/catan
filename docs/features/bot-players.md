# 봇 플레이어

## 목적

봇 플레이어는 온라인 서버가 제어하는 일반 좌석 플레이어입니다. 목표는 강한 AI가 아니라 사람이 있는 방에서 게임이 멈추지 않고 진행되도록 하는 안정적인 규칙 기반 플레이어입니다.

## 현재 지원 범위

- 대기실에서 봇 추가/제거
- 사람 1명 + 봇 포함 최소 인원 구성
- public state의 `isBot`, `botDifficulty` 표시
- 서버 내부 봇 러너
- 초기 정착지와 도로 자동 배치
- 주사위 굴림과 턴 종료 자동 처리
- 도로, 정착지, 도시, 개발 카드 구매 판단
- 은행 교환 제한 기반 자동 교환
- 7 처리 중 자원 버리기, 도둑 이동, 피해자 선택
- 개발 카드 일부 사용
- 플레이어 교환 요청에 대한 기본 응답
- 봇 command가 사람 command와 같은 서버 검증 경로를 통과

## 설계 원칙

```text
봇은 서버 내부 플레이어다.
봇도 일반 command 검증을 통과해야 한다.
봇의 판단 근거와 내부 점수는 public state에 노출하지 않는다.
한 턴에서 무한 행동하지 않도록 행동 제한을 둔다.
```

## 핵심 구현 파일

```text
server.js
scripts/bot-08-ui-logging-regression-test.js
scripts/bot-09-stabilization-regression-test.js
```

## 관련 기준 문서

- [봇 개발 프로세스 가이드라인](../../docs/guides/bot-development-process-guideline.md)
- [플레이봇 참고자료 기반 구현 가이드라인](../../docs/reference/playbot-reference-guideline.md)

## 관련 구현 계획

- [봇 00 로드맵](../plans/2026-05-26_bot-00-basic-bot-roadmap.md)
- [봇 01 플레이어 모델/로비](../plans/2026-05-26_bot-01-player-model-lobby-plan.md)
- [봇 02 턴 러너](../plans/2026-05-26_bot-02-turn-runner-plan.md)
- [봇 03 초기 배치](../plans/2026-05-26_bot-03-initial-placement-plan.md)
- [봇 04 기본 행동](../plans/2026-05-26_bot-04-basic-actions-plan.md)
- [봇 05 7/도둑 pending](../plans/2026-05-26_bot-05-robber-seven-pending-plan.md)
- [봇 06 개발 카드](../plans/2026-05-26_bot-06-dev-cards-plan.md)
- [봇 07 교환 응답](../plans/2026-05-26_bot-07-trade-response-plan.md)
- [봇 08 UI/로그](../plans/2026-05-26_bot-08-ui-logging-plan.md)
- [봇 09 안정화 회귀](../plans/2026-05-26_bot-09-stabilization-regression-plan.md)
- [봇 모드 고려사항](../plans/2026-05-26_bot-mode-considerations.md)

## 관련 테스트와 보고서

- [봇 09 안정화 회귀 테스트 계획](../tests/2026-05-26_bot-09-stabilization-regression-test-plan.md)
- [봇 09 Gate Summary](../reports/2026-05-26_bot-09-gate-summary.md)
- [봇 09 최종 보고서](../reports/2026-05-26_bot-09-stabilization-regression-final-report.md)
- [봇 known issues](../issues/2026-05-26_bot-known-issues.md)

## 유지보수 체크리스트

- 봇 명령은 새 전용 우회 경로를 만들지 말고 기존 handler를 호출합니다.
- 봇 턴은 command in-flight, revision, attempted command를 통해 중복 실행을 방지합니다.
- pending action이 추가되면 봇 actor와 봇 responder 양쪽 처리를 확인합니다.
- 봇 자동화가 실패해도 서버가 죽지 않고 사람 턴으로 복구 가능한지 확인합니다.
- 봇 UI 변경은 사람 플레이어와 구분되되, 게임 정보 노출 정책을 깨지 않아야 합니다.

