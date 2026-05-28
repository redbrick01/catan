# 온라인 UI 교환 모달 아이콘 및 건설 버튼 상태 보강 계획

작성일: 2026-05-26

## 목적

플레이어 교환 모달의 자원 표시를 은행/항구 교환 모달처럼 직관적으로 만들고, 자신의 턴에 보유 자원으로 수행할 수 없는 건설 행동은 버튼 단계에서 비활성화한다.

이 패치는 게임 규칙 변경이 아니라 UI 사용성 보강이다.

## 범위

포함:

```text
플레이어 교환 요청 모달에 자원 이모티콘 표시
플레이어 교환 대기/응답/흥정/결과 모달에 자원 이모티콘 표시
자원 bundle 텍스트를 아이콘 + 이름 + 개수 형태로 정리
온라인 play phase에서 내 턴이어도 자원이 부족하면 도로/마을/도시/개발 카드 구매 버튼 비활성화
오프라인 play phase에서도 동일하게 자원 부족 건설 버튼 비활성화
비활성화된 버튼에 title로 부족 사유 표시
모바일 화면에서는 비용표와 주사위 패널 드래그/이동 비활성화
모바일 화면에서는 비용표와 주사위 패널을 일반 고정 카드처럼 표시
모바일 화면에서는 보드를 탭해 확대 보기 모달 또는 전체화면 뷰로 확인 가능
기존 서버 검증은 유지
```

제외:

```text
건설 규칙 자체 변경
서버 command 검증 완화
자동으로 건설 가능한 위치 추천
교환 알고리즘 추천
아이콘 이미지 에셋 추가
데스크톱 비용표/주사위 드래그 기능 제거
복잡한 pinch-to-zoom 보드 엔진
```

## 현재 상태

자원 데이터:

```text
script.js RESOURCES에 name/icon이 이미 있다.
은행/항구 교환 모달은 icon + name을 버튼에 사용한다.
플레이어 교환 모달은 resourceBundleText()와 createResourceBundleEditor() 중심으로 name만 주로 표시한다.
```

건설 버튼:

```text
index.html .build-actions에 road/settlement/city/dev/playDev/trade/playerTrade 버튼이 있다.
renderControls()에서 온라인/오프라인 조건에 따라 disabled 처리한다.
온라인 건설 버튼은 canUseOnlineBuildCommand() 중심이라 자원 부족이어도 버튼이 활성화될 수 있다.
실제 command는 서버에서 NOT_ENOUGH_RESOURCES로 거부된다.
```

## UI 정책

### 1. 자원 표시 정책

플레이어 교환 모달의 모든 자원 표기는 아래 형식을 따른다.

```text
🌲 목재 2
🌾 곡물 1
없음
```

적용 대상:

```text
createResourceBundleEditor()의 자원 행 label
resourceBundleText() 결과
거래 요청 요약
요청자 pending 모달의 내가 줄 자원/받을 자원
응답자 pending 모달의 상대가 줌/내가 줘야 함
흥정 모달의 내가 줄 자원/내가 받을 자원
거래 완료 결과 모달
```

구현 방향:

```text
resourceLabel(type) helper를 추가하거나 기존 RESOURCES[type] 사용을 정리한다.
resourceBundleText(bundle)는 icon과 name을 포함하도록 변경한다.
오프라인 플레이어 거래에서 별도 resourceText 계열 함수를 쓰고 있다면 같은 icon + name + count 규칙으로 맞춘다.
가능하면 온라인/오프라인 거래 표시 helper를 공유해서 표기가 갈라지지 않게 한다.
createResourceBundleEditor() label도 icon + name + 보유량으로 표시한다.
은행/항구 교환 모달의 기존 표시와 톤을 맞춘다.
```

주의:

```text
screen reader나 복사 텍스트가 너무 깨지지 않도록 이름은 반드시 함께 표시한다.
이모티콘만 단독으로 쓰지 않는다.
```

### 2. 건설 버튼 비활성화 정책

자신의 턴이고 play phase여도 아래 조건이면 버튼을 비활성화한다.

온라인:

```text
road: canUseOnlineBuildCommand()가 true이고 COSTS.road를 보유해야 활성화
settlement: canUseOnlineBuildCommand()가 true이고 COSTS.settlement를 보유해야 활성화
city: canUseOnlineBuildCommand()가 true이고 COSTS.city를 보유해야 활성화
dev: canBuyOnlineDevCard() 기존 조건 유지
playDev: canUseOnlineDevCard() 기존 조건 유지
trade/playerTrade: 기존 조건 유지
```

