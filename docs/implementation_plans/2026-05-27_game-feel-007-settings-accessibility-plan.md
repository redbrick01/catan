# FEEL-007 설정/접근성 제어 계획
 

## 2026-05-27 구현 범위 업데이트

- `index.html`
  - the `feelSettingsButton` entry point in the action panel. 추가.
- `script.js`
  - `katanFeelSettings` schema, sanitize/load/save helpers, effective motion calculation, DOM dataset application, OS reduced-motion listener, and test hooks. 추가.
  - a keyboard-operable settings modal with segmented controls, toggles, volume range, Escape close, focus return, and basic focus trapping. 추가.
  - Kept sound default off and treated settings as user preference, not online game state.
- `styles.css`
  - settings modal control styles and `html[data-effective-motion="reduced"]` guardrails. 추가.
- `scripts/game-feel-settings-static-test.js`
  - schema fallback, persistence, DOM dataset, and reduced-motion effective-setting tests. 추가.

구현은 FEEL-007 범위 안에 머물렀다. 실제 오디오 재생은 FEEL-006A/006B 범위이며, eventType별 motion은 FEEL-001~004 범위다.
작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

모션과 사운드가 플레이를 돕되, 불편하거나 접근성을 해치지 않게 제어한다.

## 범위

- `효과 설정` 버튼
- 설정 모달
- 모션 효과 `auto / reduced / on`
- 사운드 효과 `off / on`
- 볼륨
- 내 차례 강조
- 중요 이벤트 강조
- localStorage 저장
- 설정 schema migration/fallback
- 설정 modal 우선순위와 keyboard/focus 기준

## 저장 기준

```text
localStorage key: katanFeelSettings
scope: 앱 전역 사용자 선호
online game state 영향 없음
```

## DEFAULT_FEEL_SETTINGS schema

저장값은 version을 포함한다. 깨진 값이나 오래된 schema는 기본값으로 복구한다.

```js
{
  schemaVersion: 1,
  motionMode: "auto",              // "auto" | "reduced" | "on"
  soundEnabled: false,
  soundVolume: 60,                 // 0~100
  turnSoundEnabled: true,
  importantEventSoundEnabled: true,
  turnEmphasis: "normal",          // "normal" | "strong"
  importantEventEmphasis: true
}
```

원칙:

- 설정은 사용자 선호이며 online game state에 포함하지 않는다.
- schemaVersion이 없거나 알 수 없는 값이면 기본값으로 merge한다.
- `soundVolume`은 숫자로 clamp한다.
- boolean/string enum은 허용값이 아니면 기본값을 사용한다.
- localStorage 읽기/쓰기 실패는 게임 진행을 막지 않는다.

## 설정 load/save 기준

`loadFeelSettings()`:

- try/catch로 JSON parse 실패를 처리한다.
- 기본값과 저장값을 merge한다.
- 잘못된 enum과 범위 밖 숫자를 보정한다.
- 보정된 값은 즉시 저장하거나 메모리에서만 사용한다. 저장 실패는 무시하되 debug log 후보로 남긴다.

`saveFeelSettings(next)`:

- 저장 전 sanitize를 수행한다.
- localStorage 실패 시 UI에 치명 오류를 띄우지 않는다.
- 저장 실패 상태에서도 현재 세션 메모리 설정은 반영한다.

권장 helper:

```js
loadFeelSettings()
saveFeelSettings(settings)
sanitizeFeelSettings(value)
getEffectiveFeelSettings(settings)
applyFeelSettings(settings)
```

## 접근성 기준

- `prefers-reduced-motion` 감지.
- 색상만으로 상태 전달 금지.
- 키보드 조작 가능.
- 설정 변경 즉시 반영.
- 장시간 반복/깜빡임 금지.
- 사운드 정보는 항상 텍스트/시각 cue로 대체 가능.
- 모션 감소 상태에서도 현재 턴, pending, 오류, 승리 정보를 놓치지 않음.
- 설정 모달 control은 label과 현재 값이 스크린리더에 노출되어야 함.

## 구현 후보

- `index.html`
  - 효과 설정 버튼 또는 container
- `script.js`
  - settings modal 생성/렌더링
  - settings load/save
  - reduced-motion helper
  - effective settings helper
  - sound enable 실패 표시
- `styles.css`
  - settings modal
  - reduced-motion rules

## 완료 기준

- 게임 중 설정 변경 가능.
- 모션 자동 모드는 OS 설정을 따른다.
- 줄이기 모드에서는 pulse/shimmer가 정적 강조로 대체된다.
- 사운드 off가 기본값이다.
- localStorage 값이 깨져도 기본값으로 복구된다.
- blocking game modal을 설정 모달이 덮지 않는다.
- 설정 변경은 현재 화면의 data attribute와 FEEL helper에 즉시 반영된다.

