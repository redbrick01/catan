# 온라인 멀티플레이

## 목적

온라인 모드는 방장이 자기 PC에서 서버를 실행하고, 같은 네트워크 또는 접속 가능한 IP 주소로 친구들이 참여해 함께 플레이하는 것을 목표로 합니다. 공식 서비스나 대규모 매치메이킹이 아니라 소규모 방 플레이가 기준입니다.

## 현재 지원 범위

- `node server.js` 기반 HTTP 정적 서버와 WebSocket 서버
- 로컬 URL과 LAN 접속 URL 안내
- 온라인/오프라인 모드 선택
- 방 만들기, 방 코드 참가, 공유 URL 복사
- 대기실 참가자 목록 동기화
- 방장 게임 시작
- 새로고침 후 같은 플레이어로 재접속
- 서버 권위 게임 상태 관리
- 클라이언트 명령 검증
- revision 기반 상태 동기화
- 초기 배치, 주사위, 턴 종료, 건설, 교환, 개발 카드, 7/도둑 처리
- 플레이어별 private state 필터링
- 방 나가기와 새 게임 정책

## 핵심 원칙

```text
서버가 정답이다.
클라이언트는 요청만 한다.
각 클라이언트는 자기에게 허용된 정보만 받는다.
UI는 현재 방/턴/pending 상태를 분명히 보여준다.
```

## 핵심 구현 파일

```text
server.js   방, WebSocket, 서버 권위 게임 엔진, private state 생성
script.js   온라인 연결, 로비 UI, 명령 전송, 상태 렌더링
index.html  모드 선택, 방 생성/참가, 로비, 게임 화면 구조
styles.css  온라인 로비와 게임 화면 반응형 스타일
```

## 관련 구현 계획

- [온라인 MVP 로드맵](../plans/2026-05-26_online-00-mvp-roadmap.md)
- [01 서버/LAN/방](../plans/2026-05-26_online-01-server-lan-room-plan.md)
- [02 UI/로비](../plans/2026-05-26_online-02-ui-lobby-plan.md)
- [03 프로토콜 동기화](../plans/2026-05-26_online-03-protocol-sync-plan.md)
- [04 게임 엔진 마이그레이션](../plans/2026-05-26_online-04-game-engine-migration-plan.md)
- [05 재접속/private state](../plans/2026-05-26_online-05-reconnect-private-state-test-plan.md)
- [05-1 세션 이탈/새 게임 정책](../plans/2026-05-26_online-05-1-session-leave-new-game-policy-plan.md)
- [05-2 최종 방 나가기/방 종료 정책](../plans/2026-05-26_online-05-2-final-leave-room-end-policy-plan.md)
- [06 초기 배치](../plans/2026-05-26_online-06-initial-placement-plan.md)
- [07 주사위/자원/턴](../plans/2026-05-26_online-07-roll-resource-turn-plan.md)
- [08 기본 건설](../plans/2026-05-26_online-08-basic-building-plan.md)
- [09 은행/항구 교환](../plans/2026-05-26_online-09-bank-harbor-trade-plan.md)
- [10 플레이어 교환](../plans/2026-05-26_online-10-player-trade-plan.md)
- [10-1 교환 응답 검증](../plans/2026-05-26_online-10-1-player-trade-modal-response-validation-plan.md)
- [11 개발 카드](../plans/2026-05-26_online-11-development-cards-plan.md)
- [11-1 개발 카드 안정화](../plans/2026-05-26_online-11-1-development-cards-stabilization-plan.md)
- [12 7/도둑/pending action](../plans/2026-05-26_online-12-robber-seven-pending-plan.md)
- [13 전체 회귀 안정화](../plans/2026-05-26_online-13-full-regression-stabilization-plan.md)

## 관련 테스트와 보고서

- [온라인 13 전체 회귀 테스트 계획](../tests/2026-05-26_online-13-full-regression-test-plan.md)
- [온라인 13 수동 회귀 테스트 계획](../tests/2026-05-26_online-13-manual-regression-test-plan.md)
- [온라인 13 수동 회귀 테스트 결과](../tests/2026-05-26_online-13-manual-regression-test-result.md)
- [온라인 13 공식 규칙 감사](../tests/2026-05-26_online-13-official-rules-audit.md)
- [온라인 13 known issues](../issues/2026-05-26_online-13-known-issues.md)
- [온라인 13 최종 보고서](../reports/2026-05-26_online-13-full-regression-stabilization-final-report.md)

## 서버 메시지 관점의 주요 흐름

```text
createRoom 또는 joinRoom
roomCreated 또는 roomJoined
state broadcast
startGame
초기 배치 command
play phase command
pending action command
state revision 갱신
reconnect
leaveRoom
```

## 유지보수 체크리스트

- 클라이언트에서 보낸 명령은 반드시 서버에서 다시 검증합니다.
- 서버 응답에는 상대의 상세 자원, 상세 개발 카드, 숨겨진 승점이 노출되지 않아야 합니다.
- pending action은 actor와 responder별로 서로 다른 view를 만들어야 합니다.
- WebSocket 테스트가 없는 새 명령은 테스트 스크립트를 함께 추가합니다.
- 오프라인 규칙 변경이 있으면 `server.js`의 온라인 규칙과 동기화합니다.

