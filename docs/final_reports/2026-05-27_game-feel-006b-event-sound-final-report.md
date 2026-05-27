# FEEL-006B 이벤트 사운드 최종 보고서

작성일: 2026-05-27

## 목표

FEEL cue eventType을 비공개 상태에 안전한 사운드 후보에 연결하고, FEEL-006A의 사운드 설정, cue 중복 방지, reconnect/hydrate 억제를 유지한다.

## 관련 문서

- `docs/implementation_plans/2026-05-27_game-feel-006-sound-system-plan.md`
- `docs/test_plans/2026-05-27_game-feel-006b-event-sound-test-plan.md`
- `docs/final_reports/2026-05-27_game-feel-006a-sound-foundation-final-report.md`
- `docs/final_reports/2026-05-27_game-feel-005-icon-asset-system-final-report.md`

## 변경 파일

- `script.js`
  - `SOUND_EVENT_MAP`과 `SOUND_ASSET_KEYS`를 추가했다.
  - `soundPrivacyForCue()`와 `soundAssetForCue()`를 추가했다.
  - `mapCueToSound()`와 `playSoundCue()`가 사운드 설정, category toggle, 누락 자산, private-safe generic 분기를 준수하도록 업데이트했다.
  - `window.__katanFeelTest`에 사운드 매핑 helper를 노출했다.
- `scripts/game-feel-sound-event-mapping-static-test.js`
  - FEEL-006B 매핑, privacy, 누락 자산, category toggle, hydrate 억제, 실행형 helper 점검을 추가했다.
- `docs/implementation_plans/2026-05-27_game-feel-006-sound-system-plan.md`
  - FEEL-006B 구현 메모를 추가했다.
- `docs/test_plans/2026-05-27_game-feel-006b-event-sound-test-plan.md`
  - 테스트 계획을 추가했다.
- `docs/final_reports/2026-05-27_game-feel-006b-event-sound-final-report.md`
  - 최종 보고서를 추가했다.

## eventType별 사운드 매핑

- `turnChanged -> turn-bell`
- `diceRolled -> dice-roll`
- `resourcesProduced -> resource-gain`, sanitize된 resource detail이 보이지 않을 때는 `card-gain`
- `blockedProduction -> blocked-soft`
- `buildCompleted -> build-success`
- `bankTradeCompleted -> trade-success`
- `playerTradeCompleted -> trade-success`
- `devCardBought -> card-flip`
- `devCardPlayed -> card-play`
- `sevenRolled -> robber-alert`
- `discardPendingStarted -> robber-alert`
- `robberMovePendingStarted -> robber-alert`
- `robberVictimPendingStarted -> robber-alert`
- `robberMoved -> robber-move`
- `robberResult -> robber-result`
- `winnerDeclared -> win-fanfare`
- `commandRejected -> error-soft`

## 비공개 상태 검토

- 상대 생산 cue는 구체 resource type을 sound mapping 전에 제거하고 generic `card-gain`을 사용한다.
- observer 도둑 결과 cue는 구체 stolen resource type을 제거하고 `generic-robber` privacy를 사용한다.
- 개발 카드 구매 cue는 card type 필드를 삭제하고 `generic-card` privacy를 사용한다.
- 공개 개발 카드 사용은 card type이 이미 공개된 뒤에만 public-card privacy를 사용할 수 있다.
- sound off 상태에서도 기존 text, log, guide, status, visual cue 경로가 유지된다.

## 자산 및 라이선스 판단

새 사운드 파일은 추가하지 않았다. FEEL-006B는 asset key와 mapping 동작만 정의하므로 `docs/assets_manifest.md`는 만들거나 수정하지 않았다.

## 테스트 결과

| 테스트 | 결과 |
| --- | --- |
| `node --check script.js` | 통과 |
| `node --check server.js` | 통과 |
| `node scripts/game-feel-cue-dedupe-static-test.js` | 통과 |
| `node scripts/game-feel-settings-static-test.js` | 통과 |
| `node scripts/game-feel-sound-static-test.js` | 통과 |
| `node scripts/game-feel-turn-state-static-test.js` | 통과 |
| `node scripts/game-feel-dice-seed-static-test.js` | 통과 |
| `node scripts/game-feel-robber-pending-static-test.js` | 통과 |
| `node scripts/game-feel-action-result-static-test.js` | 통과 |
| `node scripts/game-feel-icon-asset-static-test.js` | 통과 |
| `node scripts/game-feel-sound-event-mapping-static-test.js` | 통과 |

## 미실행 항목

- 실제 audible playback과 브라우저 autoplay/unlock QA는 이 단계에서 licensed sound file을 추가하지 않아 실행하지 않았다.
- 다중 클라이언트 audible reconnect/hydrate 스모크는 실행하지 않았다. 정적 커버리지는 hydrate 억제 연결을 검증한다.

## 남은 위험

- 향후 licensed sound asset을 연결할 때 manifest 검토, 실제 브라우저 재생 QA, 볼륨 밸런스 튜닝이 필요하다.
- 정적 테스트는 연결과 privacy 분기를 검증하지만, 체감 사운드 품질은 판단하지 않는다.

## 최종 판단

완료.
