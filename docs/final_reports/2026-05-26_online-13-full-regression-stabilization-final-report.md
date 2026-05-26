# 온라인 13단계 전체 회귀 테스트 및 안정화 최종 보고서

작성일: 2026-05-26

## 목표

온라인 1~12단계와 11-1 보강 이후 새 기능 추가보다 전체 안정화, 회귀 테스트, 공식 규칙 감사, privacy audit, known issues 정리를 우선했다. P0/P1 후보는 가능한 범위에서 즉시 수정하고, 실제 브라우저/기기 검증이 필요한 항목은 별도 문서에 남겼다.

## 참고 문서

- `catan_implementation_process_guideline.md`
- `docs/implementation_plans/2026-05-26_online-13-full-regression-stabilization-plan.md`
- `docs/test_plans/2026-05-26_online-13-manual-regression-test-plan.md`
- `docs/test_plans/2026-05-26_online-13-official-rules-audit.md`
- 공식 규칙 참조: https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf

## 변경 사항

### P1 후보 수정

- `script.js`
  - `lastRobberResult.id` 기준 결과 모달 반복 표시를 방지했다.
  - `roomId/playerId/result.id` 조합을 `sessionStorage`에 저장해 같은 세션 새로고침에서 같은 강도 결과 모달이 다시 뜨지 않도록 했다.

- `server.js`
  - 은행 재고 부족 생산 규칙을 공식 규칙에 맞게 보정했다.
  - 같은 부족 자원을 여러 플레이어가 생산받아야 하는데 은행 재고가 전체 수요보다 적으면 해당 자원은 아무도 받지 않는다.
  - 한 플레이어만 영향을 받는 경우에는 은행에 남은 만큼 지급할 수 있게 했다.

### 테스트 보강

- `scripts/online-12-robber-seven-pending-ws-test.js`
  - 은행 재고 부족 시 여러 플레이어 대상 동일 자원 생산이 모두 차단되는 회귀 테스트를 추가했다.

- `scripts/online-08-basic-building-ws-test.js`
  - 공식 생산 규칙 보정으로 테스트 fixture가 은행 재고에 흔들리지 않도록 필요한 건설 자원을 명시적으로 세팅했다.

## 자동 테스트 결과

### 문법 검사

모두 PASS.

```text
node --check server.js
node --check script.js
node --check scripts/online-08-basic-building-ws-test.js
node --check scripts/online-09-bank-trade-ws-test.js
node --check scripts/online-10-player-trade-ws-test.js
node --check scripts/online-10-1-player-trade-ui-static-test.js
node --check scripts/online-11-development-cards-ws-test.js
node --check scripts/online-12-robber-seven-pending-ws-test.js
```

### WebSocket/정적 회귀

모두 PASS.

```text
node scripts/online-08-basic-building-ws-test.js
node scripts/online-09-bank-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
node scripts/online-10-1-player-trade-ui-static-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-12-robber-seven-pending-ws-test.js
```

### 미실행 자동 테스트

```text
online-01 ~ online-07 전용 WebSocket 테스트
online-11-1 전용 WebSocket 테스트
```

사유: 현재 `scripts` 디렉터리에 해당 단계 전용 실행 파일이 없다. 11-1 보강 항목은 `online-11-development-cards-ws-test.js`에 통합되어 실행했다.

## 수동 검증 요약

상세 결과는 `docs/test_plans/2026-05-26_online-13-manual-regression-test-result.md`에 기록했다.

### Smoke

- 로컬 `http://127.0.0.1:4173/?test=1` 로드: PASS
- 페이지 제목, 모드 버튼, 19개 보드 타일, 초기 주사위 버튼 disabled, 콘솔 오류 없음 확인.
- 실제 Chrome 3기기/LAN 전체 플레이: NOT RUN

### Core Rules

- 건설, 은행/항구 교환, 플레이어 교환, 개발 카드, 7/강도 WebSocket core rules: PASS
- 은행 재고 부족 생산 공식 규칙: PASS
- 실제 브라우저 모달 클릭 UX: NOT RUN

### Recovery And Privacy

- WebSocket payload privacy: PASS
- `devDeck` 미노출, 상대 dev/resources 상세 미노출, `hiddenVictoryPoints` 미노출, robber result resource actor/victim 한정 공개, playerTrade role별 필터링 확인.
- `lastRobberResult` 반복 표시: FIXED / 실제 새로고침 수동 검증은 미실행.
- pending UI 복구와 reconnect-waiting 우선순위: 코드/상태 구조 확인, 실기기 수동 검증은 미실행.

### Offline Smoke

- 오프라인 초기 화면과 보드 로드: PASS
- 오프라인 7/강도 실제 클릭 회귀: NOT RUN

## 공식 규칙 감사 요약

상세 감사는 `docs/test_plans/2026-05-26_online-13-official-rules-audit.md`에 반영했다.

- 초기 배치, 턴 순서, 일반 생산, 7/강도 pending, 기사 카드, Largest Army, 개발 카드, 은행/항구 교환, 플레이어 교환, 건설, 승리 판정은 현재 자동 테스트/코드 감사 기준 구현되어 있다.
- 은행 재고 부족 생산은 13단계에서 공식 규칙에 맞게 수정했다.
- Longest Road의 복잡한 분기/순환/상대 마을 차단 edge case는 P2 후속 감사 항목으로 남겼다.

## Known Issues

상세 목록은 `docs/known_issues/2026-05-26_online-13-known-issues.md`에 기록했다.

- P0: 없음
- P1: 없음
- P2: 실제 Chrome 3기기/LAN 검증 공백, 모달 UX 수동 검증 공백, pending/reconnect 실기기 검증 공백, Longest Road 복잡 edge case 감사 부족, 오프라인 7/강도 실브라우저 검증 공백
- P3: Safari 보조 검증 미실행, online-01~07 전용 테스트 부재, favicon 404

## 최종 판정

자동 테스트, WebSocket 회귀, 로컬 브라우저 smoke, 코드 기반 privacy/rules audit 기준으로 남은 P0/P1은 없다.

다만 실제 Chrome 3기기 LAN 플레이와 일부 브라우저 모달 상호작용은 현재 실행 환경에서 검증하지 못했다. 따라서 13단계 기준 최종 실기기 “사용 가능” 판정은 보류하며, Chrome 실기기 수동 회귀를 통과한 뒤 확정하는 것이 맞다. Safari는 보조 검증 대상으로 분리한다.
