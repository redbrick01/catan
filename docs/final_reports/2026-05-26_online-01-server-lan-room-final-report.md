# 온라인 01 서버/LAN/방 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
catan_implementation_process_guideline.md
docs/implementation_plans/2026-05-26_online-00-mvp-roadmap.md
docs/implementation_plans/2026-05-26_online-01-server-lan-room-plan.md
docs/test_plans/2026-05-26_online-01-server-lan-room-test-plan.md
```

## 변경 파일 목록

```text
server.js
package.json
package-lock.json
docs/implementation_plans/2026-05-26_online-01-server-lan-room-plan.md
docs/test_plans/2026-05-26_online-01-server-lan-room-test-plan.md
docs/final_reports/2026-05-26_online-01-server-lan-room-final-report.md
```

## 구현 요약

```text
server.js를 HOST 환경변수 기본값 0.0.0.0으로 바인딩하도록 변경했다.
서버 시작 시 Local URL과 감지된 Network URL 후보를 출력하도록 했다.
HTTP 정적 파일 서버와 같은 포트에 ws 기반 WebSocket 서버를 추가했다.
메모리 기반 rooms Map을 추가했다.
createRoom 메시지로 lobby 상태 방과 방장 플레이어를 생성하도록 했다.
joinRoom 메시지로 lobby 상태 방에 참가자를 추가하도록 했다.
roomCreated, roomJoined, state 메시지에 state.status = "lobby"를 포함했다.
broadcast state에서는 playerToken을 제외하고 공개 플레이어 정보만 전송하도록 했다.
package.json에 start 스크립트와 ws 의존성을 추가했다.
```

## 반영한 설계/규칙

```text
서버가 lobby 상태를 만든다.
클라이언트는 createRoom/joinRoom 요청만 보낸다.
게임 시작, 초기 배치, 주사위 명령은 이번 단계에서 구현하지 않았다.
오프라인 모드 파일(index.html/script.js/styles.css)은 수정하지 않았다.
```

## 테스트 결과

통과:

```text
node --check server.js
node -e "require('ws'); console.log('ws ok')"
테스트 포트 4183에서 서버 실행 로그 확인
HTTP GET / 요청이 200과 index.html을 반환하는지 확인
WebSocket 클라이언트 A createRoom 성공 확인
roomCreated 응답의 state.status = "lobby" 확인
roomCreated 응답의 shareUrls 확인
state에 playerToken이 포함되지 않는지 확인
WebSocket 클라이언트 B joinRoom 성공 확인
두 클라이언트가 최종 state에서 같은 roomId, lobby status, 2명 참가자 목록을 받는지 확인
npm start가 테스트 포트 4184에서 Local/Network URL 로그를 출력하는지 확인
```

확인된 서버 로그:

```text
Original Catan server running
Local:   http://127.0.0.1:4183/
Network: http://100.88.125.81:4183/
Network: http://192.168.0.2:4183/
```

## 특이 사항

```text
기본 포트 4173에서 WebSocket 테스트 중 HTTP 200이 반환된 흔적이 있어 테스트는 4183 포트로 분리해 수행했다.
이는 기존 정적 서버 또는 다른 프로세스가 같은 포트에서 응답했을 가능성이 있다.
npm start 확인은 4184 포트에서 수행했고 시작 로그는 정상 출력됐다.
PowerShell Start-Process 방식은 이 환경의 PATH/Path 중복 문제로 사용하지 않았다.
shell 래퍼를 통한 npm start 종료는 자식 프로세스 종료 전파 문제로 타임아웃됐지만, 서버 시작 로그 자체는 정상 확인됐다.
테스트 후 4184 포트 점유가 남아 있지 않음을 확인했다.
```

## 수행하지 못한 항목

```text
다른 실제 LAN 기기에서 Network URL 접속은 수행하지 못했다.
UI 대기실이 아직 없으므로 브라우저에서 방 생성/참가 UI 검증은 수행하지 않았다.
```

## 남은 위험

```text
Windows 방화벽이나 공유기 네트워크 정책이 실제 친구 기기 접속을 막을 수 있다.
방 정보는 메모리에만 저장되므로 서버 재시작 시 사라진다.
재접속, 방장 이전, 게임 시작은 아직 구현되지 않았다.
```

## 후속 작업

```text
온라인 02 단계에서 UI 대기실과 공유 URL 표시를 구현한다.
실제 LAN 기기 접속 테스트를 수행한다.
프로토콜 동기화 단계에서 requestId/revision/error 규격을 더 엄격히 정리한다.
```

## 최종 판단

부분 완료

## 리뷰 피드백 반영 결과

```text
최종 판단을 실제 다른 LAN 기기 검증 미수행에 맞게 "부분 완료"로 수정했다.
서버가 type: "command" + payload.name 형식의 createRoom/joinRoom을 처리하도록 보완했다.
기존 type: "createRoom" / type: "joinRoom" 형식은 1단계 호환을 위해 유지했다.
state 메시지에 top-level revision을 추가했다.
roomCreated 응답 직후 같은 방장 소켓에 중복 state 메시지를 보내지 않도록 조정했다.
PORT 환경변수로 대체 포트를 사용할 수 있음을 후속 테스트 메모에 남겼다.
```

## 리뷰 피드백 반영 테스트 결과

통과:

```text
node --check server.js
테스트 포트 4185에서 HTTP GET / 정적 파일 응답 확인
type: "command" + payload.name: "createRoom" 방 생성 확인
type: "command" + payload.name: "joinRoom" 방 참가 확인
기존 type: "createRoom" / type: "joinRoom" 호환 확인
roomCreated 직후 방장에게 별도 state 메시지가 중복 전송되지 않음 확인
roomJoined 이후 양쪽 state 메시지의 top-level revision = 2 확인
Local/Network URL 출력 확인
```

## 리뷰 피드백 및 후속 보완 권고

작성일: 2026-05-26

### 긍정적 평가

```text
구현 계획서 갱신, 구현, 테스트 계획서 작성, 테스트 수행, 최종 보고서 작성 흐름을 지켰다.
1단계 범위를 서버/LAN/방 최소 구조로 잘 제한했다.
게임 시작, 초기 배치, 주사위, UI 대기실을 이번 단계에서 구현하지 않았다고 명확히 구분했다.
0.0.0.0 바인딩, Local/Network URL 출력, ws 도입, createRoom/joinRoom, lobby state 전송은 1단계 목표에 부합한다.
playerToken을 broadcast state에서 제외한 점은 적절하다.
실제 LAN 기기 테스트를 수행하지 못한 사실을 숨기지 않고 명시했다.
```

### 보완이 필요한 점

```text
최종 판단은 "완료"보다는 "부분 완료"가 더 엄밀하다.
이유는 실제 다른 LAN 기기에서 Network URL 접속 검증을 수행하지 못했기 때문이다.
서버 기능 구현은 완료로 볼 수 있지만, 1단계의 LAN 접속 목표는 실제 기기 검증 전까지 완전 완료로 보기 어렵다.
```

```text
현재 서버 메시지는 type: "createRoom", type: "joinRoom" 형식을 사용한다.
하지만 온라인 03 프로토콜/동기화 계획서는 type: "command" + payload.name 형식으로 통일하는 방향이다.
다음 UI 대기실 단계 전에 프로토콜 형식을 계획서와 맞추는 것이 좋다.
```

```text
현재 state 메시지의 revision 위치가 top-level이 아니라 state 내부에 있는 구조로 보인다.
온라인 03 계획서에서는 top-level revision을 기준으로 최신 state를 판단하는 방향이다.
다음 단계 전에 state 메시지의 revision 위치를 통일해야 한다.
```

```text
roomCreated 응답 후 broadcastState(room)이 호출되어 방장 클라이언트는 roomCreated와 state를 연속으로 받는다.
문제는 아니지만, 클라이언트 구현 시 중복 state 수신을 정상 흐름으로 처리해야 한다.
이 동작은 다음 UI/프로토콜 문서나 구현 주석에 명시하는 것이 좋다.
```

```text
기본 포트 4173에서 기존 프로세스가 응답했을 가능성이 있었다.
다음 단계 전에 포트 충돌 시 확인 방법과 대체 포트 사용 방법을 운영 메모로 남기는 것이 좋다.
예: PORT=4183 npm start
```

### 다음 단계 전 권장 조치

```text
1. 최종 판단을 내부적으로는 "서버 기능 구현 완료, 실제 LAN 기기 검증 미완료"로 간주한다.
2. createRoom/joinRoom을 type: "command" + payload.name 형식으로 맞출지 결정한다.
3. state 메시지의 revision을 top-level로 둘지 state 내부로 둘지 결정하고 계획서와 구현을 통일한다.
4. UI 대기실 구현 시 roomCreated와 state가 연속 수신될 수 있음을 고려한다.
5. 실제 다른 LAN 기기에서 Network URL 접속 테스트를 온라인 02 단계 초반에 수행한다.
```

## 실제 기기 접속 테스트 후속 기록

작성일: 2026-05-26

관련 문서:

```text
docs/test_plans/2026-05-26_online-device-connection-test-result.md
```

결과:

```text
MacBook과 iPhone Chrome에서 http://100.88.125.81:4173/ 접속 및 온라인 방 참가 성공을 확인했다.
WebSocket 101 Switching Protocols 응답도 확인했다.
```

판단:

```text
실제 기기 접속 테스트는 100.88.125.81 주소와 Chrome 브라우저 기준으로 조건부 완료로 본다.
192.168.0.2 LAN 주소의 브라우저별 동작 차이와 iPhone Safari 문제는 후순위 확인 대상으로 남긴다.
```
