# FEEL-005 아이콘/이미지 자산 체계 계획

작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

자원, 행동, 상태 아이콘 언어를 통일하고, 외부 asset 사용 시 출처와 라이선스를 관리한다.

## 범위

- 자원 아이콘 체계
- 행동 아이콘 체계
- 상태 아이콘 체계
- asset 경로 규칙
- `docs/assets_manifest.md`

## 현재 아이콘 사용 현황

현재 프로젝트는 별도 아이콘 라이브러리 없이 아래 표현을 섞어 사용한다.

- 자원: `script.js`의 `RESOURCES` 상수에 emoji 기반 icon 보유
- 자원 표시: `resourceDisplayName()`이 `emoji + 이름` 형태를 반환
- 건물: `drawModernSettlementIcon()`, `drawModernCityIcon()` inline SVG 사용
- 도둑: board SVG 내부 custom token/overlay 사용
- 버튼: 대부분 visible text 중심
- 상태: 텍스트 badge와 class 중심

1차 목표는 새 자산을 대량 추가하는 것이 아니라, 현재 표현을 token 단위로 정리하고 같은 의미가 UI마다 다르게 보이지 않게 하는 것이다.

## 1차 범위와 제외 범위

1차 적용 범위:

- `RESOURCES` 기반 자원 표시
- 비용표/자원 요약/교환 UI의 자원 아이콘 일관화
- 건설 버튼의 action icon 보조 표시
- 교환 버튼/상태 badge의 단순 inline icon 보조 표시
- 신규 파일 asset이 필요한 경우 `docs/assets_manifest.md` 작성

1차 제외 범위:

- 대형 bitmap 배경 이미지
- 외부 아이콘 라이브러리 도입
- 보드 전체 토큰의 파일 asset 전환
- 주사위 3D dice asset 파일화
- 도둑 token을 외부 이미지로 교체
- 아이콘 단독 버튼으로 전체 UI 재설계

## 자산 경로

```text
assets/icons/resource-*.svg
assets/icons/action-*.svg
assets/icons/status-*.svg
assets/sounds/*.mp3
```

경로는 파일 asset을 추가할 때만 사용한다. 기존 inline SVG/CSS/emoji로 충분한 경우 새 파일을 만들지 않는다.

권장 파일명:

```text
assets/icons/resource-forest.svg
assets/icons/resource-field.svg
assets/icons/resource-pasture.svg
assets/icons/resource-hill.svg
assets/icons/resource-mountain.svg
assets/icons/action-road.svg
assets/icons/action-settlement.svg
assets/icons/action-city.svg
assets/icons/action-dev-card.svg
assets/icons/action-trade.svg
assets/icons/action-dice.svg
assets/icons/status-my-turn.svg
assets/icons/status-pending.svg
assets/icons/status-bot.svg
assets/icons/status-robber.svg
```

## 아이콘 token taxonomy

코드에서 사용할 token은 아래 이름을 기준으로 통일한다.

### 자원 토큰

| Token | Game type | 표시명 | 현재 표현 | 1차 방침 |
| --- | --- | --- | --- | --- |
| `resource.forest` | `forest` | 목재 | `🌲` | 유지하되 token화 |
| `resource.field` | `field` | 곡물 | `🌾` | 유지하되 token화 |
| `resource.pasture` | `pasture` | 양모 | `🐑` | 유지하되 token화 |
| `resource.hill` | `hill` | 벽돌 | `🧱` | 유지하되 token화 |
| `resource.mountain` | `mountain` | 광석 | `⛏` | 유지하되 token화 |

### 행동 토큰

| Token | 대상 | 1차 표현 | 비고 |
| --- | --- | --- | --- |
| `action.road` | 도로 건설 | inline span 또는 CSS icon | visible text 유지 |
| `action.settlement` | 마을 건설 | 기존 settlement SVG 언어 참조 | visible text 유지 |
| `action.city` | 도시 업그레이드 | 기존 city SVG 언어 참조 | visible text 유지 |
| `action.devCard` | 개발 카드 구매/사용 | card glyph 또는 inline CSS card | 카드 종류 노출 금지 |
| `action.trade` | 은행/플레이어 교환 | swap glyph 또는 inline CSS | visible text 유지 |
| `action.dice` | 주사위 굴림 | CSS dice 우선 | FEEL-002와 연결 |

### 상태 토큰

| Token | 대상 | 1차 표현 | 비고 |
| --- | --- | --- | --- |
| `status.myTurn` | 내 차례 | badge dot/icon + text | FEEL-001 |
| `status.pending` | 행동 필요 | badge icon + text | FEEL-001/004 |
| `status.waiting` | 대기 중 | subdued badge | 텍스트 우선 |
| `status.bot` | 봇 | 기존 bot badge 보강 | accessible name 유지 |
| `status.robber` | 도둑/7 | 기존 robber SVG/CSS | FEEL-004 |
| `status.error` | 실패/오류 | warning glyph + text | 사운드 의존 금지 |

## 표현 방식 선택 기준

