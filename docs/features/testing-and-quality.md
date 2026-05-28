# 테스트와 검증

## 목적

이 프로젝트는 게임 규칙, 온라인 동기화, 비공개 정보, UI 상태가 서로 얽혀 있습니다. 따라서 테스트는 단순 실행 확인이 아니라 기능별 회귀 범위와 미검증 항목을 명확히 남기는 방식으로 관리합니다.

## 테스트 범주

| 범주 | 대상 | 산출물 |
| --- | --- | --- |
| 문법 검사 | `server.js`, `script.js`, 테스트 스크립트 | `node --check` 결과 |
| WebSocket 회귀 | 온라인 명령, 서버 상태, privacy view | `scripts/online-*.js` |
| 봇 회귀 | 봇 로비, 초기 배치, 턴 러너, pending 처리 | `scripts/bot-*.js` |
| 정적 UI 회귀 | DOM 구조, 버튼/모달 상태, 텍스트 존재 | 정적 테스트 스크립트 |
| 브라우저 smoke | 실제 로드, 콘솔 오류, 주요 화면 스크린샷 | `docs/tests/artifacts/*.png` |
| 수동 회귀 | 실제 브라우저/기기/네트워크 확인 | 테스트 결과 문서 |

## 현재 테스트 스크립트

```text
scripts/online-08-basic-building-ws-test.js
scripts/online-09-bank-trade-ws-test.js
scripts/online-10-player-trade-ws-test.js
scripts/online-10-1-player-trade-ui-static-test.js
scripts/online-11-development-cards-ws-test.js
scripts/online-12-robber-seven-pending-ws-test.js
scripts/bot-08-ui-logging-regression-test.js
scripts/bot-09-stabilization-regression-test.js
```

## 권장 실행 순서

```bash
node --check server.js
node --check script.js
node --check scripts/online-08-basic-building-ws-test.js
node --check scripts/online-09-bank-trade-ws-test.js
node --check scripts/online-10-player-trade-ws-test.js
node --check scripts/online-10-1-player-trade-ui-static-test.js
node --check scripts/online-11-development-cards-ws-test.js
node --check scripts/online-12-robber-seven-pending-ws-test.js
node --check scripts/bot-08-ui-logging-regression-test.js
node --check scripts/bot-09-stabilization-regression-test.js
node scripts/online-08-basic-building-ws-test.js
node scripts/online-09-bank-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
node scripts/online-10-1-player-trade-ui-static-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-12-robber-seven-pending-ws-test.js
node scripts/bot-08-ui-logging-regression-test.js
node scripts/bot-09-stabilization-regression-test.js
```

## 주요 테스트 문서

- [전체 기능 테스트 계획](../tests/2026-05-26_full-feature-test-plan.md)
- [전체 기능 테스트 실행 보고서](../tests/2026-05-26_full-feature-test-run-report.md)
- [온라인 13 전체 회귀 테스트 계획](../tests/2026-05-26_online-13-full-regression-test-plan.md)
- [온라인 13 수동 회귀 테스트 계획](../tests/2026-05-26_online-13-manual-regression-test-plan.md)
- [온라인 13 수동 회귀 테스트 결과](../tests/2026-05-26_online-13-manual-regression-test-result.md)
- [온라인 기기 연결 테스트 결과](../tests/2026-05-26_online-device-connection-test-result.md)
- [봇 09 안정화 회귀 테스트 계획](../tests/2026-05-26_bot-09-stabilization-regression-test-plan.md)

## 품질 기준

- 새 서버 명령에는 성공 케이스와 거절 케이스가 있어야 합니다.
- 비공개 정보 변경은 반드시 viewer별 payload를 확인합니다.
- 은행 재고, 개발 카드, 도둑, 플레이어 교환은 회귀 위험이 크므로 독립 테스트로 확인합니다.
- 자동화가 어려운 브라우저/기기 검증은 `NOT RUN`으로 남기고 이유를 기록합니다.
- 최종 보고서에는 실행한 테스트와 실행하지 못한 테스트를 모두 적습니다.

## 알려진 제한 관리

known issues는 아래 문서에서 관리합니다.

- [온라인 known issues](../issues/2026-05-26_online-13-known-issues.md)
- [봇 known issues](../issues/2026-05-26_bot-known-issues.md)
- [플레이 가능성 known issues](../issues/2026-05-26_playability-issues.md)
