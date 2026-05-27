# PLAYER-HAND-UI 최종 보고서

## 변경 파일
- `index.html`
- `script.js`
- `styles.css`
- `scripts/player-hand-ui-static-test.js`
- `docs/test_plans/2026-05-27_player-hand-ui-test-plan.md`
- `docs/final_reports/2026-05-27_player-hand-ui-final-report.md`

## 구현 내용
- 하단 `playerHandDock` 영역과 `playerResourceHand` 카드 row를 추가했다.
- 오프라인에서는 현재 active player의 자원 5종을 실제 손패 카드 형태로 표시한다.
- 온라인에서는 `game.viewerSeatIndex`를 우선 사용해 viewer hand를 표시하고, viewer를 확정할 수 없으면 dock을 숨기며 stale card를 제거한다.
- 플레이어 좌석 카드와 우측 플레이어 패널에서는 자원 상세 breakdown을 제거하고 총 자원 수만 유지했다.
- 기존 개발 카드 패널은 유지했고, 개발 카드 hand dock이나 카드 사용 interaction은 추가하지 않았다.
- Tabler icon token 체계를 재사용했으며 새 icon/image asset은 추가하지 않았다.
- 모바일 1차 대응은 bottom sheet가 아니라 가로 스크롤 hand row와 겹침 방지 CSS로 처리했다.

## 실행 테스트
- `node --check script.js` 통과
- `node --check server.js` 통과
- `node --check scripts/player-hand-ui-static-test.js` 통과
- `node scripts/game-feel-icon-asset-static-test.js` 통과
- `node scripts/game-feel-quality-gate-static-test.js` 통과
- `node scripts/player-hand-ui-static-test.js` 통과

## 브라우저 검증
- `http://127.0.0.1:4173/?test=1`에서 데스크톱 브라우저 검증을 수행했다.
- 오프라인 게임 시작 후 하단 dock에 자원 카드 5장이 표시되는 것을 확인했다.
- dock이 주사위 패널 및 우측 control panel과 겹치지 않는 것을 확인했다.
- 좌석 카드와 플레이어 row에 자원 타입명이 노출되지 않는 것을 확인했다.

## 미실행 테스트
- 모바일 320/375/390px 실 브라우저 viewport 검증은 미실행했다. 현재 in-app browser 제어 API에서 viewport 크기 변경 기능이 노출되지 않았고, 로컬 프로젝트에는 Playwright 패키지가 설치되어 있지 않았다.
- 온라인 2클라이언트 private state 실검증은 미실행했다. 이번 턴에서는 서버 규칙 변경 없이 클라이언트 렌더링 경계와 정적 패턴, 데스크톱 단일 클라이언트 spot check로 확인했다.

## Private State 검증
- `renderSeats()`에서 본인/상대 모두 `renderResourceSummary(player)`만 사용하도록 변경해 좌석 카드의 자원 타입 노출을 제거했다.
- 우측 플레이어 패널은 기존처럼 총 자원 수만 표시한다.
- hand dock은 viewer를 확정할 수 없을 때 숨기고 내부 카드를 비우도록 구현했다.
- 개발 카드 상세 정보는 이번 범위에서 새로 노출하지 않았다.

## Known Issue 기록
- 별도 known issue 문서는 추가하지 않았다. 모바일 실 브라우저 검증과 온라인 2클라이언트 검증은 남은 위험으로 기록한다.

## 남은 위험
- 실제 320/375/390px 기기에서 주사위 sticky 패널, 모달 action, hand row 간 간격은 추가 수동 QA가 필요하다.
- 온라인 reconnect/hydrate 직후 stale hand 제거는 정적 로직으로 확인했지만, 2클라이언트 실시간 재접속 시나리오는 별도 검증이 필요하다.
