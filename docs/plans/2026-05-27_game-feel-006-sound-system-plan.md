# FEEL-006 사운드 효과 시스템 계획
 

## 2026-05-27 FEEL-006A 구현 범위 업데이트

- `script.js`
  - `audioRuntime`, `enableSoundEffects()`, `playSoundCue()`, `setSoundVolume()`, `getAudioRuntimeState()`, `mapCueToSound()`, `preloadSoundAssets()`, and `stopAllSounds()`. 추가.
  - Connected FEEL-000 sound channel dispatch to `playSoundCue()`.
  - Preserved sound-off default and safe skip results for disabled, muted, locked, and missing asset states.
  - Connected the FEEL-007 sound toggle and volume range to the sound runtime foundation.
- `scripts/game-feel-sound-static-test.js`
  - coverage for disabled/muted/locked/no-asset sound behavior and channel result recording. 추가.

FEEL-006A does not add sound assets or event-specific playback. Asset mapping and event-level sound choices remain assigned to FEEL-006B.
작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

선택적 효과음으로 행동 리듬을 강화하되, 사운드가 없어도 정보 손실이 없게 한다.

## 분리 구현

### FEEL-006A 사운드 설정/오디오 기반

- 사운드 기본값 끄기
- `효과음 켜기` 사용자 gesture 이후 AudioContext 또는 audio asset 활성화
- mute/volume 설정
- `catanFeelSettings` 저장
- 사운드 재생 wrapper
- asset이 없어도 오류 없이 동작하는 no-op wrapper
- FEEL-000 sound channel 결과와 연결

### FEEL-006B 이벤트별 사운드 연결

- 내 차례
- 주사위
- 건설 성공
- 교환 성공
- 개발 카드
- 7/도둑
- 오류
- 승리
- eventType별 sound mapping
- private-safe generic/resource-specific 분기
- asset manifest와 라이선스 검증

### 단계별 완료 기준

FEEL-006A 완료 기준:

- 사운드 기본값은 off이다.
- settings persistence가 동작한다.
- 사용자 gesture 없이 실제 재생을 시도하지 않는다.
- `enableSoundEffects()`가 성공/실패/잠김 상태를 반환한다.
- `playSoundCue()`가 asset이 없어도 예외를 던지지 않는다.
- sound off, volume 0, locked 상태에서 `skipped` 결과를 반환한다.

FEEL-006B 완료 기준:

- eventType별 sound mapping이 정의된다.
- asset이 있는 cue만 재생하고, 없는 cue는 `skipped-no-asset`으로 기록한다.
- private state 기준에 따라 resource-specific/generic sound가 분기된다.
- reconnect/hydrate snapshot에서 과거 sound가 재생되지 않는다.
- 신규 sound asset은 `docs/assets_manifest.md`에 기록된다.

## private state 기준

- viewer가 모르는 정보는 사운드로도 구분하지 않는다.
- 상대 생산, 상대 약탈 결과, 상대 개발 카드 구매는 generic sound만 사용한다.
- `resourcesProduced`에서 viewer 본인은 자원별 sound를 사용할 수 있지만, observer는 generic card/resource gain만 사용한다.
- `robberResult`에서 actor/victim은 실제 resource sound를 사용할 수 있지만, observer는 generic robbery sound만 사용한다.
- `devCardBought`는 항상 generic card sound만 사용한다.
- `devCardPlayed`는 공개된 카드 종류만 카드별 sound 후보가 될 수 있다.
- `yearPlenty`와 `monopoly`는 viewer별 sanitize 결과를 따른다. observer에게 선택 resource를 암시하는 sound를 재생하지 않는다.

## 구현 후보

- `script.js`
  - `loadFeelSettings()`
  - `saveFeelSettings()`
  - `enableSoundEffects()`
  - `playSoundCue(cue)`
  - `setSoundVolume(value)`
  - `getAudioRuntimeState()`
  - `mapCueToSound(cue, viewerState)`
  - `preloadSoundAssets(manifest)`
  - `stopAllSounds()`

## 완료 기준

- 사용자 명시 동작 없이 사운드가 재생되지 않는다.
- mute/volume이 즉시 반영된다.
- dedupe key로 중복 재생이 막힌다.
- 사운드 off에서도 모든 정보가 텍스트/시각으로 제공된다.
- sound wrapper 실패가 게임 진행을 막지 않는다.
- sound off 상태에서 발생한 cue는 나중에 sound on으로 바꿔도 소급 재생되지 않는다.
- reconnect/hydrate snapshot에서 과거 sound가 재생되지 않는다.

## 테스트 초안

