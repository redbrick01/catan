# FEEL-006B 이벤트 사운드 테스트 계획

작성일: 2026-05-27

## 범위

FEEL-006A 사운드 기반 위에서 eventType별 사운드 매핑을 검증한다. 라이선스가 확인되지 않은 사운드 자산은 추가하지 않고, 게임 정보가 오디오에만 의존하지 않는지 확인한다.

## 정적 점검

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`
- `node scripts/game-feel-sound-static-test.js`
- `node scripts/game-feel-turn-state-static-test.js`
- `node scripts/game-feel-dice-seed-static-test.js`
- `node scripts/game-feel-robber-pending-static-test.js`
- `node scripts/game-feel-action-result-static-test.js`
- `node scripts/game-feel-icon-asset-static-test.js`
- `node scripts/game-feel-sound-event-mapping-static-test.js`

## 커버리지

- `SOUND_EVENT_MAP`에 턴, 주사위, 생산, 건설, 교환, 개발 카드, 도둑/7, 오류, 승리 이벤트가 포함되어 있다.
- `soundEnabled`, `soundVolume`, `turnSoundEnabled`, `importantEventSoundEnabled`는 재생을 안전하게 skip한다.
- 같은 cue key는 FEEL cue runtime에서 channel dispatch 전에 억제된다.
- reconnect/hydrate snapshot은 state-delta cue logging 전에 hydrate 억제를 등록한다.
- 상대 생산과 observer 도둑 결과 cue는 cue sanitize 이후 generic sound 후보로 매핑된다.
- 개발 카드 구매 cue는 generic 상태를 유지하고 카드 종류를 노출하지 않는다.
- 누락된 사운드 자산은 예외 없이 `skipped-no-asset`을 반환한다.

## 브라우저/수동 점검

- 설정 UI에서 사운드 기본값이 꺼짐인지 확인한다.
- 사운드를 끄거나 볼륨을 0으로 설정해도 텍스트/시각 cue가 사라지지 않는지 확인한다.
- 향후 licensed sound manifest가 로드되지 않는 한 실제 audible playback을 기대하지 않는다.

## 통과 기준

- 정적 점검이 통과한다.
- 사운드 매핑이 비공개 상태를 보호한다.
- 사운드 파일 자산이 manifest 기록 없이 추가되지 않는다.
- reconnect/hydrate 및 duplicate cue 억제 연결이 유지된다.