## 테스트 초안

- localStorage 저장/복구.
- keyboard tab order.
- reduced-motion emulation.
- 설정 변경 즉시 class/state 반영.
- 깨진 localStorage JSON에서 기본값 fallback.
- schemaVersion 누락/미래 버전에서 fallback.
- `motionMode: auto`에서 OS reduced-motion에 따라 effective motion이 바뀜.
- `motionMode: on`에서도 장시간 반복/깜빡임 금지 유지.
- blocking modal 중 설정 버튼 정책 확인.
- Escape로 설정 모달 닫기와 focus return.
- range volume 0/60/100 저장과 즉시 반영.
- sound toggle on 시 사용자 gesture 안에서 `enableSoundEffects()` 호출.
- sound unlock 실패 시 UI 상태가 실패/잠김을 표시.
- 모바일에서 설정 모달 action button이 가려지지 않음.
- 사운드 off에서 정보 손실이 없음.

## 설정 UI 구조

권장 모달:

```text
효과 설정
- 모션 효과: 자동 / 줄이기 / 켜기
- 사운드 효과: 끄기 / 켜기
- 효과음 볼륨: range 0~100
- 내 차례 강조: 기본 / 강하게
- 중요 이벤트 강조: 켜기 / 끄기
```

Control 기준:

| 설정 | UI control | 저장값 | 비고 |
| --- | --- | --- | --- |
| 모션 효과 | segmented radio | `motionMode` | `auto/reduced/on` |
| 사운드 효과 | toggle | `soundEnabled` | on 전환 시 `enableSoundEffects()` 호출 |
| 효과음 볼륨 | range + 숫자 label | `soundVolume` | 0~100, 즉시 반영 |
| 내 차례 강조 | segmented radio | `turnEmphasis` | FEEL-001 pulse/정적 강조 강도 |
| 중요 이벤트 강조 | toggle | `importantEventEmphasis` | 7/승리/오류 강조 |
| 내 차례 알림음 | toggle | `turnSoundEnabled` | soundEnabled가 off여도 저장 가능 |
| 중요 이벤트 사운드 | toggle | `importantEventSoundEnabled` | FEEL-006 category 제어 |

버튼 위치:

- 1차: 게임 화면 우측 패널 또는 상단 상태 영역.
- 후속: setup 화면에서도 접근 가능하게 확장.

## 설정 모달 우선순위

현재 프로젝트는 단일 전역 modal system과 `onlineSession.modalKind`를 사용한다. 설정 모달은 게임 진행을 막는 모달과 충돌하면 안 된다.

1차 정책:

- `room-ended`, `reconnect-waiting`, `leave-confirm` 중에는 설정 버튼을 비활성화한다.
- `discard-seven`, `move-robber`, `choose-robber-victim`, `player-trade`처럼 사용자가 즉시 처리해야 하는 blocking modal이 열려 있으면 설정 모달을 열지 않는다.
- 일반 게임 화면, lobby, setup, non-blocking notice 상태에서는 설정 모달을 열 수 있다.
- 기존 modal system을 재사용한다면 `onlineSession.modalKind = "feel-settings"`로 분리한다.
- 설정 모달을 닫으면 설정 버튼 또는 원래 focus된 요소로 focus를 돌려준다.

후속 검토:

- blocking modal 위에 별도 side panel로 설정을 여는 방식은 1차 범위에서 제외한다.

## 설정 적용 우선순위

```text
사용자 명시 설정
> 자동 모드일 때 OS prefers-reduced-motion
> 프로젝트 기본값
```

단, `켜기` 상태에서도 장시간 반복/깜빡임은 허용하지 않는다.

## effective settings 계산 기준

저장 설정과 실제 적용 설정을 분리한다.

```js
function getEffectiveMotionMode(settings) {
  if (settings.motionMode === "reduced") return "reduced";
  if (settings.motionMode === "on") return "on";
  return prefersReducedMotion() ? "reduced" : "on";
}
```

권장 effective object:

```js
{
  motionMode: "auto",
  effectiveMotion: "reduced" | "on",
  soundEnabled: false,
  soundVolume: 60,
  turnEmphasis: "normal",
  importantEventEmphasis: true,
  turnSoundEnabled: true,
  importantEventSoundEnabled: true
}
```

`effectiveMotion = "reduced"`에서는 animation을 제거하거나 0~80ms opacity/color 전환으로 축소한다. 정보는 badge, outline, text로 유지한다.

## 구현 순서

