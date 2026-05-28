# FEEL-006B 이벤트 사운드 매핑 테스트 계획

작성일: 2026-05-27

## 범위

라이선스가 확인되지 않은 사운드 파일을 추가하지 않고, FEEL-006A 사운드 기반 위에서 eventType별 사운드 매핑을 검증한다.

## 정적 점검

- `node --check script.js`
- `node --check server.js`
- 기존 game-feel 정적 테스트 재실행
- `node scripts/game-feel-sound-event-mapping-static-test.js` 실행

## 점검 항목

- eventType별 asset key 매핑
- 알려진 sound asset key 목록
- resource-specific 생산 sound와 generic 생산 sound 분기
- robber result의 viewer-resource/generic-observer 분기
- 개발 카드 구매의 generic sound 유지
- category toggle skip 동작
- 누락 asset의 `skipped-no-asset` 처리
- reconnect/hydrate cue 억제 연결

## 브라우저 스모크

- `http://localhost:4173/`을 열거나 새로고침한다.
- 사운드 매핑 변경 후에도 앱이 렌더링되는지 확인한다.
- 사운드 설정 UI가 남아 있고 사운드 기본값이 꺼짐인지 확인한다.
- 브라우저 테스트 hook을 사용할 수 있으면 production, robber, dev-card, winner cue의 `mapCueToSound()` 결과를 확인한다.

## 비공개 상태 검토

- 보이는 `resourceType`이 있는 `resourcesProduced`는 resource sound 후보로 매핑될 수 있다.
- 보이는 `resourceType`이 없는 `resourcesProduced`는 generic `card-gain`으로 매핑된다.
- 보이는 `resourceType`이 있는 `robberResult`는 viewer-resource로 표시되고, 없으면 generic-robber로 표시된다.
- `devCardBought`는 잘못된 payload에 `cardType`이 들어와도 항상 generic-card로 처리한다.

## 자산 및 라이선스 검토

- 이 단계에서는 사운드 파일을 추가하지 않는다.
- 파일 자산을 추가하지 않았으므로 `docs/assets_manifest.md`는 필요하지 않다.
- 누락 asset은 예외 없이 `skipped-no-asset`을 반환해야 한다.

## 통과 기준

- 모든 정적 테스트가 통과한다.
- 기존 FEEL 사운드 기반 동작이 계속 통과한다.
- 비공개 사운드 누출이 없다.
- manifest에 기록되지 않은 자산을 추가하지 않는다.

## 알려진 제약

- licensed sound file이 없으므로 실제 audible playback은 검증하지 않는다.
- 브라우저 test-hook 검사는 인앱 브라우저 평가 표면에 제한될 수 있으며, 정적 테스트를 주 검증 수단으로 둔다.