- 기본 설정에서 사운드 off.
- enable 이후 cue sound 호출 가능.
- 같은 cue key 중복 호출 시 1회만 재생.
- private state cue에서 자원별 sound 미사용.
- 사용자 gesture 없이 enable 시도 시 locked/skipped 처리.
- AudioContext 생성 실패 또는 asset preload 실패 시 게임 진행 유지.
- asset 없는 cue가 `skipped-no-asset`으로 처리.
- mute 중 cue 발생 후 sound on으로 바꿔도 과거 cue 미재생.
- volume 0에서 `skipped-muted` 또는 무음 재생 정책이 일관됨.
- `resourcesProduced` observer는 resource-specific sound를 사용하지 않음.
- `robberResult` observer는 stolen resource sound를 사용하지 않음.
- reconnect hydrate snapshot에서 sound channel이 실행되지 않음.
- rapid duplicate cue가 sound 폭발을 만들지 않음.
- sound settings가 localStorage `catanFeelSettings`에 저장/복구됨.

## 세부 설계

### 설정 상태

```js
{
  soundEnabled: false,
  soundVolume: 60,
  turnSoundEnabled: true,
  importantEventSoundEnabled: true
}
```

전체 설정은 `catanFeelSettings` 안에 저장한다.

### Runtime audio 상태

사용자 설정과 실제 오디오 런타임 상태는 분리한다.

```js
{
  enabledByUser: false,
  unlocked: false,
  ready: false,
  backend: "none" | "webAudio" | "htmlAudio",
  loadedAssets: {},
  lastError: null
}
```

예:

- `soundEnabled: true`여도 브라우저가 AudioContext unlock을 막으면 `unlocked: false`이다.
- `soundVolume: 0`은 설정상 sound on일 수 있지만 재생 결과는 muted/skipped로 기록할 수 있다.
- asset이 아직 없으면 `ready: true`일 수 있어도 개별 cue는 `skipped-no-asset`이다.

### Audio backend 기준

1차는 아래 둘 중 하나를 선택한다.

| 방식 | 장점 | 주의 |
| --- | --- | --- |
| `<audio>` element pool | 구현 단순, 짧은 asset 재생에 충분 | 동시 재생/짧은 반복 제어가 제한적 |
| Web Audio API | volume/gain/reuse 제어가 좋음 | AudioContext unlock과 asset decode 처리 필요 |

현 프로젝트는 sound 런타임이 아직 없으므로 006A에서는 backend를 `none`으로 둔 no-op wrapper를 먼저 허용한다. 실제 asset 연결은 006B에서 진행한다.

### Sound cue 객체

```js
{
  type: "turnBell",
  key: "room:rev:event:entity:detail",
  privacy: "viewer-safe",
  asset: "turn-bell",
  category: "turn" | "action" | "alert" | "result" | "error",
  volumeScale: 1
}
```

### playSoundCue 반환값

`playSoundCue()`는 예외를 밖으로 던지지 않고 FEEL-000 channel result에 기록 가능한 값을 반환한다.

```text
played
skipped-disabled
skipped-muted
skipped-locked
skipped-no-asset
skipped-deduped
skipped-private
failed
```

정책:

- sound off 상태에서 발생한 cue는 `skipped-disabled`로 끝나며, 나중에 sound on 후 소급 재생하지 않는다.
- runtime locked 상태에서는 `skipped-locked`로 끝난다.
- asset이 없는 cue는 `skipped-no-asset`이며 게임 진행에는 영향이 없다.
- private-safe mapping 실패 시 `skipped-private`으로 끝난다.
- handler 내부 오류는 `failed`로 기록하되 게임 진행을 멈추지 않는다.

## eventType별 sound mapping

| eventType | 기본 sound | 조건 | private 기준 |
| --- | --- | --- | --- |
| `turnChanged` | `turn-bell` | 내 차례이고 `turnSoundEnabled` | 상대 턴은 없음 또는 very soft generic |
| `diceRolled` | `dice-roll` | 서버/로컬 결과 확정 후 | 결과값별 sound 차등 금지 |
| `resourcesProduced` | `resource-gain` 또는 `card-gain` | viewer 본인/observer 분기 | observer는 generic |
| `blockedProduction` | `blocked-soft` | 도둑/은행 부족 | 자원 종류 sound는 viewer-safe일 때만 |
| `build완료d` | `build-success` | 도로/마을/도시 성공 | 공개 정보 |
| `bankTrade완료d` | `trade-success` | 교환 성공 | 공개 교환 정보 |
| `playerTrade완료d` | `trade-success` | 플레이어 교환 완료 | 공개 offer/request 기준 |
| `devCardBought` | `card-flip` | 구매 발생 | 카드 종류 비공개 |
| `devCardPlayed` | `card-play` | 공개 카드 사용 | 공개된 카드 종류만 |
| `sevenRolled` | `robber-alert` | 중요 이벤트 sound on | 반복 금지 |
| `robberMoved` | `robber-move` | 이동 완료 | 공개 정보 |
| `robberResult` | `robber-result` | viewer별 result | observer는 generic |
| `winnerDeclared` | `win-fanfare` | 승리 확정 | 짧게 1회 |
| `commandRejected` | `error-soft` | 사용자가 직접 시도한 action 실패 | 오류 복구 안내 우선 |

