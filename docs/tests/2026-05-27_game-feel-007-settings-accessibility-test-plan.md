# FEEL-007 설정/접근성 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/plans/2026-05-27_game-feel-007-settings-accessibility-plan.md`
- 변경 파일:
  - `index.html`
  - `script.js`
  - `styles.css`
  - `scripts/game-feel-settings-static-test.js`

## 자동 테스트 항목

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`

## 수동 및 브라우저 테스트 항목

- the game screen and confirm the `효과 설정` button is visible in the action panel. 열기.
- the settings modal. 열기.
- radio groups, toggles, and volume range are keyboard reachable. 확인.
- motion mode를 `reduced`로 바꾸고 `document.documentElement.dataset.effectiveMotion`이 업데이트되는지 확인한다.
- sound enabled와 volume을 바꾸고 `localStorage.catanFeelSettings`가 업데이트되는지 확인한다.
- Escape를 눌러 modal이 닫히고 focus가 설정 버튼으로 돌아오는지 확인한다.
- the setup screen and offline game start still work. 확인.
- blocking online modals are not replaced by the settings modal. 확인.

## Accessibility Checks

- control에는 보이는 label이 있다.
- radio group은 fieldset/legend로 묶인다.
- toggle 및 range control은 현재 값을 노출한다.
- 모션 감소 상태가 text 또는 status 정보를 제거하지 않는다.
- sound-off 기본값이 visual/text 정보를 제거하지 않는다.

## 통과 기준

- 정적 테스트가 통과한다.
- 설정 schema는 잘못된 localStorage data에서도 복구된다.
- `motionMode: auto` follows OS reduced-motion.
- 명시적 `motionMode: on`은 OS 모션 감소 설정을 override한다.
- 설정은 전역 사용자 선호이며 game 또는 online state를 변경하지 않는다.
- 모든 브라우저/tooling 제약은 최종 보고서에 기록한다.
