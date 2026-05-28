# PLAYER-HAND-UI 하단 손패 덱 구현 계획

작성일: 2026-05-27  
상위 맥락: game-feel UI 정리 이후 플레이어 private 카드 표현 개선

## 목적

각 플레이어 화면에서 자신의 자원 카드를 우측 플레이어 패널 안의 요약 카드가 아니라, 화면 하단의 실제 손패 덱처럼 보이게 분리한다.

플레이어 패널은 공개 정보 요약 전용으로 정리하고, private state에 해당하는 내 자원 상세는 viewer 본인 화면의 하단 hand dock에서만 표시한다.

## 핵심 원칙

- 서버 규칙, 자원 보유량, 개발 카드 규칙은 변경하지 않는다.
- private state를 새 UI로 노출하지 않는다.
- 상대 플레이어에게는 기존처럼 총 자원 수와 개발 카드 수만 보인다.
- viewer 본인에게만 자원 종류별 수량을 표시한다.
- 1차 구현은 보기 전용 자원 hand dock 중심으로 한다.
- 개발 카드 상세 hand dock, 카드 사용 interaction, 모바일 bottom sheet는 후속 단계로 분리한다.
- 모바일에서는 하단 UI가 보드, 주사위, 모달 버튼을 가리지 않아야 한다.

## 단계 분리

### PLAYER-HAND-UI-1: 자원 hand dock

1차 구현 범위다.

- 하단 hand dock 추가
- viewer 본인의 자원 카드 5종 표시
- 플레이어 패널에서 viewer 본인의 상세 자원 breakdown 제거
- 플레이어 패널은 모든 플레이어에 대해 공개 요약 중심으로 통일
- 온라인/오프라인 viewer 기준 명시
- private state 정적 테스트 추가
- 모바일은 우선 가로 스크롤 hand row로 처리

### PLAYER-HAND-UI-2: 개발 카드 hand dock

후속 작업이다.

- viewer 본인의 개발 카드 목록 또는 카드 묶음 표시
- 이번 턴 구매 카드, 사용 가능 카드, usedDevThisTurn 상태 구분
- 기존 개발 카드 패널 제거 또는 축소 여부 결정
- 개발 카드 private state 테스트 강화

### PLAYER-HAND-UI-3: 모바일 bottom sheet

후속 작업이다.

- collapsed hand bar
- expand/collapse interaction
- `aria-expanded`
- 모달, 주사위, 보드 확대 버튼과 z-index 충돌 검증

### PLAYER-HAND-UI-4: 카드 interaction 연결

후속 작업이다.

- hand dock에서 개발 카드 사용
- hand dock에서 교환/건설 비용 선택 보조
- drag and drop은 별도 검토 전까지 제외

## 1차 범위

### 포함

- 데스크탑 하단 hand dock 추가
- 내 자원 카드 5종을 실제 카드 덱처럼 표시
- 플레이어 패널에서 viewer 본인의 상세 자원 breakdown 제거
- 플레이어 패널은 모든 플레이어에 대해 총 자원 수와 개발 카드 수만 표시
- viewer 판정 helper 추가
- 모바일 1차 대응: 가로 스크롤 hand row
- private state 정적 테스트 추가

### 제외

- 개발 카드 상세 hand dock
- 개발 카드 사용 버튼/펼침 UI
- 모바일 bottom sheet
- drag and drop 카드 사용
- 손패에서 바로 교환/건설 비용 자동 선택
- 카드 이미지 asset 추가
- 상대 손패 추정 UI

## viewer 판정 정책

### 온라인

온라인에서는 `game.viewerSeatIndex`가 명확한 경우 해당 seat의 player를 viewer hand의 기준으로 삼는다.

fallback 우선순위:

1. `game.viewerSeatIndex`가 정수이고 `game.players[viewerSeatIndex]`가 있으면 해당 player
2. `onlineSession.playerId`로 `onlineSession.state.players`와 `game.players`를 매칭할 수 있으면 해당 player
3. viewer를 확정할 수 없으면 hand dock을 숨긴다

온라인 상대 화면에는 resource type breakdown이나 개발 카드 type이 렌더링되면 안 된다.

### 오프라인

오프라인은 hotseat 화면이므로 완전한 private hand 개념이 약하다. 1차 구현에서는 현재 조작 중인 `currentPlayer()`의 자원 hand를 하단에 표시한다.

오프라인 정책:

- 현재 차례 player 기준으로 hand dock 표시
- 턴이 넘어가면 hand dock도 active player 기준으로 갱신
- 오프라인에서는 같은 화면을 함께 보는 전제이므로 private state 보안 테스트 대상은 온라인보다 낮지만, UI 구조는 온라인과 같은 helper를 재사용한다

