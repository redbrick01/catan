# FEEL-006B 이벤트 사운드 매핑 최종 보고서

작성일: 2026-05-27

## 목표

FEEL cue eventType을 비공개 상태에 안전한 사운드 후보에 연결하고, sound off 기본값, 누락 asset 안전성, reconnect/hydrate 중복 방지 동작을 유지한다.

## 참고 문서

- `docs/guides/development-process-guideline.md`
- `docs/plans/2026-05-27_game-feel-006-sound-system-plan.md`
- FEEL-006A 및 FEEL-005 최종 보고서

## 관련 테스트 계획

- `docs/tests/2026-05-27_game-feel-006b-event-sound-mapping-test-plan.md`

## 변경 파일

- `script.js`
  - `SOUND_EVENT_MAP`과 `SOUND_ASSET_KEYS`를 추가했다.
  - `soundPrivacyForCue()`와 `soundAssetForCue()`를 추가했다.
  - `mapCueToSound()`가 asset, category, privacy, volume scale, event type, availability, category-disabled 상태를 반환하도록 업데이트했다.
  - `playSoundCue()`가 audio unlock/asset 확인 전에 category-disabled mapping을 반영하도록 업데이트했다.
  - 사운드 매핑과 asset key를 FEEL 테스트 helper로 노출했다.
- `scripts/game-feel-sound-event-mapping-static-test.js`
  - FEEL-006B 매핑과 privacy 정적 커버리지를 추가했다.
- `docs/plans/2026-05-27_game-feel-006-sound-system-plan.md`
  - FEEL-006B 구현 범위 메모를 추가했다.
- `docs/tests/2026-05-27_game-feel-006b-event-sound-mapping-test-plan.md`
  - 이 단계의 테스트 계획을 추가했다.

## 사운드 매핑 요약

- 턴: `turnChanged -> turn-bell`, `turnSoundEnabled` 설정을 따른다.
- 주사위/자원/차단: `dice-roll`, `resource-gain`, `card-gain`, `blocked-soft`.
- 행동: `build-success`, `trade-success`, `card-flip`, `card-play`.
- 도둑/7/pending: `robber-alert`, `robber-move`, `robber-result`, `importantEventSoundEnabled` 설정을 따른다.
- 승리/오류: `win-fanfare`, `error-soft`, `importantEventSoundEnabled` 설정을 따른다.

## 비공개 상태 검토

- sanitize된 `resourceType`이 없는 `resourcesProduced`는 generic `card-gain`으로 매핑된다.
- sanitize된 `resourceType`이 없는 `robberResult`는 `generic-robber`로 분류된다.
- `devCardBought`는 잘못된 payload detail과 무관하게 `generic-card`로 분류된다.
- `devCardPlayed`는 공개 card type이 있을 때만 public-card privacy를 사용할 수 있다.

## 자산 및 라이선스 판단

새 사운드 파일 자산은 추가하지 않았다. 알려진 asset key 목록은 향후 licensed asset 이름만 정의하며, 현재 재생은 asset이 없으면 안전하게 `skipped-no-asset`을 반환한다. `docs/assets_manifest.md`는 의도적으로 만들지 않았다.

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
| `http://localhost:4173/` 브라우저 스모크 | 앱 로드됨, hook 검사는 제한됨 |
| `git diff --check` | 기존 LF-to-CRLF 경고만 있고 통과 |

## 브라우저 참고 사항

- 앱은 `http://localhost:4173/`에서 로드되었다.
- reload 이후 인앱 브라우저 평가 표면에서 `window.__catanFeelTest`가 보이지 않아 test-hook 검사는 제한되었지만, 앱 렌더링은 정상이었다. 매핑 동작은 정적 테스트가 커버한다.
- 사운드 asset을 번들하지 않았으므로 실제 audible playback은 기대하지 않았다.

## 미실행 항목

- FEEL-006B는 licensed sound asset을 추가하지 않으므로 실제 audible playback과 브라우저 autoplay/unlock QA는 실행하지 않았다.
- 다중 클라이언트 reconnect/hydrate audible smoke는 실행하지 않았다. 정적 커버리지는 hydrate 억제 연결을 검증한다.

## 남은 위험

- 향후 사운드 파일 통합 시 manifest/license 검토와 실제 브라우저 재생 QA가 필요하다.
- 실제 asset이 생기기 전에는 정확한 볼륨 밸런스와 반복 피로도를 판단할 수 없다.

## 최종 판단

완료.
