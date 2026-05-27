# FEEL-002 주사위/생산 피드백 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/implementation_plans/2026-05-27_game-feel-002-dice-production-feedback-plan.md`
- 변경 파일:
  - `script.js`
  - `server.js`
  - `styles.css`
  - `scripts/game-feel-dice-seed-static-test.js`

## 자동 테스트 항목

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`
- `node scripts/game-feel-sound-static-test.js`
- `node scripts/game-feel-turn-state-static-test.js`
- `node scripts/game-feel-dice-seed-static-test.js`

## 수동 및 브라우저 테스트 항목

- 오프라인 모드에서 주사위를 굴리고 두 3D 주사위가 텍스트 합계와 일치하는지 확인한다.
- long and short button holds produce different animation seed material. 확인.
- keyboard click fallback still rolls. 확인.
- online roll sends `clientHoldMs` and `clientEntropy`, but server result remains authoritative. 확인.
- resource recipients get a generic bump without exposing opponent resource types. 확인.
- reduced-motion suppresses dice settle/resource bump animations while keeping numbers visible. 확인.

## Privacy Checks

- 상대 생산 cue는 dispatch 전에 FEEL-000에서 sanitize된다.
- 온라인 생산 view는 계속 서버의 viewer-safe production을 사용한다.
- FEEL-006B 전까지 숨겨진 상대 상세의 sound cue mapping은 generic으로 유지된다.

## 통과 기준

- 정적 테스트가 통과한다.
- 서버 굴림 결과가 권위 상태로 유지된다.
- 주사위 면 매핑과 합계가 일관된다.
- 시각 QA를 실행할 수 없으면 브라우저 제약을 문서화한다.
