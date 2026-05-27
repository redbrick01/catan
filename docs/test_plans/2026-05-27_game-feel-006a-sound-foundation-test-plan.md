# FEEL-006A 사운드 기반 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/implementation_plans/2026-05-27_game-feel-006-sound-system-plan.md`
- 변경 파일:
  - `script.js`
  - `scripts/game-feel-sound-static-test.js`

## 자동 테스트 항목

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`
- `node scripts/game-feel-sound-static-test.js`

## 수동 테스트 항목

- sound defaults to off in the settings modal. 확인.
- 사운드를 켜고 runtime이 사용자 gesture 기반 unlock을 시도할 수 있는지 확인한다.
- 볼륨을 0으로 설정하고 sound cue가 muted로 skip되는지 확인한다.
- missing sound assets do not throw and do not block gameplay. 확인.
- sound-off state does not remove text or visual information. 확인.

## Safety And Privacy Checks

- sound cue mapping은 FEEL-000 cue sanitize 이후에만 실행된다.
- `devCardBought` remains generic.
- 상대 생산과 도둑 observer cue는 generic으로 유지된다.
- reconnect/hydrate 억제는 FEEL-000 cue key로 계속 제어된다.

## 통과 기준

- 모든 정적 테스트가 통과한다.
- `playSoundCue()` returns safe status strings instead of throwing.
- 사운드 설정은 FEEL-007 설정 helper로 저장된다.
- new sound asset is required for FEEL-006A. 없음.
