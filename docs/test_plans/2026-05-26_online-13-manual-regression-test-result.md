# 온라인 13단계 수동 회귀 검증 결과

작성일: 2026-05-26

## 테스트 환경

```text
실행 환경: Windows, Codex workspace
서버 명령: node server.js
로컬 URL: http://127.0.0.1:4173/?test=1
브라우저: Codex in-app browser
Chrome 3기기/LAN: NOT RUN
Safari: NOT RUN
모바일 Chrome: NOT RUN
```

제한:

```text
실제 외부 기기와 Safari에 접근할 수 없어 LAN/모바일/Safari 수동 테스트는 수행하지 못했다.
Codex in-app browser에서 입력 자동화가 환경 클립보드 오류로 제한되어 오프라인 게임 시작 이후의 클릭 기반 수동 흐름은 완주하지 못했다.
```

## Smoke

항목: 로컬 앱 로드
결과: PASS
심각도: -
기기/브라우저: Codex in-app browser
실제 결과:

```text
페이지 제목 "카탄" 확인
모드 버튼 "오프라인 게임 / 온라인 방 만들기 / 온라인 방 참가하기" 확인
보드 타일 19개 렌더링 확인
초기 주사위 버튼 disabled 확인
콘솔 error 없음
```

항목: 실제 Chrome 3인 이상 접속, 방 생성, 참가, 게임 시작, 3라운드 진행
결과: NOT RUN
심각도: P2 검증 공백
사유:

```text
외부 실제 기기/Chrome 세션을 이 환경에서 직접 제어할 수 없다.
대체 검증으로 online-08~12 WebSocket 다중 클라이언트 자동 테스트를 수행했다.
```

## Core Rules

항목: 건설/교환/개발 카드/7 강도 WebSocket core rules
결과: PASS
근거:

```text
online-08-basic-building-ws-test.js
online-09-bank-trade-ws-test.js
online-10-player-trade-ws-test.js
online-11-development-cards-ws-test.js
online-12-robber-seven-pending-ws-test.js
```

항목: 은행 재고 부족 생산 공식 규칙
결과: PASS
조치:

```text
여러 플레이어가 같은 부족 자원 생산에 영향받으면 해당 자원을 아무도 받지 않도록 서버 로직 수정.
online-12 테스트에 회귀 검증 추가.
```

항목: 실제 브라우저 모달 UX
결과: NOT RUN
심각도: P2 검증 공백
사유:

```text
입력 자동화 제한으로 discard/playerTrade/dev/robber 모달을 실제 클릭 흐름으로 완주하지 못했다.
```

## Recovery And Privacy

항목: WebSocket payload privacy
결과: PASS
근거:

```text
devDeck 배열 미노출, devDeckCount만 공개
상대 player.dev/hiddenVictoryPoints 미노출
상대 resources 상세 미노출, resourceCount만 공개
pendingAction raw 미노출, pendingActionView만 공개
lastRobberResult.resource actor/victim만 공개, others는 null
playerTrade response role별 필터 유지
```

항목: lastRobberResult 반복 표시 방지
결과: FIXED / PARTIAL
조치:

```text
sessionStorage에 roomId/playerId/result.id 키를 저장해 같은 세션 새로고침에서 같은 robber result 모달이 반복 표시되지 않도록 수정.
실제 브라우저 새로고침 수동 확인은 수행하지 못했다.
```

항목: pending actor reconnect UI 복구
결과: PARTIAL
근거:

```text
server state에 pendingActionView가 viewer별로 유지된다.
실제 브라우저 새로고침 후 modal hydrate는 수동 미검증이다.
```

항목: reconnect-waiting 우선순위
결과: PARTIAL
근거:

```text
클라이언트 modal priority에서 room-ended, reconnect-waiting이 pending action보다 먼저 처리된다.
실제 브라우저 disconnect/reconnect 수동 검증은 수행하지 못했다.
```

## Offline Smoke

항목: 오프라인 초기 화면 및 보드 로드
결과: PASS
근거:

```text
오프라인 버튼과 보드 렌더링 확인.
콘솔 error 없음.
```

항목: 오프라인 게임 시작 이후 7/강도 회귀
결과: NOT RUN
심각도: P2 검증 공백
사유:

```text
브라우저 입력 자동화가 환경 클립보드 오류로 실패했다.
오프라인 강도 로직은 서버 온라인 pendingAction과 분리되어 있으므로 코드 변경 영향은 제한적이나 실제 수동 확인이 남아 있다.
```
