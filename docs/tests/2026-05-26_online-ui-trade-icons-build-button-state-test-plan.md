# 온라인 UI 교환 아이콘 및 버튼 상태 패치 테스트 계획

작성일: 2026-05-26

## 대상

- 구현 계획서: `docs/plans/2026-05-26_online-ui-trade-icons-build-button-state-plan.md`
- 변경 파일: `index.html`, `script.js`, `styles.css`

## 테스트 환경

```text
OS: Windows
서버: node server.js
브라우저: Codex in-app browser
로컬 URL: http://127.0.0.1:4173/?test=1
```

## 정적/자동 테스트

```text
node --check script.js
node --check server.js
node scripts/online-10-1-player-trade-ui-static-test.js
node scripts/online-10-player-trade-ws-test.js
```

확인 항목:

- 자원 bundle 텍스트가 이모티콘 + 자원명 + 개수 형식으로 출력된다.
- 기존 온라인 플레이어 교환 10/10-1 흐름이 깨지지 않는다.
- 버튼 상태 계산 변경이 문법 오류를 만들지 않는다.

## 브라우저 검증 항목

- 데스크톱에서 보드가 19개 타일로 렌더링된다.
- 데스크톱에서 비용표는 기존처럼 드래그 가능한 absolute 패널로 유지된다.
- 데스크톱에서 보드 확대 버튼은 숨겨진다.
- 비용표 자원 표기가 이모티콘 + 자원명 + 개수로 표시된다.
- setup phase에서 도로/마을 버튼은 자원 부족과 관계없이 활성화된다.
- setup phase에서 도시/개발 카드/교환/플레이어 교환은 비활성화되고 title 사유가 표시된다.

## 모바일 수동 검증 항목

현재 실행 환경에서 viewport 전환을 직접 제어하지 못하면 최종 보고서에 미검증으로 남긴다.

- 모바일에서 비용표와 주사위 패널이 드래그되지 않고 일반 카드처럼 고정 배치된다.
- 모바일에서 확대 보기 버튼이 보인다.
- 모바일에서 보드 탭 또는 확대 보기 버튼으로 읽기 전용 확대 모달이 열린다.
- 확대 모달 닫기 버튼과 ESC로 닫힌다.
- 건설/강도 이동/무료 도로 배치 등 보드 액션이 가능한 상태에서는 확대 보기가 기존 액션을 방해하지 않는다.
- 거래/pending 모달이 열린 상태에서는 보드 확대가 열리지 않는다.

## 완료 기준

- 필수 문법 검사 PASS.
- 플레이어 교환 기존 회귀 테스트 PASS.
- 데스크톱 smoke PASS.
- 모바일 실브라우저 검증 미수행 시 미검증 항목과 남은 리스크를 최종 보고서에 기록.
