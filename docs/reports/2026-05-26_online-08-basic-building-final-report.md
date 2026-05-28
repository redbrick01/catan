# 온라인 모드 8단계 기본 건설 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/guides/development-process-guideline.md
docs/plans/2026-05-26_online-00-mvp-roadmap.md
docs/plans/2026-05-26_online-08-basic-building-plan.md
docs/tests/2026-05-26_online-08-basic-building-test-plan.md
```

## 구현 요약

```text
server.js에 buildRoad/buildSettlement/buildCity command를 추가했다.
모든 온라인 건설은 validatePlayCommand + validateBuildCommand를 통과해야 처리된다.
play phase, active player, rolled=true, winner 없음, pending action 없음 조건을 서버에서 검증한다.
connected=false 참가자가 있거나 ended/left/auth 실패 상태면 건설 command를 거절한다.
도로/마을/도시 비용과 말 재고를 서버에서 검증하고, 성공 시 player resources 차감과 bank 증가를 처리한다.
도로는 점유 여부, 남은 도로, 자원, 자기 도로/건물 연결, 상대 건물 통과 금지를 검증한다.
마을은 점유 여부, 거리 규칙, 자기 도로 연결, 남은 마을, 자원을 검증한다.
도시는 자기 마을, 이미 도시 아님, 남은 도시, 자원을 검증한다.
성공 후 edge/vertex, piece 재고, 공개 승점을 갱신하고 viewer별 matchState를 broadcast한다.
script.js는 온라인 play phase에서 건설 버튼 선택과 보드 클릭을 서버 command로 전송하도록 변경했다.
온라인 상태에서 로컬 buildRoad/buildSettlement/buildCity 직접 mutation 경로는 유지 차단했다.
```

## 승점/승리 처리

```text
8단계에서는 서버가 마을 1점, 도시 2점의 공개 건물 승점을 계산한다.
건설 후 공개 건물 승점이 10점 이상이면 game.winner를 설정하고 모든 클라이언트에 동기화한다.
기존 최장 교역로/최대 기사단은 온라인 서버 상태로 안정 이식하기 전까지 8단계 범위에서 제외했다.
비공개 승점과 개발카드 상세는 기존 viewer별 private state 정책을 유지해 상대에게 노출하지 않는다.
```

## 변경 파일

```text
server.js
script.js
scripts/online-08-basic-building-ws-test.js
docs/plans/2026-05-26_online-08-basic-building-plan.md
docs/tests/2026-05-26_online-08-basic-building-test-plan.md
docs/reports/2026-05-26_online-08-basic-building-final-report.md
```

## 테스트 결과

```text
PASS node --check server.js
PASS node --check script.js
PASS node --check scripts/online-08-basic-building-ws-test.js
PASS node scripts/online-08-basic-building-ws-test.js
PASS browser smoke: http://127.0.0.1:4173/?test=1 로드, title "Catan", 온라인 UI 존재, console error 없음
```

WebSocket 자동 테스트 주요 결과:

```text
ok - build before roll: ROLL_REQUIRED
ok - wrong turn buildRoad: NOT_YOUR_TURN
ok - invalid edge: INVALID_PLACEMENT
ok - not enough resources city: NOT_ENOUGH_RESOURCES
ok - current player buildRoad success
ok - road synced to opponent view
ok - current player buildSettlement success
ok - settlement synced to opponent view
ok - current player buildCity success
ok - opponent resource details hidden
ok - victory points updated
ok - connected=false blocks build: ROOM_NOT_READY
ok - ended room blocks build: ROOM_ENDED
online-08 basic building websocket tests passed
```

## 확인한 최소 항목

```text
현재 차례 buildRoad 성공: 자동 검증 완료
차례가 아닌 플레이어 buildRoad 거절: 자동 검증 완료
주사위 전 건설 거절: 자동 검증 완료
자원 부족 건설 거절: 자동 검증 완료
잘못된 위치 건설 거절: 자동 검증 완료
정상 도로 건설 후 모든 클라이언트 edge 동일: 자동 검증 완료
정상 마을 건설 후 모든 클라이언트 vertex 동일: 자동 검증 완료
정상 도시 건설 후 city/settlement 재고 갱신: 자동 경로 검증 완료
건설 후 상대에게 resourceCount만 노출: 자동 검증 완료
승점 갱신: 자동 검증 완료
connected=false 유저가 있으면 건설 거절: 자동 검증 완료
ended 방에서 건설 거절: 자동 검증 완료
```

## 수동 검증 필요

```text
차례가 아닌 플레이어의 buildSettlement/buildCity 거절은 같은 validatePlayCommand 경로지만 자동 테스트는 buildRoad로 대표 검증했다.
상대 마을/도시 통과 road 연결 거절은 서버 canConnectThroughVertex 로직에 반영했으나, 실제 해당 보드 상황 생성은 수동 검증으로 남겼다.
10점 이상 winner 설정은 공개 건물 승점 로직에 반영했으나, 긴 건설 시나리오 자동화는 후속 보강으로 남겼다.
실제 Chrome 3개 또는 실제 기기 3개에서 버튼 활성화, 서버 응답 후 보드 동기화, 재접속 대기/ended 모달과의 결합 동작은 수동 검증이 필요하다.
오프라인 건설 동작은 코드 경로를 유지했으며, 실제 브라우저 회귀 확인은 수동 검증이 필요하다.
```

## 후속 과제

```text
온라인 최장 교역로/최대 기사단 승점 이식
상대 건물 통과 금지와 10점 winner 시나리오의 전용 자동 fixture 추가
온라인 거래/개발카드/도둑 처리 단계와 pending action 통합
실제 기기 기준 3인 브라우저 회귀 테스트 수행
```