오프라인:

```text
road: play phase에서 주사위 후, 강제 action 없음, COSTS.road 보유 시 활성화
settlement: play phase에서 주사위 후, 강제 action 없음, COSTS.settlement 보유 시 활성화
city: play phase에서 주사위 후, 강제 action 없음, COSTS.city 보유 시 활성화
dev: play phase에서 주사위 후, COSTS.dev 보유 및 devDeck 남음 시 활성화
setup phase의 road/settlement 버튼은 비용이 없으므로 기존처럼 활성화 조건 유지
```

위치 유효성은 버튼 단계에서 판단하지 않는다.

```text
도로/마을/도시 위치가 있는지까지 버튼에서 검사하지 않는다.
보드 클릭 시 기존 위치 검증으로 처리한다.
버튼 비활성화는 자원 부족과 턴/phase/pending 상태만 반영한다.
```

버튼 title:

```text
자원 부족: "자원이 부족합니다."
주사위 전: "주사위를 굴린 뒤 사용할 수 있습니다."
내 턴 아님: "내 차례가 아닙니다."
pending 중: "진행 중인 처리를 먼저 완료해야 합니다."
```

## 구현 계획

### 1. 자원 표시 helper 정리

추가/수정 후보:

```text
resourceDisplayName(type)
resourceBundleText(bundle)
createResourceBundleEditor()
```

예상 변경:

```text
resourceBundleText({ forest: 2, hill: 1 }) -> "🌲 목재 2, 🧱 벽돌 1"
resourceBundleText(empty) -> "없음"
createResourceBundleEditor label -> "🌲 목재 (보유 3)"
```

### 2. 플레이어 교환 모달 반영

확인할 함수:

```text
showOnlinePlayerTradeComposer()
showRequesterPendingTradeModal()
showResponderPendingTradeModal()
showCounterTradeModal()
showPlayerTradeResultModal()
오프라인 플레이어 교환 모달 함수
```

반영 기준:

```text
모든 거래 조건/요약/결과에서 아이콘이 보인다.
버튼이 칸을 벗어나지 않는다.
모바일 1열에서도 텍스트가 줄바꿈된다.
```

### 3. 건설 버튼 상태 helper 추가

후보 helper:

```text
canAffordAction(action, player)
buildActionDisabledReason(action)
setActionButtonState(button, disabled, title)
```

온라인/오프라인 공통 비용 매핑:

```text
road -> COSTS.road
settlement -> COSTS.settlement
city -> COSTS.city
dev -> COSTS.dev
```

주의:

```text
온라인에서는 viewer player를 기준으로 자원 보유량을 판단한다.
오프라인에서는 currentPlayer()를 기준으로 판단한다.
상대 자원 상세가 없는 온라인 view에서 상대 차례 버튼을 판단하지 않는다. 어차피 내 턴이 아니므로 비활성화한다.
```

### 4. renderControls() 보강

온라인:

```text
onlineBuildAction이면 canUseOnlineBuildCommand()와 hasResources(viewer, COSTS[action])를 함께 확인한다.
자원 부족이면 disabled=true, title="자원이 부족합니다."
```

오프라인:

```text
setup phase는 기존 비용 없는 배치 조건 유지
play phase postRollOnly action은 기존 timing 조건 + 자원 부족 조건을 함께 반영한다.
```

서버 검증:

```text
버튼이 비활성화되어도 서버의 NOT_ENOUGH_RESOURCES 검증은 유지한다.
클라이언트 버튼은 UX 보조일 뿐이다.
```

### 5. 모바일 비용표/주사위 고정 배치

현재 상태:

```text
데스크톱에서는 비용표와 주사위 패널을 드래그할 수 있다.
모바일에서는 작은 화면에서 드래그 가능한 패널이 보드/버튼과 겹치거나 의도치 않게 움직일 수 있다.
```

보강 정책:

```text
모바일 viewport에서는 비용표와 주사위 패널의 드래그/이동 기능을 비활성화한다.
모바일에서는 비용표와 주사위 패널을 일반 카드처럼 문서 흐름 안에 고정 표시한다.
데스크톱에서는 기존 드래그 기능을 유지한다.
```

기준 viewport:

```text
CSS 기준 @media (max-width: 780px)를 모바일 기준으로 사용한다.
JS에서도 같은 기준이 필요하면 window.matchMedia("(max-width: 780px)")를 사용한다.
```

