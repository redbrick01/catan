# UI와 플레이 보조

## 목적

UI는 Catan의 복잡한 상태를 플레이어가 즉시 이해하고 행동할 수 있게 만드는 계층입니다. 특히 온라인 모드에서는 로비, 연결 상태, 현재 턴, pending action, 교환 응답, 비공개 정보 표시가 게임 진행을 좌우합니다.

## 현재 지원 범위

- 모드 선택 화면
- 오프라인 플레이어 설정
- 온라인 방 생성/참가/로비 화면
- 공유 URL 표시와 복사
- 연결 상태 배지
- 플레이어 카드와 현재 턴 표시
- 보드 SVG 렌더링
- 보드 확대/축소 보조
- 주사위 패널
- 턴 단계 안내
- 건설 버튼 상태 관리
- 비용 참고 패널
- 은행 재고 패널
- 항구 패널
- 개발 카드 패널
- 은행/항구 교환 UI
- 플레이어 간 교환 모달
- 7/도둑/pending action 모달
- 봇 표시와 봇 관련 로그
- 모바일/데스크톱 반응형 보정

## 핵심 구현 파일

```text
index.html
styles.css
script.js
```

## 관련 구현 계획

- [Stage 6 UI 플레이 보조](../plans/2026-05-26_stage-6-ui-play-assists.md)
- [3단계 UX 개선 구체화 계획](../plans/2026-05-27_stage-3-ux-improvement-deepening-plan.md)
- [턴 안내 시각 효과 계획](../plans/2026-05-27_turn-guidance-visual-effects-plan.md)
- [게임성 강화를 위한 시각/모션/이미지/아이콘/사운드 계획](../plans/2026-05-27_game-feel-visual-audio-motion-plan.md)
- [온라인 02 UI/로비](../plans/2026-05-26_online-02-ui-lobby-plan.md)
- [온라인 UI 교환 아이콘/건설 버튼 상태](../plans/2026-05-26_online-ui-trade-icons-build-button-state-plan.md)
- [플레이어 교환 UX](../plans/2026-05-26_play-007-player-trade-ux.md)
- [사용자 요청 UI 흐름 수정 계획](../plans/2026-05-27_requested-ui-flow-fixes-plan.md)

## 관련 테스트와 시각 자료

- [Stage 6 테스트 계획](../tests/2026-05-26_stage-6-ui-play-assists-test-plan.md)
- [온라인 02 UI/로비 테스트 계획](../tests/2026-05-26_online-02-ui-lobby-test-plan.md)
- [온라인 UI 교환 아이콘/건설 버튼 상태 테스트 계획](../tests/2026-05-26_online-ui-trade-icons-build-button-state-test-plan.md)
- [턴 안내 시각 효과 테스트 계획](../tests/2026-05-27_turn-guidance-visual-effects-test-plan.md)
- [턴 안내 시각 효과 최종 보고서](../reports/2026-05-27_turn-guidance-visual-effects-final-report.md)
- [전체 기능 테스트 실행 스크린샷](../tests/artifacts/2026-05-26_full-feature-test-run-screenshot.png)
- [로비 브라우저 스크린샷](../tests/artifacts/2026-05-26_online-02-ui-lobby-browser.png)
- [항구 redesign 스크린샷](../tests/artifacts/2026-05-26_harbor-redesign.png)
- [플레이어 카드 redesign 스크린샷](../tests/artifacts/2026-05-26_player-card-redesign.png)
- [모바일 remediation 스크린샷](../tests/artifacts/2026-05-26_remediation-mobile.png)
- [데스크톱 remediation 스크린샷](../tests/artifacts/2026-05-26_remediation-desktop.png)

## 유지보수 체크리스트

- 버튼 disabled 상태는 서버/클라이언트 command 가능 여부와 일치해야 합니다.
- 모달은 pending action의 actor/responder/waiting 역할에 맞는 정보만 표시합니다.
- 온라인 UI는 재접속 후에도 현재 상태를 복구해야 합니다.
- 모바일 화면에서는 보드, 플레이어 카드, 로그, 액션 버튼이 서로 겹치지 않아야 합니다.
- 새 UI 상태를 추가하면 smoke 스크린샷이나 정적 회귀 테스트를 남깁니다.

## 다음 UX 고도화 초점

- 턴 안내는 `activePlayer`, `actingPlayer`, `pendingActors`, `viewerPlayer`, `currentFocusPlayer`를 분리해 상단 상태, 가이드 패널, 플레이어 카드에서 같은 진행자를 보여줍니다.
- 현재 진행자 카드 spotlight, 내 차례/pending actor dice panel pulse, primary action glow로 텍스트를 읽기 전에도 현재 진행 상태를 파악할 수 있게 합니다.
- `prefers-reduced-motion` 환경에서는 반복 애니메이션을 끄고 정적 강조만 유지합니다.
- 온라인은 `내 차례입니다`와 `내가 행동할 차례입니다`를 구분하고, 오프라인은 `플레이어명 차례입니다` 기준으로 안내합니다.
- pending action 모달은 상황, 해야 할 일, 선택 조건, 완료 후 다음 단계를 고정 구조로 안내합니다.
- 교환 모달은 1차 범위에서 모든 상대에게 제안하고 상대별 응답 상태를 표시합니다. 특정 상대 지정 교환은 후속 범위입니다.
- 로그는 이벤트 타입 class를 부여하고 중요 사건을 강조합니다. 필터 UI는 후속 작업으로 분리합니다.
- 모바일 레이아웃은 현재 진행 상태를 먼저 확인할 수 있게 상단 dice panel과 상태 라벨을 보강했습니다.
- 온라인 오류는 원인과 다음 행동을 함께 알려야 합니다.
- 모션, 아이콘, 사운드는 게임 상태 이해와 행동 만족감을 높이는 용도로만 추가합니다.
- 모션 감소, 사운드 mute, 중요 이벤트 시각 cue를 함께 고려합니다.
