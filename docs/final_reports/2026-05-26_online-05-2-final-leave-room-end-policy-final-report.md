# 온라인 모드 5-2 구현 보고서

## 작업명

온라인 5-2 최종 방 나가기/방 종료 정책 구현

## 관련 문서

```text
catan_implementation_process_guideline.md
docs/implementation_plans/2026-05-26_online-05-2-final-leave-room-end-policy-plan.md
docs/test_plans/2026-05-26_online-05-2-final-leave-room-end-policy-test-plan.md
```

## 변경 파일

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-05-2-final-leave-room-end-policy-plan.md
docs/test_plans/2026-05-26_online-05-2-final-leave-room-end-policy-test-plan.md
docs/final_reports/2026-05-26_online-05-2-final-leave-room-end-policy-final-report.md
```

## 구현 요약

5-1의 최근 방 재참가 흐름을 제거하고, 온라인 방 나가기를 최종적으로 "방 종료" 정책으로 확정했다. `leaveRoom` command를 받은 서버는 lobby/playing 구분 없이 방을 `ended`로 전환한다. 반대로 WebSocket close는 새로고침/창 닫기/네트워크 끊김일 수 있으므로 방 종료로 오판하지 않고 `connected=false`만 broadcast한다.

## 서버 반영

```text
1. public player state에 disconnectedAt을 추가했다.
2. attachSocket 시 connected=true, disconnectedAt=null로 재접속 상태를 복구한다.
3. leaveRoom을 받으면 room.status=ended, endedAt, endedByPlayerId, endReason을 설정한다.
4. 방장이 leaveRoom을 보낸 경우 endReason=host_left로 기록한다.
5. 일반 참가자가 leaveRoom을 보낸 경우 endReason=player_left로 기록한다.
6. ended 방의 joinRoom, reconnect, startGame을 ROOM_ENDED로 거절한다.
7. ended 방의 미구현 게임 command도 ROOM_ENDED로 거절한다.
8. WebSocket close는 connected=false, disconnectedAt=Date.now()만 기록하고 broadcast한다.
9. WebSocket close만으로는 room.status=ended가 되지 않는다.
```

## 클라이언트 반영

```text
1. catanLastLeftRoom, 최근 방 재참가 버튼, 최근 방 자동 채움 흐름을 제거했다.
2. 온라인 상태에서는 방장 포함 모든 유저에게 새 게임 버튼을 숨긴다.
3. 오프라인 새 게임 버튼은 기존처럼 유지한다.
4. 온라인 방 나가기 버튼 클릭 시 확인 모달을 먼저 표시한다.
5. 확인 모달은 나가면 게임방이 종료되고 다시 참가할 수 없음을 명확히 안내한다.
6. 취소 버튼은 모달만 닫고 서버 command, localStorage, URL, session을 변경하지 않는다.
7. 확인 후 나가면 leaveRoom command를 best-effort로 전송하고 identity/query/session을 정리한다.
8. 남은 유저가 ended state를 받으면 게임방 종료 알림 모달을 표시한다.
9. 종료 알림 모달은 나가기 버튼만 제공한다.
10. connected=false인 다른 참가자가 있으면 재접속 대기 모달을 표시한다.
11. 모든 참가자가 다시 connected=true가 되면 재접속 대기 모달을 자동으로 닫는다.
12. 재접속 대기 모달의 방 나가기 버튼은 일반 방 나가기 확인 모달로 이어진다.
```

## 테스트 결과

정적 검사:

```text
node --check server.js
결과: 통과

node --check script.js
결과: 통과
```

WebSocket 자동 테스트:

```text
결과: 통과

검증 항목:
- lobby 참가자 leaveRoom 후 status=ended, endReason=player_left
- lobby 방장 leaveRoom 후 status=ended, endReason=host_left
- playing 참가자 leaveRoom 후 status=ended, endReason=player_left
- ended 방 joinRoom 거절
- ended 방 reconnect 거절
- ended 방 startGame 거절
- ended 방 미구현 게임 command 거절
- WebSocket close만으로는 ended 처리되지 않음
- WebSocket close 후 connected=false, left=false broadcast
- reconnect 성공 후 connected=true, disconnectedAt=null broadcast
```

브라우저 스모크 테스트:

```text
결과: 통과

검증 URL:
http://127.0.0.1:4173/

검증 항목:
- 모드 선택 화면 표시
- 최근 방에 다시 참가 버튼 DOM 없음
- 게임 화면 방 나가기 버튼 DOM 생성
- 온라인 접속 전 게임 화면 방 나가기 버튼 숨김
- 오프라인 상태 새 게임 버튼 표시
```

## 통과한 항목

```text
leaveRoom command 수신 시 방 종료
ended 방 join/reconnect/startGame/game command 거절
재입장/최근 방 재참가 로직 제거
방 나가기 확인 모달 기반 흐름 구현
남은 유저용 종료 알림 모달 구현
재접속 대기 모달 구현
WebSocket close와 leaveRoom 분리
reconnect 성공 broadcast 유지
오프라인 새 게임 유지
```

## 수행하지 못한 항목

```text
실제 Chrome 3개 또는 실제 기기 3개를 사용한 수동 다중 브라우저 검증은 수행하지 못했다.
확인 모달의 취소 버튼이 localStorage/URL/session을 변경하지 않는지는 실제 브라우저 수동 검증이 필요하다.
남은 유저에게 표시되는 종료 알림 모달과 재접속 대기 모달의 실제 다중 브라우저 UI는 수동 검증이 필요하다.
네트워크 끊김은 WebSocket close 자동 테스트로 대체했고, 실제 네트워크 차단 시나리오는 수행하지 못했다.
```

## 남은 위험

```text
브라우저별 close 이벤트 타이밍 차이로 재접속 대기 모달 표시 시점이 조금 다를 수 있다.
종료 알림 모달과 다른 기존 게임 모달이 동시에 필요한 경우 온라인 모달이 우선 표시된다.
ended 방 메모리 정리는 아직 자동 삭제 정책이 없으므로 장시간 서버 실행 시 후속 정리가 필요하다.
```

## 후속 작업

```text
1. 실제 다중 브라우저/실기기에서 모달 흐름을 검증한다.
2. 6단계 이후 모든 게임 command에서 room.status=playing과 requester.connected/left 상태를 공통 검증한다.
3. ended 방 메모리 정리 정책을 별도 단계에서 결정한다.
4. 필요하면 온라인 전용 새 방 만들기 유도 문구를 UI에 추가한다.
```

## 최종 판단

완료
