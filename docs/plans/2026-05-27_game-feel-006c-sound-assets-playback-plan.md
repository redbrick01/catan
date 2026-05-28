# FEEL-006C 사운드 자산 적용 및 실제 재생 계획 초안

작성일: 2026-05-27  
상위 계획: `docs/plans/2026-05-27_game-feel-006-sound-system-plan.md`  
선행 단계: FEEL-006A 사운드 기반, FEEL-006B 이벤트별 사운드 매핑

## 목적

FEEL-006A/006B에서 만든 사운드 설정, cue dispatch, eventType별 매핑을 실제 들리는 효과음으로 연결한다.

이 단계의 목표는 새 게임 기능 추가가 아니라, 라이선스가 확인된 짧고 품질 좋은 효과음 파일을 선정해 `assets/sounds`에 정리하고, 기존 `playSoundCue()` 경로가 실제로 재생되도록 완성하는 것이다.

## 현재 초안에 대한 비판적 점검

기존 초안은 asset을 추가하고 재생 경로를 연결하는 구현 흐름은 충분히 다루지만, 음원 선정 기준이 약하다. CC0 여부만 통과하면 실제 게임 분위기와 맞지 않는 8-bit 효과음, 지나치게 날카로운 경고음, 음압이 들쭉날쭉한 파일, 배경 잡음이 있는 파일이 섞일 수 있다.

또한 eventType별 기능 요구는 있지만 전체 사운드 팔레트의 통일감 기준이 부족하다. Catan은 전투/액션 게임이 아니므로, 효과음은 과장된 arcade 톤보다 부드러운 프리미엄 UI 피드백, 보드게임의 촉감, 나무/종이/주사위/작은 종소리 같은 물성, 낮은 피로도, 반복 청취 가능성을 우선해야 한다.

따라서 FEEL-006C는 단순 다운로드 작업이 아니라, 후보 수집, 라이선스 검증, 청음 평가, 정규화, manifest 기록, 실제 재생 QA까지 포함한 품질 게이트로 다룬다.

## 범위

- CC0 또는 프로젝트 사용 조건에 맞는 효과음 소스 조사
- eventType별 2~3개 후보 음원 수집 및 비교
- 고품질, 분위기, 반복 청취 피로도 기준으로 최종 음원 선정
- `assets/sounds/` 디렉터리 추가
- `docs/assets_manifest.md`에 파일별 출처, 라이선스, 용도 기록
- 사운드 manifest 또는 asset loader 구현
- Web Audio 또는 HTMLAudio 기반 실제 playback 구현
- soundEnabled, volume, mute, turnSoundEnabled, importantEventSoundEnabled 준수
- dedupe, reconnect/hydrate 억제, private state generic 분기 유지
- 브라우저 사용자 gesture 이전 재생 제한 준수

## 범위 제외

- 배경음악 추가
- 긴 음성/내레이션 추가
- 이벤트별 새 게임 로직 추가
- FEEL-008 이후 품질 게이트 확장
- 라이선스가 불명확하거나 재배포 조건이 애매한 음원 사용
- 공격적, 공포, 전투, 카지노 슬롯머신처럼 Catan 분위기와 어긋나는 효과음 사용

## 음원 선정 원칙

### 0. 전체 사운드 방향

목표 톤은 특정 회사의 실제 시스템 사운드를 복제하는 것이 아니라, Apple 계열 UI에서 기대되는 것처럼 느껴지는 부드럽고 정제된 프리미엄 감각이다.

- 매우 짧고 명확하지만 공격적이지 않다.
- 고역이 날카롭게 찌르지 않고, 둥글게 마감된다.
- 잔향은 아주 짧거나 거의 없고, 공간감이 과하지 않다.
- 성공음은 화려한 보상음보다 작은 만족감에 가깝다.
- 오류음은 실패 처벌이 아니라 부드러운 제지 신호처럼 들린다.
- 전체 팔레트는 유리, 목재, 종이, 부드러운 bell, muted tap 계열처럼 깨끗하고 절제된 질감으로 맞춘다.
- 8-bit, arcade, fantasy magic, combat, casino, loud notification 계열은 기본적으로 배제한다.
- macOS/iOS 실제 사운드 파일 또는 이를 모방한 파일은 사용하지 않는다. 저작권과 브랜드 혼동을 피하기 위해 "프리미엄 UI 톤"만 참고한다.

