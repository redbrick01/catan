# 온라인 13단계 전체 회귀 테스트 계획 및 실행 목록

작성일: 2026-05-26

## 목적

온라인 1~12단계와 11-1 보강 이후 전체 안정화 상태를 확인한다. 새 기능 추가보다 자동 회귀, 수동 검증 가능 범위 확인, 공식 규칙 감사, privacy audit, known issues 분류를 목표로 한다.

## 자동 테스트 실행 대상

### 문법 검사

실행:

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

### WebSocket/정적 테스트

실행:

```text
node scripts/online-08-basic-building-ws-test.js
node scripts/online-09-bank-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
node scripts/online-10-1-player-trade-ui-static-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-12-robber-seven-pending-ws-test.js
```

미실행:

```text
online-01 ~ online-07 전용 WebSocket 테스트
online-11-1 전용 WebSocket 테스트
```

사유:

```text
현재 scripts 디렉터리에 해당 단계 전용 실행 파일이 없다.
11-1 항목은 online-11-development-cards-ws-test.js에 통합되어 실행된다.
```

## 브라우저 검증 대상

로컬 브라우저 smoke:

```text
http://127.0.0.1:4173/?test=1
페이지 제목, 모드 버튼, 보드 타일 19개 렌더링, 콘솔 오류 없음 확인
```

미실행:

```text
실제 Chrome 3기기/LAN 수동 플레이
Safari 보조 검증
iPhone Chrome 모바일 검증
```

사유:

```text
현재 실행 환경에서 외부 실제 기기와 Safari 브라우저에 접근할 수 없다.
Codex in-app browser 입력 자동화가 환경 클립보드 오류로 텍스트 입력 단계에서 제한되었다.
```

## 13단계 우선 검증 항목

- `lastRobberResult.id` 기준 결과 모달 반복 표시 방지
- pending UI hydrate/reconnect 복구
- reconnect-waiting 모달 우선순위
- 오프라인 7/강도 기존 동작 회귀
- devDeck, 상대 dev/resources, hiddenVictoryPoints, discard/robber/playerTrade 정보 노출 여부
- 공식 규칙과 생산, 7/강도, 개발 카드, 거래, 건설, 승리 조건 대조

## 수정 반영 항목

- P1 후보: `lastRobberResult`가 새로고침 후 같은 id로 반복 표시될 수 있는 문제를 `sessionStorage` 기반으로 보강했다.
- P1 후보: 은행 재고 부족 시 여러 플레이어에게 같은 자원을 모두 지급할 수 없으면 아무도 받지 않는 공식 규칙을 서버 생산 로직에 반영했다.
- 회귀 테스트 보강: online-12 테스트에 은행 재고 부족 다중 생산 차단 검증을 추가했다.

## 완료 기준

- 자동 테스트 전부 통과
- privacy audit에서 P0/P1 노출 없음
- 공식 규칙 감사에서 수정 가능한 P0/P1 처리
- 실제 기기 수동 미검증 항목은 최종 보고서와 known issues에 명확히 기록
