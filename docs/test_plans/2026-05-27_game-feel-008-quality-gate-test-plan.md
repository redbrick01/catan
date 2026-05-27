# FEEL-008 품질 게이트 테스트 계획

작성일: 2026-05-27

## 범위

새 게임플레이 기능을 추가하지 않고 FEEL-000부터 FEEL-006B까지의 전체 품질 게이트를 수행한다. cue 중복 방지, 비공개 상태 보호, 모션 감소, 사운드 설정, reconnect/hydrate 억제, 데스크톱/모바일 레이아웃 위험을 확인한다.

## 원천 보고서 검토

FEEL-000부터 FEEL-006B까지의 최종 보고서에서 아래 항목만 추출한다.

- 변경 파일
- 미실행 테스트
- 남은 위험

추출한 위험을 기준으로 추가 정적 헬퍼 테스트나 알려진 이슈 기록이 필요한지 판단한다.

## 자동 테스트

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`
- `node scripts/game-feel-turn-state-static-test.js`
- `node scripts/game-feel-dice-seed-static-test.js`
- `node scripts/game-feel-action-result-static-test.js`
- `node scripts/game-feel-robber-pending-static-test.js`
- `node scripts/game-feel-icon-asset-static-test.js`
- `node scripts/game-feel-sound-static-test.js`
- `node scripts/game-feel-sound-event-mapping-static-test.js`
- `node scripts/game-feel-quality-gate-static-test.js`

## 프로젝트 회귀 테스트

- `node scripts/stage-3-ux-improvement-static-test.js`
- `node scripts/online-10-1-player-trade-ui-static-test.js`
- `node scripts/bot-08-ui-logging-regression-test.js`
- `node scripts/bot-09-stabilization-regression-test.js`
- `node scripts/online-08-basic-building-ws-test.js`
- `node scripts/online-09-bank-trade-ws-test.js`
- `node scripts/online-10-player-trade-ws-test.js`
- `node scripts/online-11-development-cards-ws-test.js`
- `node scripts/online-12-robber-seven-pending-ws-test.js`

## 브라우저 스모크

- `http://127.0.0.1:4173/?test=1`을 시작하거나 기존 서버를 재사용한다.
- 데스크톱 viewport에서 로드, 콘솔 오류, 핵심 레이아웃 표시, 사운드 기본 꺼짐 상태를 확인한다.
- 오프라인 게임을 시작하고 설정 모달을 열어 모달이 viewport 안에 들어오는지 확인한다.
- 약 390px 너비의 모바일 viewport에서 가로 overflow와 설정 모달 맞춤 상태를 확인한다.

## 게이트 체크리스트

- 같은 cue key가 visual/sound 채널을 다시 재생하지 않는다.
- hydrate/reconnect snapshot은 과거 cue 재생을 억제한다.
- 상대 생산, observer 도둑 결과, 개발 카드 구매 cue는 generic/private-safe 상태를 유지한다.
- 모션 감소 설정과 CSS fallback이 존재한다.
- 사운드는 기본 꺼짐이며 sound off와 volume 0에서 재생을 건너뛴다.
- 누락된 사운드 자산은 안전하게 skip된다.
- 사운드가 꺼져 있어도 텍스트/시각 cue는 유지된다.
- 모달과 핵심 컨트롤에서 릴리스 차단 수준의 데스크톱/모바일 overflow가 보이지 않는다.

## 통과 기준

- 모든 자동 테스트가 통과한다.
- 브라우저 스모크에서 콘솔 오류나 릴리스 차단 레이아웃 문제가 없다.
- 비공개 상태 노출이나 cue 재생 반복 버그가 발견되지 않는다.
- 남은 비차단 제약은 최종 보고서에 기록한다.
