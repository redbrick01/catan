# FEEL-002 주사위 굴림 모션 수정 최종 보고서

작성일: 2026-05-27

## 목표

FEEL-002의 CSS 3D 주사위 표시를 보강해 `animationSeed` 또는 `rollId`가 실제 굴림 모션 parameter에 반영되도록 수정한다. 주사위 결과 결정 방식과 온라인 서버 권위 원칙은 유지한다.

## 참고 문서

- `docs/guides/development-process-guideline.md`
- `docs/features/development-process.md`
- `docs/plans/2026-05-27_game-feel-visual-audio-motion-plan.md`
- `docs/plans/2026-05-27_game-feel-002-dice-production-feedback-plan.md`
- `docs/reports/2026-05-27_game-feel-002-dice-production-feedback-final-report.md`
- `docs/plans/2026-05-27_game-feel-002-dice-motion-remediation-plan.md`

## 변경 파일

- `script.js`
  - `makeDiceRollKey()`, `hashStringToUint32()`, `seededRange()`, `makeDiceMotionStyle()` 추가.
  - `renderDieCube()`를 `dice-motion-shell > dice-cube` 구조로 변경.
  - `pointerdown` 동안 `dice-pressing` preview cube를 표시하고, `pointerup/cancel/blur`에서 정리.
  - 온라인 roll command pending 동안 `onlineSession.diceRollPending` 상태를 켜고 해제.
  - test helper에 dice motion style helper와 seeded forced roll 지원 추가.
- `styles.css`
  - `.dice-motion-shell` 추가.
  - seeded CSS custom properties를 사용하는 `dice-seeded-roll` keyframes 추가.
  - hold 중 계속 회전하는 `dice-hold-spin` keyframes 추가.
  - final face transform은 `.dice-cube`, roll/settle animation은 `.dice-motion-shell`로 분리.
  - reduced-motion override를 dice motion shell까지 확장.
- `scripts/game-feel-dice-seed-static-test.js`
  - seed-to-style 연결, motion shell, rolling pending, reduced-motion selector 검증 보강.
- `docs/tests/2026-05-27_game-feel-002-dice-motion-remediation-test-plan.md`
  - 테스트 계획 추가.
- `docs/reports/2026-05-27_game-feel-002-dice-motion-remediation-final-report.md`
  - 최종 보고서 추가.

## 구현 요약

기존에는 `.dice-cube` 하나가 final face transform과 settle animation을 모두 담당했다. 이번 수정에서는 wrapper인 `.dice-motion-shell`을 추가해 seed 기반 회전, scale, settle animation을 담당하게 하고, 내부 `.dice-cube`는 결과 face transform만 담당하게 분리했다.

`animationSeed`, `rollId`, 주사위 값으로 deterministic CSS custom properties를 만든다. 같은 seed와 결과는 같은 motion parameter를 만들고, 다른 seed는 다른 회전 시작값과 duration을 만든다.

주사위 버튼을 누르고 있는 동안은 결과를 선표시하지 않고 `dice-pressing` 상태의 preview cube가 `dice-hold-spin`으로 계속 회전한다. 손을 떼면 기존 roll flow가 실행되어 결과값과 seed 기반 settle motion으로 이어진다.

온라인 roll은 명령 전송 중 `diceRollPending`을 켜서 rolling 상태를 표현하고, 서버 state 또는 오류 처리 후 해제한다. 최종 숫자와 face는 계속 서버 state의 `lastDice` 기준으로 표시한다.

## 테스트 결과

| 테스트 | 결과 |
| --- | --- |
| `node --check script.js` | 통과 |
| `node --check server.js` | 통과 |
| `node scripts/game-feel-dice-seed-static-test.js` | 통과 |
| `node scripts/game-feel-settings-static-test.js` | 통과 |
| `node scripts/game-feel-turn-state-static-test.js` | 통과 |

## 브라우저 확인

`http://127.0.0.1:4173/?test=1`에서 오프라인 게임을 시작하고 초기 배치를 완료한 뒤 주사위를 굴렸다.

확인 결과:

- roll button이 활성화된 뒤 주사위 굴림이 실행됐다.
- `dieOne=4`, `dieTwo=1`, `diceTotal=5` 상태에서 `aria-label`, fallback text, DOM 값이 일치했다.
- `#dieOne .dice-motion-shell`이 렌더링됐다.
- computed style에서 `animationName = dice-seeded-roll`, `animationDuration = 0.768s`가 확인됐다.
- inline CSS 변수로 `--dice-roll-x-start`, `--dice-roll-y-start`, `--dice-roll-duration`이 적용됐다.
- `.dice-cube` final transform은 결과 face와 분리되어 유지됐다.
- `pointerdown` 경로에서 `aria-label = 주사위 굴리는 중` preview cube가 생성되고, release 후 정리되는 것을 확인했다.

## 미실행 항목

- 온라인 2클라이언트 rolling pending 시각 QA는 이번 실행에서 수행하지 못했다.
- reduced-motion 브라우저 emulation은 정적 selector 검증으로 대체했다.

## 남은 위험

- 온라인 reconnect 직후 과거 motion 반복 여부는 실제 2클라이언트 환경에서 추가 확인이 필요하다.
- CSS 3D face 방향은 한 번의 실제 굴림으로 확인했으며, 1~6 전체 face의 스크린샷 매핑 회귀는 후속 QA에서 더 넓게 확인하는 편이 좋다.

## 최종 판단

완료. FEEL-002 주사위 굴림 모션은 이제 seed-derived CSS variables를 실제 animation에 사용하며, final face transform과 roll animation 책임이 분리되었다.