### 1. 분위기 기준

Catan의 사운드는 온라인 보드게임의 조용한 보조 감각이어야 한다.

- 선호: soft tap, muted click, warm chime, glassy but gentle bell, 종이/카드 질감, 작은 나무 토큰, 부드러운 주사위.
- 조건부 허용: 목재/석재 물성음. 단, 거칠거나 현실 잡음이 강하면 탈락시킨다.
- 지양: 총성, 폭발, 괴물, 공포, 거친 금속 충돌, 8-bit arcade power-up, 카지노/슬롯머신, 모바일 광고 게임처럼 들리는 fanfare.
- 경고/오류음도 처벌감보다 회복 가능한 안내처럼 들려야 한다.
- 승리음은 축하감은 주되 길고 과장된 음악처럼 느껴지지 않아야 한다.

### 2. 품질 기준

후보 음원은 다음 기준을 통과해야 한다.

- 파일 길이: 일반 cue는 80~700ms, 승리음은 800~1800ms 권장.
- 시작 지연: 클릭 또는 이벤트 후 50ms 이상 무음으로 시작하는 파일은 편집하거나 탈락시킨다.
- 끝 처리: abrupt cut, click/pop, 긴 reverb tail이 없어야 한다.
- 잡음: hiss, hum, clipping, room noise가 명확히 들리면 탈락시킨다.
- 음압: 같은 기본 볼륨에서 특정 파일만 튀지 않아야 한다.
- 주파수: 날카로운 2~5kHz 대역이 과도해 장시간 플레이에 피로를 주면 탈락시킨다.
- 반복성: 같은 사운드를 10회 연속 재생해도 불쾌하거나 우스꽝스럽지 않아야 한다.
- 구분성: turn, dice, build, trade, error, victory는 서로 구분되지만 같은 게임 안의 팔레트처럼 들려야 한다.

### 3. 접근성 기준

- 중요한 정보는 소리만으로 전달하지 않는다.
- 사운드는 기본 꺼짐을 유지한다.
- 사운드 off, volume 0, unlock 실패 상태에서도 텍스트/시각 cue가 동일 정보를 제공한다.
- 갑작스럽고 큰 transient를 피한다.
- 반복 이벤트는 낮은 볼륨 또는 짧은 cue를 사용한다.
- pending 계열 사운드는 플레이어를 재촉하는 알람처럼 들리지 않아야 한다.

### 4. private state 기준

- viewer가 알 수 없는 자원 종류를 음색, 악기, 길이, 음높이 차이로 암시하지 않는다.
- 상대 자원 생산은 generic gain만 사용한다.
- 상대 약탈 결과 observer는 generic robber result만 사용한다.
- 개발 카드 구매는 항상 generic card cue만 사용한다.
- 주사위 결과값별로 다른 소리를 사용하지 않는다.
- 공개 개발 카드 사용은 이미 공개된 card type에 한해서만 시각/텍스트와 같은 수준의 표현을 허용한다.

## 후보 평가표

구현자는 각 asset key마다 최소 2개 후보를 듣고 아래 항목을 기록한다. 최종 선정 파일만 저장소에 넣고, 탈락 후보는 최종 보고서에 간단히 사유만 남긴다.

