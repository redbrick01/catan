# PLAYER-HAND-UI 테스트 계획

## 범위
- PLAYER-HAND-UI-1 자원 손패 dock만 검증한다.
- 개발 카드 hand dock, 모바일 bottom sheet, 카드 사용 interaction, drag and drop은 범위에서 제외한다.

## 정적 검증
- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-icon-asset-static-test.js`
- `node scripts/game-feel-quality-gate-static-test.js`
- `node scripts/player-hand-ui-static-test.js`

## 검증 항목
- `#playerHandDock`, `#playerResourceHand` DOM이 존재하는지 확인한다.
- hand dock helper가 존재하고 `render()` 흐름에 연결됐는지 확인한다.
- 온라인 viewer 선택은 `game.viewerSeatIndex`를 우선 사용하고, viewer를 확정할 수 없으면 dock을 숨기는지 확인한다.
- 오프라인 hand dock은 현재 active player를 사용하는지 확인한다.
- 좌석 카드와 플레이어 패널이 자원 상세 breakdown 대신 공개 가능한 총 자원 수만 표시하는지 확인한다.
- Tabler icon token helper를 재사용하고 새 icon/image asset을 추가하지 않았는지 확인한다.
- 모바일 1차 레이아웃이 bottom sheet가 아니라 가로 스크롤 hand row인지 확인한다.
- reduced-motion CSS guardrail이 hand card에도 적용되는지 확인한다.

## 브라우저 검증
- 데스크톱: 오프라인 게임 시작 후 하단 dock에 자원 카드 5장이 렌더되는지 확인한다.
- 데스크톱: hand dock이 주사위 패널이나 우측 control panel과 겹치지 않는지 확인한다.
- private state spot check: 좌석 카드와 플레이어 행에 자원 타입명이 포함되지 않는지 확인한다.
- 모바일 320/375/390px: 브라우저 도구에서 viewport 지정이 가능하면 확인하고, 불가능하면 정적 CSS guardrail 검증으로 대체한 뒤 제한 사항을 기록한다.

## Private State 체크리스트
- 온라인에서 `game.viewerSeatIndex`가 있으면 viewer 본인의 hand만 렌더한다.
- 온라인에서 viewer를 확정할 수 없으면 dock을 숨기고 stale card를 지운다.
- 상대 row와 좌석 카드에는 자원 타입명을 렌더하지 않는다.
- 개발 카드 상세는 변경하지 않고 hand dock에 새로 노출하지 않는다.
