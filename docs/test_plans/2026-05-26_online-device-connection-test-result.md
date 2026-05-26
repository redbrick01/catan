# 온라인 실제 기기 접속 테스트 결과

작성일: 2026-05-26

## 테스트 목적

온라인 모드 1~2단계에서 남아 있던 실제 외부 기기 접속 검증을 수행한다.

확인 대상:

```text
방장 PC에서 서버 실행
외부 기기에서 페이지 접속
외부 기기에서 WebSocket 연결
외부 기기에서 온라인 방 참가
브라우저별 접속 차이
```

## 테스트 환경

방장 PC:

```text
OS: Windows
서버 주소 후보:
- http://192.168.0.2:4173/
- http://100.88.125.81:4173/
서버 포트: 4173
방화벽: Catan LAN Server 4173 TCP inbound 허용 규칙 추가
```

테스트 기기:

```text
MacBook
iPhone
```

## 서버 상태 확인

서버 재시작 후 포트 상태:

```text
0.0.0.0:4173 LISTENING
```

기존에 충돌하던 오래된 서버 상태:

```text
127.0.0.1:4173 LISTENING
```

위 상태는 서버 재시작 후 사라졌고, 최종적으로 `0.0.0.0:4173`만 사용하도록 정리했다.

## 방화벽 처리

Windows 방화벽에 4173 포트 허용 규칙을 추가했다.

규칙:

```text
Rule Name: Catan LAN Server 4173
Enabled: Yes
Direction: In
Profiles: Private
Protocol: TCP
LocalPort: 4173
Action: Allow
```

## WebSocket 직접 테스트

MacBook에서 WebSocket 핸드셰이크를 확인했다.

명령:

```bash
curl -v --http1.1 --max-time 5 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://192.168.0.2:4173/
```

확인된 응답:

```text
HTTP/1.1 101 Switching Protocols
```

판단:

```text
MacBook에서 서버 WebSocket 업그레이드가 가능함을 확인했다.
curl은 WebSocket 연결 유지 특성 때문에 이후 timeout이 발생했지만, 101 응답이 확인되었으므로 연결 자체는 성공으로 본다.
```

## 실제 브라우저 접속 결과

### MacBook

결과:

```text
http://100.88.125.81:4173/ 접속 성공
온라인 방 참가 성공
```

특이 사항:

```text
MacBook Chrome에서 192.168.0.2 주소는 접속 동작이 불안정했다.
100.88.125.81 주소에서는 방 참가까지 성공했다.
```

### iPhone

결과:

```text
iPhone Chrome에서 http://100.88.125.81:4173/ 접속 성공
iPhone Chrome에서 온라인 방 참가 성공
```

특이 사항:

```text
iPhone Safari에서는 페이지 접속 또는 방 참가 흐름이 불안정했다.
iPhone Chrome에서는 정상 동작했다.
```

## 최종 접속 기준

이번 테스트에서 실사용 가능한 조합:

```text
접속 주소: http://100.88.125.81:4173/
권장 브라우저: Chrome
```

권장 운영 방식:

```text
방장 PC, MacBook, iPhone 모두 http://100.88.125.81:4173/ 주소로 통일한다.
공유 URL 후보 중 100.88.125.81 주소를 선택해 공유한다.
iPhone에서는 Safari 대신 Chrome 사용을 권장한다.
```

## 완료 판단

실제 기기 접속 테스트는 조건부 완료로 판단한다.

완료된 항목:

```text
방장 PC 서버 실행 정상
MacBook에서 페이지 접속 성공
MacBook에서 방 참가 성공
iPhone Chrome에서 페이지 접속 성공
iPhone Chrome에서 방 참가 성공
WebSocket 101 Switching Protocols 확인
```

조건:

```text
100.88.125.81 주소 기준
Chrome 브라우저 기준
```

남은 확인 대상:

```text
192.168.0.2 LAN 주소의 브라우저별 동작 차이
iPhone Safari에서 방 참가 실패 원인
```

현재 프로젝트 목적이 친구들과 개인적으로 접속해 플레이하는 것이므로, `100.88.125.81 + Chrome` 조합으로 접속 테스트는 통과로 기록한다.