| 항목 | 기준 |
| --- | --- |
| 라이선스 | CC0 우선. 파일 단위 URL과 라이선스 확인 가능 |
| 분위기 | 부드러운 프리미엄 UI 톤과 보드게임 질감이 함께 느껴짐 |
| 길이 | 일반 cue 80~700ms, 승리 cue 800~1800ms |
| 시작/끝 | 무음 지연, click/pop, 잘린 tail 없음 |
| 음압 | 기본 볼륨 60에서 다른 cue보다 튀지 않음 |
| 피로도 | 10회 반복 청취해도 거슬리지 않음 |
| 구분성 | eventType 구분 가능 |
| 통일감 | 전체 팔레트와 어울림 |
| private state | 비공개 정보를 암시하지 않음 |
| 편집 필요 | normalize, trim, fade 필요 여부 기록 |

## 우선 소스 후보

실제 구현 전 각 파일 단위로 라이선스와 다운로드 URL을 다시 확인한다.

| 후보 | 용도 | 라이선스 기준 | 비고 |
| --- | --- | --- | --- |
| Kenney UI Audio | UI cue, 오류, 성공, 짧은 알림 | Creative Commons CC0 | 품질과 톤이 안정적인 1순위 후보. 출처: https://kenney.nl/assets/ui-audio |
| OpenGameArt SoundFX Library CC0 | 주사위, 카드, 알림, 승리 후보 | CC0 | 후보 풀이 넓지만 파일별 톤 편차를 청음으로 걸러야 한다. 출처: https://opengameart.org/content/soundfx-library-cc0 |
| Freesound CC0 검색 결과 | 부족한 특정 효과음 보강 | 파일별 CC0만 허용 | CC0 필터와 개별 라이선스 확인 필수. 계정/다운로드 조건도 기록한다. 출처: https://freesound.org/help/faq/ |

## 라이선스 정책

- 기본 허용: CC0.
- 조건부 허용: CC BY 계열은 attribution 위치와 재배포 조건을 명확히 기록할 수 있을 때만 검토한다.
- 불허: CC BY-NC, 라이선스 미표기, 출처 불명, 상업/재배포 제한이 있는 파일.
- 모든 파일은 `docs/assets_manifest.md`에 다음 항목을 기록한다.
  - 파일 경로
  - 원본 파일명
  - 출처 URL
  - 작성자 또는 배포자
  - 라이선스
  - 다운로드 확인일
  - 프로젝트 내 용도
  - 편집 내역
  - 원본 보존 여부

## 목표 파일 구조

```text
assets/
  sounds/
    turn-bell.ogg
    dice-roll.ogg
    resource-gain.ogg
    card-gain.ogg
    blocked-soft.ogg
    build-success.ogg
    trade-success.ogg
    card-flip.ogg
    card-play.ogg
    robber-alert.ogg
    robber-move.ogg
    robber-result.ogg
    error-soft.ogg
    win-fanfare.ogg
```

기본 포맷은 용량과 브라우저 지원을 고려해 `ogg` 또는 `mp3` 중 하나로 통일한다. 브라우저 호환성이 문제가 되면 같은 key에 복수 확장자를 허용하는 manifest 구조를 사용한다.

## eventType별 음원 방향