### reconnect/hydrate

- hydrate 직후 이전 viewer의 hand가 남아 있으면 안 된다.
- state 수신 후 viewer 기준이 불명확하면 hand dock을 비우거나 숨긴다.
- viewer 기준이 확정되면 최신 state로 다시 렌더링한다.

## UX 방향

### 데스크탑

- 화면 하단에 `player-hand-dock`을 둔다.
- 보드 영역과 우측 패널을 가리지 않는 높이로 제한한다.
- 권장 높이 상한: 112~140px.
- 자원 카드는 현재 mini-card보다 조금 큰 실제 카드 비율을 사용한다.
- 카드 구성:
  - 상단: Tabler 자원 아이콘
  - 중앙/하단: 수량 badge
  - 카드명은 공간이 충분하면 표시하고, 부족하면 `title`/`aria-label`로 유지
- dock은 모달보다 낮은 z-index를 사용한다.

### 모바일 1차

- bottom sheet는 1차에서 제외한다.
- 모바일은 가로 스크롤 hand row로 처리한다.
- 320px/375px/390px에서 카드가 버튼과 겹치지 않아야 한다.
- 카드명은 숨기고 아이콘 + 수량 중심으로 축약할 수 있다.
- 모달이 열리면 dock이 모달 action을 가리지 않아야 한다.

## 정보 구조

### 플레이어 패널

플레이어 패널에는 다음 공개 정보만 유지한다.

- 이름
- 턴/상태 badge
- 승점
- 기사/도로 관련 공개 수치
- 총 자원 수
- 개발 카드 총 수

viewer 본인도 플레이어 패널에서는 상세 자원 breakdown을 표시하지 않는다. 상세 자원 정보는 hand dock으로 이동한다.

### 하단 hand dock

1차 구현에서 viewer 본인에게만 다음을 표시한다.

- 목재 수량
- 벽돌 수량
- 양모 수량
- 곡물 수량
- 광석 수량

개발 카드 영역은 1차에서 표시하지 않거나, 기존 개발 카드 패널을 그대로 유지한다. 개발 카드 hand dock은 후속 단계에서 다룬다.

## 구현 계획

### 1. DOM 구조 추가

`index.html`에 하단 hand dock 영역을 추가한다.

예상 구조:

```html
<section id="playerHandDock" class="player-hand-dock" aria-label="내 자원 손패">
  <div id="playerResourceHand" class="hand-card-row"></div>
</section>
```

실제 위치는 기존 `main.app` 레이아웃을 보고 정한다. 데스크탑에서 board/control layout 아래에 배치하되, 스크롤/높이 계산이 깨지지 않아야 한다.

### 2. 렌더링 helper 추가

`script.js`에 다음 helper를 추가한다.

- `handViewerPlayer()`
- `renderPlayerHandDock()`
- `renderResourceHandCards(player)`
- `resourceHandCardHtml(type, amount)`

기존 `renderResourceBreakdown()`은 플레이어 패널 상세 표시에서 제거하거나 hand dock 전용으로 이름을 바꾼다.

### 3. 플레이어 패널 정리

`renderSeats()` 또는 플레이어 row 렌더링에서 다음 정책을 적용한다.

- 본인/상대 모두 자원은 총량 카드만 표시
- 본인/상대 모두 개발 카드는 총량 카드만 표시
- 상세 자원 아이콘 5종 breakdown은 player hand dock으로 이동

private state 보호를 위해 observer용 public state에서 상세 자원이 없는 경우 기존 generic summary만 유지한다.

### 4. 스타일 추가

`styles.css`에 다음을 추가한다.

- `.player-hand-dock`
- `.hand-card-row`
- `.hand-resource-card`
- `.hand-card-count`

디자인 기준:

- 현재 Tabler icon set 사용
- 현재 mini-card보다 조금 더 실제 카드 비율
- dominant beige/cream으로 과하게 기울지 않게 보드/패널 색상과 균형 유지
- 카드 텍스트가 좁은 viewport에서 겹치지 않게 처리
- 모바일은 가로 스크롤을 우선 사용

## 기존 개발 카드 패널 처리

1차에서는 기존 개발 카드 패널을 유지한다.

이유:

- 개발 카드 상세는 private state 위험이 더 크다.
- `boughtRound`, `boughtTurnSeat`, `usedDevThisTurn` 상태 표시가 필요하다.
- 카드 사용 interaction과 연결되면 1차 범위가 커진다.

후속 PLAYER-HAND-UI-2에서 다음 중 하나를 결정한다.

- 개발 카드 패널 제거 후 hand dock으로 통합
- 개발 카드 패널을 공개/요약 패널로 축소
- hand dock은 카드 묶음만 표시하고 기존 패널에서 사용 action 유지