| 방식 | 사용 조건 | 주의 |
| --- | --- | --- |
| Emoji | 기존 `RESOURCES`처럼 이미 의미가 명확하고 텍스트가 함께 있는 경우 | OS별 모양 차이를 허용해야 함 |
| Inline SVG | 보드 토큰, 건물, 도둑처럼 위치/색상/상태와 강하게 연결된 경우 | hit target과 분리 |
| CSS icon | 간단한 badge/dot/card/swap 표현 | 의미 단독 전달 금지 |
| File SVG asset | 여러 위치에서 같은 복잡한 아이콘을 반복 사용하고 inline 유지가 번거로운 경우 | manifest 필수 |
| Bitmap image | 아이콘으로 표현하기 어려운 실제 자산이 필요할 때 | 이번 단계 1차 범위 밖 |

외부 아이콘 라이브러리 도입은 1차 범위에서 보류한다. 도입이 필요하면 별도 검토로 분리하고, 번들 영향, 라이선스, tree-shaking 가능 여부, 로딩 방식을 문서화한다.

## 라이선스 기준

- 직접 제작, CC0, 또는 명시적으로 재배포 가능한 라이선스만 사용.
- 출처와 라이선스가 불명확한 asset 커밋 금지.
- 외부 asset 수정 시 원본 출처와 수정 내용을 기록.
- 라이선스 URL 또는 원문을 확인할 수 없는 asset은 사용하지 않는다.
- attribution이 필요한 asset은 manifest와 README 또는 별도 NOTICE 반영 여부를 함께 기록한다.

## 구현 후보

- 기존 CSS/SVG로 가능한 것은 새 파일 없이 구현.
- 파일 asset 추가 시 `docs/assets_manifest.md` 생성.
- 아이콘에는 텍스트 또는 `aria-label` 대체 제공.
- `RESOURCES`의 icon 값을 직접 흩뿌리지 않고 `resourceIconToken` 또는 equivalent helper로 감싼다.
- decorative icon에는 `aria-hidden="true"`를 적용한다.
- semantic icon-only control은 visible text 또는 accessible name이 있을 때만 허용한다.

## 접근성 기준

아이콘은 decorative와 semantic으로 나눈다.

| 유형 | 기준 | 처리 |
| --- | --- | --- |
| Decorative | 옆에 같은 의미의 텍스트가 있음 | `aria-hidden="true"` |
| Semantic | 아이콘 자체가 상태/행동 의미를 전달함 | visible text, `aria-label`, 또는 `title`/tooltip 보강 |
| Icon-only button | 공간상 텍스트가 없는 버튼 | 명확한 accessible name 필수, 모바일 hit target 유지 |
| Resource icon | 자원명 텍스트와 함께 표시 | icon은 장식 처리 가능 |
| Status badge | 상태를 보조함 | 상태 텍스트와 함께 제공 |

아이콘만으로 의미를 전달하지 않는다. 색상만으로 자원/상태를 구분하지 않고 텍스트 또는 accessible name을 함께 둔다.

## private state 아이콘 기준

FEEL-002~004의 private state 정책을 아이콘에도 동일하게 적용한다.

금지:

- 상대 자원 생산에서 자원 종류별 아이콘 표시
- 상대 약탈 결과에서 실제 약탈 자원 아이콘 표시
- 개발 카드 구매 시 구매한 카드 종류 아이콘 표시
- 상대의 비공개 손패나 보유량을 유추할 수 있는 아이콘 표시

허용:

- 공개 보드 타일의 자원 타입 아이콘
- 내가 받은 자원의 종류별 아이콘
- 공개된 교환 제안의 자원 아이콘
- 공개적으로 사용된 개발 카드 종류 아이콘
- observer에게는 generic card/resource icon

## 모바일/밀도 기준

- 아이콘은 본문 텍스트보다 먼저 줄바꿈을 유발하지 않아야 한다.
- 작은 버튼 안 아이콘은 14~16px 수준을 기본으로 한다.
- 자원 row, trade row, modal action button은 텍스트가 잘리는 경우 아이콘을 축소하거나 숨긴다.
- 모바일에서는 icon-only 전환보다 텍스트 유지가 우선이다.
- 버튼 높이와 touch target은 아이콘 추가 후에도 줄어들면 안 된다.

## 완료 기준

- 같은 자원/행동은 모든 UI에서 같은 아이콘을 사용한다.
- 아이콘만으로 의미를 전달하지 않는다.
- asset manifest가 최신이다.
- private state로 볼 수 없는 정보가 아이콘으로 노출되지 않는다.
- 모바일에서 아이콘 추가로 버튼 텍스트가 잘리거나 주요 action이 밀려나지 않는다.
- 신규 file asset 없이 가능한 아이콘은 inline/CSS/emoji 방식으로 처리된다.

## 테스트 초안