| eventType | asset key | 음원 방향 | 거부 기준 |
| --- | --- | --- | --- |
| `turnChanged` | `turn-bell` | 아주 짧고 둥근 chime 또는 soft bell | 알람시계, 전화벨, 긴 멜로디 |
| `diceRolled` | `dice-roll` | 깨끗하게 다듬은 주사위/토큰 굴림 | 결과값별 차등, 너무 긴 흔들림, 거친 테이블 소음 |
| `resourcesProduced` | `resource-gain` | 작은 soft pop 또는 warm gain cue | 자원 종류를 암시하는 물성 차이 |
| `resourcesProduced` observer/generic | `card-gain` | 부드러운 카드/종이 cue | 특정 자원 질감처럼 들리는 소리 |
| `blockedProduction` | `blocked-soft` | 낮고 짧은 막힘 cue | 실패 처벌음, 큰 buzz, 공포감 |
| `buildCompleted` | `build-success` | muted tap + 작은 성공 배음 | 건설 종류별 차등, 과장된 fanfare |
| `bankTradeCompleted` | `trade-success` | soft confirm 계열의 교환 성공음 | 코인/카지노 느낌 |
| `playerTradeCompleted` | `trade-success` | 은행 교환과 같은 계열 | 거래 자원 조합을 암시하는 차등 |
| `devCardBought` | `card-flip` | 깨끗한 카드 flip 또는 soft paper tick | 카드 종류를 암시하는 마법/전투음 |
| `devCardPlayed` | `card-play` | 카드 공개를 알리는 약간 더 선명한 cue | 비공개 구매와 혼동되는 소리 |
| `sevenRolled` | `robber-alert` | 낮은 볼륨의 짧은 attention chime | 큰 사이렌, 공포/전투 경고음 |
| `discardPendingStarted` | `robber-alert` | 같은 계열의 낮은 볼륨 | 재촉하는 알람 |
| `robberMovePendingStarted` | `robber-alert` | 같은 계열의 낮은 볼륨 | 반복 피로가 큰 소리 |
| `robberVictimPendingStarted` | `robber-alert` | 같은 계열의 낮은 볼륨 | 특정 피해를 암시하는 소리 |
| `robberMoved` | `robber-move` | 부드러운 short whoosh 또는 muted slide | 위치나 대상 정보를 소리로 차등 |
| `robberResult` | `robber-result` | 낮고 짧은 generic result cue | 훔친 자원 종류를 암시하는 소리 |
| `winnerDeclared` | `win-fanfare` | 1초 안팎의 절제된 celebratory chime | 너무 긴 음악, 과도한 arcade fanfare |
| `commandRejected` | `error-soft` | 둥근 low tap 또는 soft deny cue | 날카로운 beep, 처벌감 큰 buzzer |

## 구현 순서

1. 소스 후보에서 CC0 효과음을 eventType별 최소 2개 이상 수집한다.
2. 후보 평가표로 분위기, 품질, 반복 피로도, private state 안전성을 기록한다.
3. 최종 asset 후보를 골라 trim, fade, normalize 필요 여부를 결정한다.
4. 편집을 수행했다면 원본과 편집 내역을 `docs/assets_manifest.md`에 기록한다.
5. 파일명을 프로젝트 key에 맞춰 `assets/sounds/`에 저장한다.
6. `script.js`에 sound asset manifest를 추가한다.
7. `preloadSoundAssets()`가 URL manifest를 받아 실제 audio buffer 또는 audio element를 준비하도록 구현한다.
8. `enableSoundEffects()`에서 사용자 gesture 이후 preload/resume 흐름을 연결한다.
9. `playSoundCue()`가 `played`를 반환할 수 있도록 실제 재생 경로를 구현한다.
10. 실패 시 기존처럼 `skipped-disabled`, `skipped-muted`, `skipped-locked`, `skipped-no-asset`, `failed`를 안전하게 반환한다.
11. 정적 테스트와 브라우저 수동 검증으로 실제 audible playback을 확인한다.

## 구현 세부 기준

- 기본값은 계속 sound off이다.
- 사용자가 효과음을 켜기 전에는 AudioContext 생성 또는 재생을 강제하지 않는다.
- 런타임 중 외부 URL에서 음원을 받아오지 않는다. 검증된 파일을 저장소의 `assets/sounds/`에 포함하고 로컬 경로로만 로드한다.
- 파일 용량은 일반 cue 기준 가능하면 100KB 이하, 승리 cue 기준 가능하면 250KB 이하로 유지한다.
- 불필요한 stereo 파일은 mono 변환을 검토하되, 변환 내역은 manifest에 기록한다.
- 볼륨은 `soundVolume / 100 * volumeScale`로 계산한다.
- volume 0은 `skipped-muted` 또는 무음 재생 없이 skip 처리한다.
- category toggle이 꺼져 있으면 해당 사운드는 재생하지 않는다.
- 같은 cue key 중복 수신 시 1회만 재생한다.
- reconnect/hydrate snapshot에서는 과거 사운드를 재생하지 않는다.
- asset 로딩 실패는 게임 진행을 막지 않는다.
- sound off 상태에서도 텍스트, 로그, 상태 배지, 시각 cue가 동일 정보를 제공해야 한다.
- 연속 이벤트가 겹칠 때는 소리가 뭉개지지 않도록 동일 asset의 최소 재생 간격 또는 gain 제한을 검토한다.

