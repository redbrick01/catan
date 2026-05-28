# 턴 안내 시각 효과 구현 최종 보고서

작성일: 2026-05-27

브랜치: `codex-turn-guidance-visual-effects-docs`

## 작업 배경

기존 Stage 3 UX 개선에서 턴 안내 문구와 가이드 패널을 보강했지만, 텍스트가 많아지면 오히려 현재 진행 상태를 빠르게 파악하기 어렵다는 피드백이 있었다. 이에 따라 별도 계획서인 `docs/plans/2026-05-27_turn-guidance-visual-effects-plan.md`를 기준으로, 텍스트를 늘리지 않고 현재 진행자와 행동 필요 상태를 시각적으로 드러내는 작업을 독립 단위 개발로 분기했다.

## 목표

- 현재 진행자, 내 차례, pending actor, 봇 진행 중 상태가 시각적으로 즉시 보이게 한다.
- 기존 `currentTurnUxState()` 계산을 기준으로 DOM hook과 CSS 효과를 연결한다.
- 서버 규칙, command 검증, 봇 runner와 의사결정은 변경하지 않는다.
- 전체 화면을 강하게 어둡게 하지 않고, 읽기 쉬운 약한 강조만 적용한다.
- `prefers-reduced-motion` 환경에서는 반복 애니메이션을 끈다.

## 구현 요약

### 1. DOM Hook 연결

- `.app`, `.tabletop`, `.board-area`에 `data-focus-state="{kind}"`를 부여하도록 했다.
- `.board-area`와 상위 컨테이너에 `--focus-player-color`를 설정한다.
- focus player가 있으면 해당 플레이어 색을 사용하고, blocking 상태나 focus player가 없을 때는 기본 warning/default 색을 사용한다.
- 기존 dice panel의 `data-turn-state` 흐름을 유지하면서 `currentTurnUxState()` 결과와 일관되게 연결했다.

### 2. 플레이어 카드와 좌석 강조

- 기존 상태 class를 유지하고 CSS 효과를 연결했다.
  - `is-current-turn`
  - `is-my-turn`
  - `is-pending-actor`
  - `is-bot-turn`
  - `is-waiting-turn`
- 현재 진행자는 얇은 spotlight ring과 약한 shadow로 표시한다.
- 내 차례 카드는 약 `+5~8%` 수준의 brightness 강조를 적용했다.
- pending actor는 active player보다 우선 보이도록 green ring과 dot pulse를 적용했다.
- 대기자는 opacity를 약하게만 낮춰 가독성을 유지했다.
- 봇 턴은 dashed/ring/dot 계열의 낮은 강도 표시로 사람 턴과 구분했다.

### 3. Dice Panel Pulse

- `data-turn-state="my-turn"`과 `data-turn-state="action-needed"`에서 약한 pulse를 표시한다.
- `bot-turn`은 과한 shimmer 없이 낮은 강도 ring으로 표시한다.
- `blocking`은 warning 계열 ring으로 구분한다.
- pending action 중에는 모달이 1차 안내를 맡고, dice panel은 보조 시각 신호만 제공한다.

### 4. Primary Action Button Glow

- 현재 가능한 주요 행동 버튼에 `data-primary-action`과 `.is-primary-action` 계열 marker를 부여한다.
- 주사위 전에는 주사위 버튼을 primary로 표시한다.
- 주사위 후에는 선택된 건설/교환/개발 카드 버튼을 primary로 표시하고, 턴 넘기기 버튼은 soft 강조만 사용한다.
- pending 입력 중, 강제 action 중, 봇 턴, 대기 상태에서는 일반 action glow를 끈다.
- 여러 버튼이 동시에 과하게 빛나지 않도록 primary/soft 강도를 분리했다.

### 5. Reduced Motion 대응

- `@media (prefers-reduced-motion: reduce)`에서 반복 pulse/glow animation을 제거한다.
- reduced motion 환경에서도 ring, dot, border 같은 정적 상태 표시는 유지한다.

### 6. 문서와 테스트 보강

- Stage 3 UX 테스트 계획과 최종 보고서에 턴 시각 효과 검증 항목을 추가했다.
- `docs/features/ui-and-play-assists.md`에 시각 효과 기반 턴 안내를 반영했다.
- `docs/overview/status-and-roadmap.md`의 UI/플레이 보조 상태를 갱신했다.
- `scripts/stage-3-ux-improvement-static-test.js`에 시각 효과 marker 검증을 추가했다.

## 변경 파일

- `script.js`
- `styles.css`
- `scripts/stage-3-ux-improvement-static-test.js`
- `docs/tests/2026-05-27_stage-3-ux-improvement-test-plan.md`
- `docs/reports/2026-05-27_stage-3-ux-improvement-final-report.md`
- `docs/features/ui-and-play-assists.md`
- `docs/overview/status-and-roadmap.md`
- `docs/tests/2026-05-27_turn-guidance-visual-effects-test-plan.md`
- `docs/reports/2026-05-27_turn-guidance-visual-effects-final-report.md`

## 실행한 검증

모두 통과:

```powershell
node --check script.js
node --check server.js
node --check scripts\stage-3-ux-improvement-static-test.js
node scripts\stage-3-ux-improvement-static-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
node scripts\bot-08-ui-logging-regression-test.js
node scripts\online-10-player-trade-ws-test.js
```

공백 검사:

```powershell
git diff --check -- script.js styles.css scripts\stage-3-ux-improvement-static-test.js docs\tests\2026-05-27_stage-3-ux-improvement-test-plan.md docs\reports\2026-05-27_stage-3-ux-improvement-final-report.md docs\features\ui-and-play-assists.md docs\overview/status-and-roadmap.md
```

결과:

- 공백 오류 없음
- `script.js`, `styles.css`의 LF/CRLF 변환 경고만 확인

브라우저 smoke:

```powershell
node start-catan.js --no-open
```

확인 URL:

```text
http://localhost:4173/
```

확인 결과:

- 페이지 제목: `Catan`
- `.app` focus state: `action-needed`
- `.tabletop` focus state: `action-needed`
- `.board-area` focus color: `#f4c460`
- `.dice-panel` turn state: `action-needed`
- `prefers-reduced-motion` CSS rule 확인

## 미수행 항목과 이유

- 실제 320px/375px/780px 전체 screenshot 저장은 수행하지 않았다. 이번 검증은 정적 marker, WebSocket 회귀, 브라우저 초기 smoke 중심으로 진행했다.
- 실제 플레이 중간 상태별 시각 검증은 자동화하지 않았다. 현재 작업은 서버 상태 변경 없이 DOM hook과 CSS 효과를 붙이는 범위였기 때문에, 회귀 테스트와 초기 smoke로 1차 안정성을 확인했다.
- Edge/Safari/모바일 실기기 검증은 후속 QA 범위로 남긴다.

## 남은 후속 작업

- 모바일 viewport screenshot 회귀를 추가한다.
- 실제 플레이 중 내 차례, 상대 차례, pending actor, 봇 턴 상태별 screenshot fixture를 만든다.
- board halo가 실제 기기에서 과해 보이면 더 낮추거나 제거한다.
- 로그 flash와 로그 필터 UI는 별도 작업으로 분리한다.

## 판정

이번 단위 개발은 완료로 판정한다.

- 서버 규칙과 봇 로직 변경 없음
- 필수 자동 검증 통과
- 관련 WebSocket 회귀 통과
- 브라우저 초기 smoke 통과
- reduced motion fallback 반영
- 시각 효과 작업을 별도 테스트 계획과 최종 보고서로 문서화 완료