CSS 방향:

```text
모바일에서 .table-cost-card position을 static 또는 relative로 바꾼다.
모바일에서 .dice-panel position/transform 기반 드래그 흔적을 제거한다.
모바일에서 cursor: grab, dragging 시각효과를 제거하거나 비활성화한다.
모바일에서 비용표/주사위가 보드 위를 덮지 않고 control panel/board 주변의 일반 카드처럼 배치되게 한다.
```

JS 방향:

```text
installCostCardDrag 또는 비용표 드래그 핸들러가 있다면 모바일 matchMedia에서 조기 return한다.
installDiceDrag 또는 주사위 드래그 핸들러가 있다면 모바일 matchMedia에서 조기 return한다.
이미 등록된 드래그 이벤트가 있다면 pointerdown 시 모바일이면 drag 시작을 막는다.
viewport resize로 데스크톱/모바일이 전환되면 transform/dragging class를 초기화한다.
```

주의:

```text
모바일에서 주사위 굴리기 버튼 자체는 계속 눌릴 수 있어야 한다.
모바일에서 비용표는 접히거나 사라지지 말고 읽을 수 있어야 한다.
데스크톱 드래그 기능은 회귀되지 않아야 한다.
```

### 6. 모바일 보드 확대 보기

목표:

```text
모바일 화면에서 작은 보드를 정확히 보기 어렵기 때문에 보드를 탭하면 확대된 보드 뷰를 표시한다.
확대 보기에서도 현재 보드 상태, 말, 강도, 도로/마을/도시가 선명하게 보여야 한다.
```

권장 방식:

```text
모바일에서 board-wrap 또는 #board를 탭하면 board zoom modal을 연다.
확대 뷰는 기존 SVG board를 복제하거나 같은 상태를 재렌더링한 읽기 중심 모달로 표시한다.
처음 구현은 "보기 전용 확대"로 시작한다.
건설/강도 이동 같은 상호작용은 기본 보드에서 계속 처리한다.
```

이유:

```text
확대 모달 안에서 건설/강도 이동까지 모두 지원하면 클릭 좌표, selectedAction, 모바일 스크롤 충돌이 커진다.
이번 패치의 목표는 모바일 가독성 개선이므로 보기 전용 확대가 안전하다.
```

UI 정책:

```text
모바일에서 보드 아래 또는 보드 위에 "확대 보기" 버튼을 표시할 수 있다.
보드 자체 탭으로도 확대 보기 진입을 허용한다.
확대 모달에는 닫기 버튼을 명확히 표시한다.
확대 모달은 화면 대부분을 사용한다.
확대 모달 안의 보드는 가로/세로 스크롤 없이 최대한 크게 맞춘다.
모달이 열려도 현재 게임 state를 변경하지 않는다.
```

데스크톱 정책:

```text
데스크톱에서는 기본적으로 확대 보기 버튼을 숨기거나 선택 기능으로 둔다.
데스크톱 보드 드래그/클릭 기존 동작은 유지한다.
```

구현 후보:

```text
showBoardZoomModal()
hideBoardZoomModal()
isMobileViewport()
```

구현 방향:

```text
CSS로 모바일 전용 .board-zoom-button을 표시한다.
board-wrap 클릭 시 모바일이고 selectedAction이 기본 상태일 때만 확대를 연다.
건설/도로/강도 이동 등 selectedAction이 활성화된 상태에서는 보드 탭이 기존 액션을 방해하지 않게 확대를 열지 않는다.
확대 모달은 기존 modalOverlay를 재사용하거나 별도 boardZoomOverlay를 만든다.
기존 modalOverlay 재사용 시 다른 거래/강도/pending 모달과 충돌하지 않도록 modalKind를 건드리지 않는 편이 안전하다.
권장: 별도 lightweight overlay를 추가한다.
```

확대 뷰 렌더링:

```text
간단 구현: #board SVG cloneNode(true)를 overlay 안에 넣는다.
clone은 보기 전용이므로 pointer-events를 none 또는 닫기 외 이벤트 없음으로 둔다.
상태가 바뀐 뒤 다시 열면 최신 DOM을 clone한다.
```

주의:

```text
확대 보기 overlay가 기존 modalOverlay 위/아래 z-index 충돌을 일으키면 안 된다.
pending action 모달, 거래 모달이 열려 있으면 보드 확대 진입을 막는다.
확대 보기 중 ESC 또는 닫기 버튼으로 닫을 수 있게 한다.
모바일 Safari는 보조 검증으로만 기록한다.
```