- asset manifest에 모든 신규 asset 포함.
- 아이콘 버튼에 accessible name 존재.
- 외부 라이선스가 누락된 asset 없음.
- `resourceDisplayName()` 또는 equivalent helper가 모든 resource type에서 일관된 표시를 반환.
- 비용표, 내 자원, 은행 교환, 플레이어 교환에서 같은 resource token 사용.
- decorative icon에 `aria-hidden="true"` 적용.
- icon-only control이 있다면 accessible name 존재.
- 상대 생산/약탈/개발 카드 구매 화면에서 비공개 자원/카드 종류 아이콘 미노출.
- 320px 모바일 폭에서 건설 버튼과 교환 row 텍스트가 잘리지 않음.
- manifest에 없는 신규 `assets/` 파일이 없음.
- 외부 asset을 추가하지 않은 경우 manifest가 불필요하게 생성되지 않음.

## 아이콘 적용 매트릭스

| 영역 | 적용 대상 | 1차 방식 |
| --- | --- | --- |
| 자원 표시 | 내 자원, 비용표, 교환 UI | 기존 텍스트 + 작은 아이콘 |
| 건설 버튼 | 도로/마을/도시 | 텍스트 유지 + icon span |
| 교환 | 은행/플레이어 교환 | swap icon + 텍스트 |
| 주사위 | roll button/dice panel | CSS dice 우선 |
| 도둑 | robber token/status | 기존 SVG 보강 |
| 상태 | 내 차례/대기/봇 | badge icon 선택 |

우선순위:

1. 자원 token 일관화
2. 비용표/자원 summary/교환 UI 적용
3. 건설 버튼 action icon 보조
4. 상태 badge icon 보조
5. 새 파일 asset 필요 여부 재검토

## 구현 순서

1. 현재 코드 내 자원 type 이름과 표시 위치 조사.
2. 자원/행동 icon token 이름 확정.
3. `RESOURCES` 기반 표시 helper를 token 기준으로 정리.
4. 새 파일 없이 가능한 CSS/SVG inline icon 먼저 적용.
5. private state 화면에서 아이콘 노출 여부 검토.
6. 모바일 버튼/row 레이아웃 확인.
7. 외부 asset 필요 여부 판단.
8. asset 추가 시 `docs/assets_manifest.md` 생성/갱신.
9. aria-label 또는 visible text 존재 확인.

## assets_manifest.md 초안

```text
| 경로 | 유형 | 출처 | 저자 | 라이선스 | 라이선스 URL | 원본 URL | 수정 여부 | 파생 여부 | 추가일 | 용도 | 출처 표기 필요 여부 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

기준:

- 직접 제작한 asset도 `Source = self-made`로 기록한다.
- 외부 asset은 원본 URL과 라이선스 URL을 모두 기록한다.
- 수정한 asset은 `Derivative = yes`로 기록하고 `Modified`에 요약한다.
- attribution이 필요한 경우 README/NOTICE 반영 위치를 기록한다.
- 파일 asset을 추가하지 않는 단계라면 manifest 생성은 필수가 아니다.

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 아이콘만으로 의미 전달 | 텍스트 유지 또는 aria-label |
| 라이선스 누락 | manifest 없는 asset 커밋 금지 |
| UI 밀도 증가 | 모바일에서 아이콘 숨김/축소 검토 |
| 기존 색상 의미와 충돌 | 자원 색상 token과 매핑 |
| emoji OS별 표시 차이 | 의미 텍스트를 항상 함께 표시 |
| private 정보 아이콘 노출 | viewer-safe cue 기준을 아이콘에도 적용 |
| 외부 라이브러리 과도 도입 | 1차 범위에서는 보류, 필요 시 별도 검토 |
| inline SVG 중복 증가 | 복잡한 반복만 file asset 후보로 승격 |

## 단계 완료 게이트

- 신규 asset 전부 manifest에 기록.
- 주요 버튼 accessible name 유지.
- 자원/행동 아이콘이 일관된 이름 체계를 따른다.
- `forest/field/pasture/hill/mountain` resource type과 아이콘 token이 1:1로 정리된다.
- 기존 inline SVG 건물/도둑 표현을 무리하게 파일 asset으로 바꾸지 않는다.
- private state 아이콘 노출 금지 테스트를 통과한다.
- 모바일 핵심 UI에서 텍스트 가독성과 touch target이 유지된다.

## 구현 정합성 메모 - 2026-05-27

- Actual implementation uses the existing emoji, CSS, and inline SVG surface; no external icon library and no file asset are needed for FEEL-005.
- Canonical taxonomy lives in `script.js` as `ICON_TOKENS` with resource, action, and status groups.
- `RESOURCES` remains the resource text source, with forest changed from a tree glyph to a log glyph to match the FEEL-005 taxonomy.
- Action buttons, cost rows, bank/resource summaries, player status labels, lobby connection labels, discard/resource pickers, and trade resource rows use shared icon token helpers.
- Decorative icon spans use `aria-hidden="true"` while visible text, `aria-label`, `title`, or row text remains the semantic label.
- Private state handling remains delegated to existing viewer-safe state shaping and FEEL cue sanitizers: opponent resource summaries stay generic, dev-card purchase card type remains hidden, and robber observer resource type remains hidden.
- Because no file assets are added, `docs/assets_manifest.md` is intentionally not created for this stage.