eventType별 sound는 cue가 FEEL-000 sanitize를 통과한 뒤에만 매핑한다.

## 구현 순서

1. FEEL-006A: `DEFAULT_FEEL_SETTINGS`에 sound fields 추가.
2. `loadFeelSettings()` / `saveFeelSettings()`를 FEEL-007 설정과 공유.
3. runtime audio state 객체 추가.
4. 사용자 gesture 안에서 `enableSoundEffects()` 호출.
5. backend `none`에서도 안전한 `playSoundCue()` no-op wrapper 추가.
6. mute/volume 변경 즉시 runtime에 반영.
7. FEEL-000 channel result와 연결.
8. FEEL-006B: eventType별 sound mapping 추가.
9. asset manifest 기반 preload 또는 lazy load 추가.
10. private state 기반 generic/resource-specific sound 분기.
11. dedupe key와 reconnect suppression 연결.

## Asset 전략

- 1차는 짧은 mp3 또는 wav asset을 사용한다.
- asset이 준비되지 않은 경우 sound wrapper와 settings만 먼저 구현하고 재생은 no-op으로 둔다.
- 생성형 beep는 임시 테스트에만 사용하고, 최종 적용 전 사용자 피로도를 검토한다.
- 신규 sound asset은 FEEL-005의 `docs/assets_manifest.md` schema를 따른다.
- 출처/라이선스/원본 URL이 불명확한 sound asset은 커밋하지 않는다.

### Sound asset 품질 기준

- 길이: 대부분 0.1~1.2초.
- 파일 크기: 짧은 효과음 기준으로 과도하게 큰 파일 금지.
- 볼륨: 기본 60에서 놀라지 않도록 normalize.
- 반복: loop sound 금지.
- 음색: 턴/성공/경고/오류가 구분되되, 공격적이거나 긴 고주파 sound 금지.
- 중요 정보는 sound에만 의존하지 않는다.

권장 asset key:

```text
turn-bell
dice-roll
resource-gain
card-gain
build-success
trade-success
card-flip
card-play
robber-alert
robber-move
robber-result
blocked-soft
error-soft
win-fanfare
```

### reconnect/hydrate sound suppression

- reconnect 또는 roomJoined 직후 hydrate snapshot에서는 sound를 재생하지 않는다.
- 현재 사용자가 처리해야 하는 pending action도 sound 없이 정적 모달/상태만 복구한다.
- 이후 revision 증가로 새로 발생한 cue만 sound 후보가 된다.
- same cue key가 이미 visual만 처리된 경우, sound on으로 바뀌어도 소급 재생하지 않는다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 브라우저 autoplay 차단 | 명시적 버튼 gesture 이후 AudioContext 생성 |
| 중복 효과음 | cue key dedupe |
| private state leak | viewer-safe sound mapping |
| 소리 피로도 | 기본 off, 볼륨 60, 짧은 sound만 |
| asset 없음으로 오류 | no-op wrapper와 `skipped-no-asset` |
| unlock 실패와 설정 혼동 | settings state와 runtime state 분리 |
| sound on 후 과거 cue 재생 | FEEL-000 channel 정책에 따라 소급 재생 금지 |
| 라이선스 불명확 sound | manifest 없는 asset 커밋 금지 |

## 단계 완료 게이트

- 사운드 off 기본값.
- enable/mute/volume 즉시 반영.
- asset 없어도 오류 없이 동작.
- private state cue에서 generic sound 사용.
- `playSoundCue()`가 모든 skip/failure 상태를 안전하게 반환한다.
- FEEL-006A만 완료된 상태에서도 게임 진행과 cue dispatch가 깨지지 않는다.
- FEEL-006B 연결 후 eventType별 sound mapping이 문서와 일치한다.
- reconnect/hydrate snapshot에서 sound가 재생되지 않는다.
- sound asset이 추가된 경우 manifest와 라이선스가 기록된다.

## 2026-05-27 FEEL-006B 구현 범위 업데이트

- `script.js`
  - `SOUND_EVENT_MAP` and `SOUND_ASSET_KEYS` as the canonical event-to-sound taxonomy. 추가.
  - `soundPrivacyForCue()` and `soundAssetForCue()` so sanitized cue payloads select generic or viewer-safe sound candidates. 추가.
  - Connected `turnSoundEnabled` and `importantEventSoundEnabled` category toggles to sound mapping.
  - Kept actual playback asset-safe: no sound file is bundled, so mapped cues still return `skipped-no-asset` unless a future manifest/preload supplies licensed assets.
  - Exposed sound mapping helpers through `window.__catanFeelTest` for test/debug use.
- `scripts/game-feel-sound-event-mapping-static-test.js`
  - coverage for event mapping, generic/private sound branches, disabled category skips, missing asset skips, and hydrate suppression. 추가.
- external sound asset or `docs/assets_manifest.md` was added in FEEL-006B. 없음.
