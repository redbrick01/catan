# 턴 안내 시각 효과 테스트 계획

작성일: 2026-05-27

## 목표

`docs/implementation_plans/2026-05-27_turn-guidance-visual-effects-plan.md`에 따라 구현된 턴 안내 시각 효과가 서버 규칙, 봇 로직, pending 처리 흐름을 바꾸지 않고 화면 상태만 명확하게 보강했는지 검증한다.

이번 단위 개발은 Stage 3 UX 개선 중 `UX-004 턴 진행 안내 강화`의 시각 효과 분기 작업으로 관리한다.

## 검증 범위

- 현재 진행자 카드 spotlight
- 내 차례 또는 pending actor의 dice panel pulse
- primary action button glow
- 봇 턴의 낮은 강도 상태 표시
- 대기자 카드의 약한 opacity 처리
- `prefers-reduced-motion: reduce` fallback
- `currentTurnUxState()` 기반 DOM hook 연결
- pending actor가 active player보다 우선 강조되는지 확인

## 제외 범위

- 서버 command 검증 변경
- 게임 규칙 변경
- 봇 의사결정 변경
- pending public view 확장
- 로그 필터 UI
- 전체 화면 강한 dimming
- 대규모 보드 애니메이션

## 자동 검증

필수 검증:

```powershell
node --check script.js
node --check server.js
node --check scripts\stage-3-ux-improvement-static-test.js
node scripts\stage-3-ux-improvement-static-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

추가 검증:

```powershell
node scripts\bot-08-ui-logging-regression-test.js
node scripts\online-10-player-trade-ws-test.js
git diff --check -- script.js styles.css scripts\stage-3-ux-improvement-static-test.js docs\test_plans\2026-05-27_stage-3-ux-improvement-test-plan.md docs\final_reports\2026-05-27_stage-3-ux-improvement-final-report.md docs\features\ui-and-play-assists.md docs\project-status-and-roadmap.md
```

## 정적 검증 항목

- `script.js`에 `data-focus-state` hook이 있다.
- `script.js` 또는 `styles.css`에 `--focus-player-color` hook이 있다.
- primary action button을 위한 `data-primary-action` 또는 `.is-primary-action` marker가 있다.
- `styles.css`에 `prefers-reduced-motion` fallback이 있다.
- 플레이어 카드/좌석 상태 class가 유지된다.
  - `is-current-turn`
  - `is-my-turn`
  - `is-pending-actor`
  - `is-bot-turn`
  - `is-waiting-turn`
- pending 입력 중 일반 action glow가 꺼지는 조건이 있다.
- 봇 턴은 사람 턴과 다른 낮은 강도 표시를 사용한다.

## 브라우저 Smoke 계획

가능하면 로컬 서버를 실행하고 다음을 확인한다.

```powershell
node start-katan.js --no-open
```

확인 URL:

```text
http://localhost:4173/
```

확인 항목:

- 초기 화면에서 `.app` 또는 `.tabletop`에 `data-focus-state`가 설정된다.
- `.board-area`에 `--focus-player-color`가 설정된다.
- `.dice-panel`에 `data-turn-state`가 설정된다.
- CSSOM에서 `prefers-reduced-motion` rule을 확인할 수 있다.
- 화면 진입 시 console fatal error가 없다.

수동 확인 후보:

- 내 차례에서 내 카드와 dice panel이 과하지 않게 강조된다.
- 상대 차례에서 현재 진행자만 spotlight 된다.
- pending actor가 active player보다 우선 강조된다.
- 봇 턴이 사람 턴과 구분된다.
- 320px, 375px, 780px에서 ring/pulse/dot이 버튼이나 텍스트를 밀어내지 않는다.

## 완료 기준

- 필수 자동 검증이 모두 통과한다.
- 시각 효과 marker가 정적 테스트로 확인된다.
- pending/도둑 WebSocket 회귀가 통과해 pending 우선순위 회귀가 없다.
- 봇 안정화 회귀가 통과해 봇 runner 흐름에 영향이 없다.
- 전체 화면을 강하게 어둡게 하지 않는다.
- 반복 애니메이션은 reduced motion 환경에서 제거된다.

## 남은 위험

- 실제 모바일 기기 320px/375px 수동 검증은 별도 QA가 필요하다.
- 플레이 중간 상태별 screenshot 회귀는 아직 자동화하지 않았다.
- board halo는 약하게만 적용했지만, 실제 기기에서 과해 보이면 제거하거나 강도를 낮춘다.