## 테스트 계획

자동/정적:

```text
node --check script.js
```

가능하면 추가:

```text
온라인 UI 정적 테스트에서 resourceBundleText에 icon/name/count가 포함되는지 확인
renderControls에서 자원 부족 시 road/settlement/city/dev 버튼 disabled 확인
setup phase road/settlement는 자원 부족과 무관하게 기존 조건 유지 확인
```

수동:

```text
온라인 플레이어 교환 요청 모달에서 자원 이모티콘 표시 확인
온라인 응답자/요청자/흥정/결과 모달에서 자원 이모티콘 표시 확인
오프라인 플레이어 교환 모달에서 자원 이모티콘 표시 확인
자원이 부족한 상태에서 도로/마을/도시/개발 카드 버튼이 비활성화되는지 확인
자원이 충분하면 버튼이 다시 활성화되는지 확인
setup phase 초기 배치는 자원 부족과 무관하게 기존처럼 진행되는지 확인
모바일 폭에서 플레이어 교환 모달 버튼/텍스트가 칸 밖으로 나가지 않는지 확인
모바일에서 비용표가 보드 위를 덮지 않고 고정 카드처럼 표시되는지 확인
모바일에서 주사위 패널이 움직이지 않고 버튼만 정상 동작하는지 확인
데스크톱에서는 비용표/주사위 드래그가 기존처럼 동작하는지 확인
모바일에서 보드 탭 또는 확대 보기 버튼으로 확대 모달이 열리는지 확인
확대 모달에서 최신 보드 상태가 선명하게 보이는지 확인
확대 모달 닫기 후 게임 조작이 정상 복귀되는지 확인
건설/강도 이동 선택 중에는 보드 확대가 기존 액션을 방해하지 않는지 확인
```

## 완료 기준

```text
플레이어 교환 모달의 자원 표시가 은행/항구 교환 모달처럼 icon + name 중심으로 보인다.
거래 요약/응답/흥정/결과 모두 자원 이모티콘을 포함한다.
자원 부족 시 건설/개발 카드 구매 버튼이 사전에 비활성화된다.
setup phase 초기 배치 버튼은 비용 부족으로 잘못 비활성화되지 않는다.
서버 command 검증은 유지된다.
모바일/데스크톱에서 버튼이 칸 밖으로 벗어나지 않는다.
모바일에서 비용표와 주사위 패널이 드래그되지 않는다.
모바일에서 비용표와 주사위 패널이 일반 고정 카드처럼 표시된다.
데스크톱 비용표/주사위 드래그 기능은 유지된다.
모바일에서 보드를 확대해 볼 수 있다.
확대 보기는 게임 state를 변경하지 않는다.
확대 보기 닫기 후 기존 게임 조작이 정상 유지된다.
```

## 위험 요소와 대응

```text
이모티콘만 표시하면 자원 의미가 헷갈릴 수 있다.
대응: icon과 name을 항상 함께 표시한다.

버튼 비활성화가 위치 불가까지 판단하려 하면 복잡해질 수 있다.
대응: 위치 유효성은 기존 보드 클릭 검증에 맡기고, 버튼은 자원/턴/pending만 판단한다.

온라인 상대 차례에서 상대 자원 상세가 없으므로 비용 판단이 불가능할 수 있다.
대응: 내 턴이 아니면 먼저 비활성화하고, 비용 판단은 viewer player에 대해서만 한다.

setup phase 초기 배치가 자원 부족으로 막힐 수 있다.
대응: setup phase road/settlement는 비용 검사를 적용하지 않는다.

모바일에서 드래그 가능한 비용표/주사위가 보드나 버튼을 가릴 수 있다.
대응: 모바일에서는 드래그를 비활성화하고 일반 카드처럼 고정 배치한다.

모바일 드래그 비활성화가 데스크톱 기능까지 깨뜨릴 수 있다.
대응: CSS/JS 모두 780px 이하 조건으로 제한하고 데스크톱 회귀를 수동 확인한다.

보드 확대 탭이 건설/강도 이동 클릭을 방해할 수 있다.
대응: selectedAction이 road/settlement/city/robber/roadBuilding 등인 경우 확대를 열지 않고 기존 보드 액션을 우선한다.

확대 모달이 기존 거래/pending 모달과 겹칠 수 있다.
대응: 기존 modalKind가 있거나 modalOverlay가 열려 있으면 확대 진입을 막는다.
```