## 테스트 계획 초안

FEEL-006C 구현 시 별도 테스트 계획서를 작성한다.

필수 실행:

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-sound-static-test.js`
- `node scripts/game-feel-sound-event-mapping-static-test.js`
- 신규 `node scripts/game-feel-sound-assets-static-test.js`

신규 정적 테스트 후보:

- 모든 `SOUND_EVENT_MAP` asset key가 manifest에 존재한다.
- manifest의 모든 파일 경로가 실제로 존재한다.
- manifest의 모든 파일 경로가 외부 URL이 아닌 로컬 `assets/sounds/` 경로를 사용한다.
- sound 파일 용량이 계획된 예산을 크게 넘지 않는다.
- `docs/assets_manifest.md`에 모든 sound 파일의 출처와 라이선스가 기록되어 있다.
- 금지 라이선스 문자열이 sound manifest에 포함되지 않는다.
- `playSoundCue()`가 asset이 있을 때 `played` 경로를 가질 수 있다.
- sound off, volume 0, locked, missing asset 상태가 기존 skip 결과를 유지한다.
- observer resource/robber/devCardBought cue가 generic asset으로만 매핑된다.

브라우저 수동 검증:

- 설정에서 효과음 기본값이 꺼져 있는지 확인한다.
- 사용자 클릭으로 효과음을 켠 뒤 내 차례, 주사위, 건설, 교환, 오류, 승리 사운드가 1회 재생되는지 확인한다.
- 볼륨 슬라이더와 mute 상태가 즉시 반영되는지 확인한다.
- 같은 이벤트를 빠르게 반복해도 소리가 폭발하지 않는지 확인한다.
- 5분 이상 플레이하면서 반복 피로도가 큰 cue가 없는지 확인한다.
- reconnect/hydrate 직후 과거 이벤트 소리가 나지 않는지 확인한다.
- 다중 클라이언트에서 observer가 비공개 정보를 소리로 추론할 수 없는지 확인한다.

## 문서 산출물

FEEL-006C 구현 시 다음 문서를 작성한다.

- `docs/tests/2026-05-27_game-feel-006c-sound-assets-playback-test-plan.md`
- `docs/reports/2026-05-27_game-feel-006c-sound-assets-playback-final-report.md`
- `docs/assets_manifest.md`

## 완료 기준

- 라이선스 확인된 sound asset만 저장소에 추가한다.
- 각 asset은 품질 기준과 분위기 기준을 통과한다.
- eventType별 sound mapping이 실제 audible playback으로 이어진다.
- soundEnabled, volume, mute, category toggle이 모두 적용된다.
- dedupe와 reconnect/hydrate 억제가 유지된다.
- private state를 사운드로 암시하지 않는다.
- sound off 상태에서도 정보 손실이 없다.
- 실패하거나 누락된 asset은 게임 진행을 막지 않는다.
- 최종 보고서에 실행 테스트, 미실행 테스트, 남은 위험, 라이선스 기록 여부, 후보 탈락 사유를 남긴다.

## 남은 결정 사항

- 최종 음원 포맷을 `ogg`, `mp3`, 또는 복수 포맷 manifest 중 무엇으로 할지 결정한다.
- 모든 효과음을 한 소스 팩에서 통일할지, eventType별로 다른 CC0 소스를 섞을지 결정한다.
- 짧은 fade 또는 normalize 편집을 저장소 안에서 수행할지, 원본 파일만 사용할지 결정한다.
- 브라우저 자동재생 검증을 Playwright로 자동화할 수 있는지 확인한다.
- 실제 후보 청음 후, soft premium UI 톤을 해치는 후보를 일괄 탈락시킬 기준을 최종 확정한다.