## private state 검증

필수 확인:

- `viewerSeatIndex=0`일 때 player 1의 resource type 텍스트/아이콘이 hand dock과 player row 어디에도 렌더링되지 않는다.
- `viewerSeatIndex=1`로 바꾸면 hand dock 내용이 player 1 기준으로 바뀐다.
- 상대 player row에는 resource type breakdown이 표시되지 않는다.
- 상대 개발 카드 type이 렌더링되지 않는다.
- public player object에 `devCount`만 있고 `dev`가 없을 때 개발 카드 이름이 렌더링되지 않는다.
- hydrate 직후 stale hand가 남지 않고 최신 state로 교체된다.
- robber result, production cue, devCardBought cue의 기존 sanitize 정책을 유지한다.

후속 개발 카드 hand dock 구현 시 추가 확인:

- DOM text 검사에서 `기사`, `풍년`, `독점`, `도로 건설`, `승점`이 상대 hand에 노출되지 않는다.
- 이번 턴 구매 카드가 사용 가능으로 표시되지 않는다.
- `usedDevThisTurn`이 true이면 사용 가능한 카드도 비활성 상태로 표시된다.

## reduced-motion / accessibility

- hand dock은 정보 전달이 animation에 의존하면 안 된다.
- 카드 hover/focus motion은 reduced-motion에서 제거하거나 최소화한다.
- 카드에는 `aria-label`을 제공한다.
- 아이콘만 있는 카드/버튼은 accessible name을 유지한다.
- 모바일 가로 스크롤 영역은 키보드 접근이 가능해야 한다.

## 테스트 계획

필수 실행:

```text
node --check script.js
node --check server.js
node scripts/game-feel-icon-asset-static-test.js
node scripts/game-feel-quality-gate-static-test.js
```

추가 정적 테스트:

```text
node scripts/player-hand-ui-static-test.js
```

검증 항목:

- `#playerHandDock` 존재
- `#playerResourceHand` 존재
- viewer hand dock 렌더링 helper 존재
- 플레이어 패널 상세 자원 breakdown 제거
- 상대 private resource/dev type 미노출 패턴 확인
- 모바일 CSS guardrail 확인
- reduced-motion guardrail 확인

브라우저 확인:

- 데스크탑에서 hand dock이 보드/우측 패널과 겹치지 않는다.
- 모바일 320/375/390 폭에서 hand dock이 주요 버튼을 가리지 않는다.
- 온라인 2클라이언트 상황에서 각 viewer는 자기 hand만 상세로 본다.
- reconnect/hydrate 후 hand dock이 최신 state로 갱신된다.

## release blocker 기준

다음은 release blocker로 본다.

- 온라인 상대 resource type 노출
- 온라인 상대 개발 카드 type 노출
- hand dock과 player panel의 자원 총량 불일치
- 모바일 320px에서 hand dock이 필수 action button 또는 modal action을 가림
- reconnect/hydrate 후 이전 viewer hand가 남는 문제
- uncaught runtime error

다음은 P1로 본다.

- 개발 카드 사용 가능 상태 오표시
- hand dock이 특정 desktop viewport에서 보드 일부를 가림
- reduced-motion에서 불필요한 반복 animation 유지

## 산출물

구현 시 다음 문서를 추가한다.

- `docs/tests/2026-05-27_player-hand-ui-test-plan.md`
- `docs/reports/2026-05-27_player-hand-ui-final-report.md`

정적 테스트 추가:

- `scripts/player-hand-ui-static-test.js`

필요 시 known issue 추가:

- `docs/issues/`

## 주요 위험

- 하단 dock이 모바일에서 보드 또는 action button을 가릴 수 있다.
- 플레이어 패널에서 내 상세 자원을 제거하면 기존 정보 접근 습관이 바뀐다.
- 온라인 viewer 분기를 잘못 타면 private state leak이 된다.
- hand dock과 기존 개발 카드 패널이 같은 정보를 중복 표시할 수 있다.
- 데스크탑/모바일 레이아웃 분기가 늘어나면 브라우저 검증 없이 깨질 가능성이 있다.

## 최종 판단

이 작업은 단순 스타일 변경이 아니라 private 정보 구조를 재배치하는 UI 기능이다. 1차 구현은 자원 hand dock과 플레이어 패널 공개 요약화로 제한하는 것이 적절하다.

권장 구현 순서:

1. 자원 보기 전용 hand dock
2. 플레이어 패널 공개 요약화
3. private state 정적 테스트
4. 모바일 가로 스크롤 검증
5. 개발 카드 hand dock 후속 계획으로 분리
