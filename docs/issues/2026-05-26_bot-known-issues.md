# Bot Known Issues

작성일: 2026-05-26

## P0/P1

없음.

## P2/P3 및 미확인 항목

| Priority | 항목 | 상태 | 후속 실행자 | 필요한 환경 | 완료 기준 |
| --- | --- | --- | --- | --- | --- |
| P2 | 320px/375px/780px 실제 viewport 시각 검증 | 미수행 | QA 또는 다음 안정화 담당자 | viewport resize 가능한 브라우저 자동화 또는 수동 Chrome DevTools | 로비, player card, pending modal, trade modal, 로그 패널 screenshot 저장 및 overflow 없음 확인 |
| P2 | Chrome 시크릿, Edge, 다른 기기 Chrome 검증 | 미수행 | QA 또는 다음 안정화 담당자 | 실제 Chrome 시크릿, Edge, 다른 기기 Chrome | 로비 생성, 봇 추가, 게임 시작, pending/trade UI smoke 통과 |
| P2 | 실제 브라우저 여러 턴 진행 | 미수행 | QA 또는 다음 안정화 담당자 | 실제 Chrome 또는 Playwright 제어 가능한 브라우저 | 사람 1 + 봇 2, 사람 2 + 봇 2에서 사람 플레이어가 최소 2회 다시 턴을 받음 |
| P3 | 오프라인 3/4 전체 브라우저 플레이 | 미수행 | QA 또는 다음 안정화 담당자 | 수동 브라우저 회귀 세션 | 오프라인 3/4 게임 생성, setup, play phase 진입 smoke 확인 |
| P3 | 장시간 봇 포함 게임 운영 | 제외 범위 | 추후 성능/운영 검증 담당자 | 별도 soak test 계획 | 치명 오류 없이 장시간 진행, timer/runner cleanup 확인 |
| P3 | 로그 snapshot과 DOM overflow 자동화 | 미수행 | 다음 테스트 보강 담당자 | DOM 렌더링 테스트 또는 Playwright | 봇 로그에 비공개 정보 없음, 긴 이름 + 봇 배지 + 제거 버튼 overflow 없음 |

## 현재 보호 장치

- `node --check` 전체 통과
- 기존 online WebSocket 회귀 테스트 통과
- `bot-08-ui-logging-regression-test` 통과
- `bot-09-stabilization-regression-test`에서 public leak, bot setup, consecutive bot turns, bot trade response, pending/dev smoke 확인
- 실제 브라우저 1280x720 smoke에서 console error `0`, horizontal overflow `false`
- 실제 여러 턴 진행은 WebSocket 자동 테스트에서 active seat 0 복귀와 `game.round >= 2`로 확인