1. `DEFAULT_FEEL_SETTINGS` 정의.
2. `loadFeelSettings()` / `saveFeelSettings()` 추가.
3. `sanitizeFeelSettings()`와 schema fallback 추가.
4. OS reduced-motion 감지 helper 추가.
5. `getEffectiveFeelSettings()` 추가.
6. `applyFeelSettings()`로 DOM dataset 반영.
7. settings modal 렌더링.
8. sound toggle on 전환 시 사용자 gesture 안에서 `enableSoundEffects()` 호출.
9. sound unlock 실패/locked 상태를 UI에 표시.
10. keyboard/focus trap 기본 동작 확인.
11. blocking modal 중 설정 버튼 정책 적용.

## DOM 상태 반영

```text
document.documentElement.dataset.motionMode = "auto|reduced|on"
document.documentElement.dataset.effectiveMotion = "reduced|on"
document.documentElement.dataset.sound = "off|on"
document.documentElement.dataset.eventEmphasis = "off|on"
document.documentElement.dataset.turnEmphasis = "normal|strong"
```

DOM 반영 표:

| Setting/effective | DOM | 사용처 |
| --- | --- | --- |
| `motionMode` | `data-motion-mode` | 설정 UI 상태 표시 |
| `effectiveMotion` | `data-effective-motion` | CSS animation 축소 |
| `soundEnabled` | `data-sound` | sound UI 상태 |
| `importantEventEmphasis` | `data-event-emphasis` | 7/승리/오류 강조 |
| `turnEmphasis` | `data-turn-emphasis` | 내 차례 강조 강도 |

기존 `@media (prefers-reduced-motion: reduce)`는 안전 fallback으로 유지한다. JS 설정이 로드된 뒤에는 `data-effective-motion`이 우선 기준이 된다.

## 키보드/focus 기준

- 설정 버튼은 keyboard focus 가능해야 한다.
- 설정 모달이 열리면 첫 control 또는 모달 제목에 focus를 둔다.
- Tab/Shift+Tab이 모달 내부를 순환한다.
- Escape는 설정 모달을 닫는다. 단, 저장 중이거나 sound unlock 중인 상태에서는 버튼 disabled만 유지하고 게임은 막지 않는다.
- 닫힌 뒤에는 설정 버튼 또는 모달을 열었던 요소로 focus를 반환한다.
- range input은 label과 현재 값 텍스트를 함께 제공한다.
- segmented radio는 fieldset/legend 또는 aria group label을 가진다.

## sound enable 실패 UI 기준

`soundEnabled`를 켰지만 runtime unlock이 실패할 수 있다.

표시 기준:

```text
사운드가 켜졌지만 브라우저가 아직 재생을 허용하지 않았습니다. 다시 시도하세요.
```

정책:

- 실패해도 `soundEnabled` 저장값을 즉시 false로 되돌릴지 여부는 UX에서 결정한다.
- 1차 권장: 저장값은 사용자의 의도를 유지하고, runtime 상태를 `locked/failed`로 표시한다.
- 재시도 버튼은 사용자 gesture로 `enableSoundEffects()`를 다시 호출한다.
- 실패 상태에서도 게임 진행과 cue dispatch는 계속된다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 설정 모달이 게임 모달과 충돌 | 기존 modal system 재사용 시 modalKind 분리 |
| 저장값 깨짐 | schema version 또는 fallback default |
| 키보드 접근성 누락 | role, label, focus 순서 확인 |
| OS 설정 무시 | 자동 모드 기본값으로 OS 설정 반영 |
| sound toggle과 unlock 실패 혼동 | settings state와 runtime audio state 분리 |
| localStorage 저장 실패 | 세션 메모리 설정 유지, 게임 진행 계속 |
| CSS media query와 JS 설정 충돌 | `data-effective-motion` 우선, media query는 fallback |
| 설정 변경이 cue에 늦게 반영 | `shouldPlayCue()`와 sound wrapper가 effective settings를 즉시 읽음 |

## 단계 완료 게이트

- 새로고침 후 설정 복구.
- reduced-motion emulation에서 motion 줄어듦.
- 사운드 off 기본 유지.
- 설정 모달을 키보드로 닫고 변경 가능.
- 깨진 localStorage 값에서 기본값 fallback.
- `auto` motion이 OS 설정을 반영해 effective motion으로 계산됨.
- blocking modal 중 설정 모달이 게임 진행을 덮지 않음.
- sound on 시도와 runtime unlock 실패가 UI에서 구분됨.
- DOM dataset이 설정 변경 즉시 업데이트됨.
- FEEL-001~006 cue handler가 effective settings를 사용한다.
