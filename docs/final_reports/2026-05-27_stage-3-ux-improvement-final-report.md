# Stage 3 UX 개선 최종 보고서

작성일: 2026-05-27

## 목표

3단계 UX 개선 계획서에 따라 규칙 자체를 바꾸지 않고, 사용자가 현재 진행자와 다음 행동을 더 빠르게 이해하도록 UI 상태, 모달 안내, 교환 작성, 오류 문구, 모바일 표시, 로그 강조를 보강했다.

## 구현 요약

### UX-004 턴 진행 안내 강화

- `currentTurnUxState` helper를 추가해 `activePlayer`, `actingPlayer`, `pendingActors`, `viewerPlayer`, `currentFocusPlayer`를 분리했다.
- 강조 우선순위는 방 종료/재접속 대기 같은 blocking 상태, pending actor, active player, 일반 대기 순서로 계산한다.
- 온라인 내 턴은 `내 차례입니다`, pending actor는 `내가 행동할 차례입니다`로 표시한다.
- 오프라인은 `플레이어명 차례입니다` 기준으로 표시한다.
- 상단 dice panel, 가이드 패널, 플레이어 카드/좌석이 같은 현재 진행자를 보도록 연결했다.
- `data-focus-state`, `--focus-player-color`, `data-primary-action` hook을 추가해 텍스트보다 시각 신호가 먼저 보이게 했다.
- 현재 진행자 카드 spotlight, 내 차례/pending actor dice panel pulse, primary action button glow를 추가했다.
- `prefers-reduced-motion: reduce`에서는 반복 애니메이션을 끄고 정적 ring/dot만 유지한다.

### UX-002 pending action 안내 개선

- pending action 모달에 `상황`, `해야 할 일`, `선택 조건`, `완료 후` 구조를 추가했다.
- 카드 버리기, 도둑 이동, 약탈 대상 선택, 대기 모달이 같은 안내 구조를 사용한다.
- pending action이 있을 때 가이드 패널은 모달과 같은 상황을 짧게 요약한다.

### UX-001 교환 제안 작성 UX 개선

- 플레이어 교환 작성 요약에 `대상: 모든 상대`를 명시했다.
- 보유량 부족뿐 아니라 같은 자원을 주고받는 선택도 제출 전에 차단한다.
- 요청자 화면에 모든 상대의 응답 상태를 대기/수락/거절/흥정으로 표시한다.
- 응답자 화면은 `내가 받음` / `내가 줌` 관점으로 문구를 바꿨다.

### UX-006 연결/참가/재접속 안내 개선

- `onlineErrorMessage` 오류 코드 매핑을 확장해 방 코드, 정원, 시작된 방, 만료된 접속 정보, 서버 timeout, socket close/error에 다음 행동을 붙였다.
- WebSocket timeout/close/error에 코드가 붙도록 보강했다.

### UX-005 모바일 레이아웃 재검토

- 모바일에서 dice panel을 sticky로 두어 현재 진행 상태를 더 빨리 볼 수 있게 했다.
- 플레이어 상태 라벨과 pending action guide가 좁은 화면에서 한 열로 정리되도록 보강했다.

### UX-003 게임 로그 강조

- `addLog`에 로그 타입 추론과 타입 class를 추가했다.
- build/trade/dev/robber/score/bot 계열 중요 이벤트는 `is-important`로 강조한다.
- 필터 UI는 이번 1차 범위에서 제외하고 후속 작업으로 남겼다.

## 변경 파일

- `script.js`
- `styles.css`
- `scripts/stage-3-ux-improvement-static-test.js`
- `docs/test_plans/2026-05-27_stage-3-ux-improvement-test-plan.md`
- `docs/final_reports/2026-05-27_stage-3-ux-improvement-final-report.md`
- `docs/features/ui-and-play-assists.md`
- `docs/project-status-and-roadmap.md`

## 검증 결과

실행 및 통과:

```powershell
node --check script.js
node --check server.js
node --check scripts\stage-3-ux-improvement-static-test.js
node scripts\stage-3-ux-improvement-static-test.js
node scripts\online-10-player-trade-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-08-ui-logging-regression-test.js
node scripts\bot-09-stabilization-regression-test.js
```

브라우저 smoke:

- 후속 턴 안내 시각 효과 단위 개발에서 `node start-katan.js --no-open` 기준 로컬 서버 접근을 재확인했다.
- Codex in-app browser에서 `http://localhost:4173/` 초기 화면 smoke를 수행했다.
- `.app`/`.tabletop`의 `data-focus-state`, `.board-area`의 `--focus-player-color`, `.dice-panel`의 `data-turn-state`, `prefers-reduced-motion` rule을 확인했다.

## 미수행 및 남은 후속 작업

- 로그 필터 UI는 이번 구현에서 제외했다. 타입 class와 중요 이벤트 강조가 먼저 들어갔으므로 필터 버튼은 후속으로 분리한다.
- board halo, log flash, bot shimmer, 전체 화면 dimming은 과한 효과가 될 수 있어 후속으로 남겼다.
- 실제 320px/375px/780px 전체 screenshot 검증은 환경이 허용될 때 추가한다.
- 현재 환경에서는 로컬 서버를 브라우저 smoke 동안 안정적으로 유지하지 못해 실제 브라우저 화면 확인은 미수행했다.
- 실제 3인 이상 LAN 브라우저 장시간 플레이는 별도 QA로 남긴다.
