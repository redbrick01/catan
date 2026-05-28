# 온라인 13 전체 회귀 테스트 및 안정화 계획

작성일: 2026-05-26

## 목적

온라인 모드 전체 기능이 구현된 뒤, 친구들과 실제로 한 판을 진행할 수 있는 수준인지 다기기 환경에서 검증하고 안정화한다.

13단계는 새 기능을 크게 추가하는 단계가 아니다. 1~12단계에서 구현한 온라인 기능을 끝까지 연결해 보고, 동기화 불일치, 비공개 정보 노출, 재접속 문제, 모바일 UI 문제, 오프라인 회귀를 잡는 단계다.

이 프로젝트는 공식 배포가 아니라 개인용 LAN/소규모 온라인 방이 목적이므로, 대규모 운영 품질보다 “친구 3~4명이 Chrome으로 접속해서 끊김 없이 플레이 가능한가”를 최우선 기준으로 삼는다.

## 전제

```text
1~12단계 온라인 기능 구현이 완료되어 있다.
11-1 개발 카드 보강이 완료되어 있다.
각 단계별 최종 보고서가 작성되어 있다.
서버는 0.0.0.0:4173 또는 테스트 포트로 정상 실행된다.
실제 접속 성공 IP 조합이 문서화되어 있다.
Chrome 기준 다기기 접속이 가능하다.
Safari는 보조 검증 대상이다.
```

## 범위

포함:

```text
자동 회귀 테스트 정리 및 실행
WebSocket command 테스트 전체 실행
문법 검사
오프라인 모드 회귀 테스트
온라인 3~4기기 수동 테스트
LAN/소규모 온라인 접속 테스트
Chrome 기준 성공/실패 판정
Safari 보조 결과 분리 기록
방 만들기/참가/대기실/게임 시작
새로고침/재접속/나가기/방 종료
초기 배치
주사위/자원 지급/턴 종료
기본 건설
은행/항구 교환
플레이어 간 교환
개발 카드
개발 카드 11-1 보강 항목
7/강도/pending action
승리 조건
비공개 정보 노출 검사
Catan 공식 규칙 대조 감사
브라우저 콘솔 오류 검사
서버 로그 검사
모바일 화면 검사
known issues 정리
최종 플레이 가능 여부 판정
최종 안정화 보고서 작성
```

제외:

```text
공식 배포
도메인/HTTPS
계정 시스템
대규모 부하 테스트
관리자 페이지
매치메이킹
장기 통계 저장
관전 모드
방장 이전
```

## 최종 테스트 환경

권장:

```text
방장 PC: Windows + Chrome
참가자 1: MacBook + Chrome
참가자 2: iPhone + Chrome
참가자 3: 추가 PC 또는 모바일 Chrome
```

보조:

```text
Safari
같은 PC Chrome 일반 창 + 시크릿 창
Tailscale 또는 기존에 성공한 100.x IP
LAN IP 192.168.x.x
```

접속 기준:

```text
이전 접속 테스트에서 Chrome + http://100.88.125.81:4173/ 조합이 성공했다.
Safari는 프로젝트 기준에서 신뢰 브라우저가 아니라 보조 브라우저로만 기록한다.
테스트 당시 실제 성공한 IP와 브라우저 조합을 최종 보고서에 남긴다.
```

## 자동 검증 계획

### 1. 문법 검사

필수:

```text
node --check server.js
node --check script.js
```

테스트 스크립트가 있으면 모두 검사:

```text
node --check scripts/*.js
```

PowerShell에서 wildcard가 불편하면 파일별로 실행한다.

### 2. WebSocket 자동 테스트

실행 대상:

```text
scripts/online-*-ws-test.js
scripts/*online*.js
```

필수 검증 영역:

```text
방 생성/참가/시작
초기 배치
주사위/턴 종료
기본 건설
은행/항구 교환
플레이어 간 교환
개발 카드
7/강도
재접속
방 종료
private view
```

테스트 정리 기준:

```text
각 단계 테스트가 독립 포트에서 서버를 띄우고 종료해야 한다.
테스트끼리 같은 in-memory room에 의존하지 않는다.
랜덤 보드에 의존하는 테스트는 fixture helper를 쓰거나 실패 가능성을 보고서에 남긴다.
```

### 3. 자동 테스트 보강이 필요한 항목

9단계 잔여:

```text
항구 3:1 성공
특정 항구 2:1 성공
```

10단계:

```text
모든 응답 전 choose 거부
round mismatch 거부
거래 완료/취소 결과 이벤트
private response view
```

11단계/11-1:

```text
구매 턴 사용 금지
승점 카드 private 처리
roadBuilding pending 자동 종료
무료 도로 longestRoad 반영
무료 도로로 winner 설정
승리 요약 victoryDevCount 표시
기사/largestArmy
```

12단계:

```text
game.pendingAction 단일 기준 상태
discardForSeven pending
moveRobber pending
chooseRobberVictim pending
victimSeatIndex 기준 피해자 선택
NO_VICTIM 결과
카드 단위 pool 기준 무작위 약탈
actor/victim에게만 훔친 자원 공개
others에게 resource null
lastRobberResult.id 모달 반복 방지
robberTile 생산 차단
기사 카드 source에서 discard 없이 moveRobber 진입
pending 중 disconnect/reconnect/leaveRoom 정책
pendingFreeRoads와 pendingAction 충돌 방지
```

### 4. 실제 실행 대상 정리

13단계에서는 `scripts/*online*.js`처럼 포괄적으로 실행하지 않고, 실제 실행 가능한 테스트 파일 목록을 먼저 확정한다.

보고서에 기록할 항목:

```text
실행한 테스트 파일명
실행하지 않은 테스트 파일명과 사유
각 테스트의 통과/실패
실패 시 재현 명령
```

권장 실행 순서:

```text
node --check server.js
node --check script.js
node --check scripts/online-*.js
node scripts/online-01...ws-test.js부터 최신 단계 순서로 실행
특정 테스트가 독립 실행 불가능하면 known issues 또는 테스트 정리 항목으로 기록
```

## 최우선 검증 항목

12단계 보고서에서 수동 미검증으로 남은 항목은 13단계의 최우선 P1 후보로 다룬다.

```text
discardForSeven 대상자/비대상자 모달 표시 UX
moveRobber actor/비actor UI 표시
chooseRobberVictim 모달 레이아웃
약탈 결과 모달이 새로고침/재접속 후 반복 표시되지 않는지
pending actor 새로고침 후 같은 pending UI 복구
pending 중 disconnect 시 5-2 재접속 대기 모달 우선 표시
오프라인 7/강도 기존 동작 유지
```

실패 시 보강 방침:

```text
lastRobberResult 모달 반복 표시 실패:
roomId + playerId + lastRobberResult.id를 sessionStorage 또는 localStorage에 저장해 중복 표시를 막는다.

pending UI 복구 실패:
pendingActionView hydrate 순서와 modal priority를 수정한다.

disconnect/reconnect 우선순위 실패:
reconnect-waiting 모달이 pending action 모달보다 우선하도록 수정한다.

오프라인 7/강도 회귀 실패:
온라인 pendingAction 분기와 오프라인 selectedAction 분리를 강화한다.
```

## Catan 공식 규칙 대조 감사

13단계에서는 구현된 온라인 기능을 Catan 공식 규칙 자료와 대조해 누락된 기능, 잘못 구현된 기능, 의도적으로 제외한 기능을 분류한다.

참고 자료:

```text
Catan 공식 Game Rules/Rulebook
Catan 공식 Basegame FAQ
Catan 공식 rulebook PDF 또는 공식 다운로드 문서
```

대조 대상:

```text
초기 배치 순서와 초기 자원 지급
턴 순서: 주사위, 교환, 건설, 개발 카드 사용 가능 타이밍
자원 생산과 강도 생산 차단
주사위 7: 8장 이상 절반 버리기, 강도 이동, 무작위 약탈
기사 카드: 주사위 전/후 사용, discard 미발생, 강도 이동/약탈, Largest Army
개발 카드: 구매한 턴 사용 금지, 한 턴 1장 제한, 승점 카드 예외
풍년/독점/도로 건설 카드 효과
은행 4:1, 일반 항구 3:1, 특정 항구 2:1
플레이어 간 거래: 자원 카드만 거래 가능, 개발 카드 거래 불가
건설 규칙: 도로 연결, 마을 거리 규칙, 도시 업그레이드
Longest Road: 5개 이상, 상대 건물에 의한 경로 차단, 동률/탈취 정책
Largest Army: 기사 3장 이상, 더 많은 기사로 탈취
승리 조건: 자기 턴 10점, 숨은 승점 카드 공개
비공개 정보: 자원/개발 카드/버린 카드/약탈 카드 공개 범위
```

분류 기준:

```text
IMPLEMENTED: 공식 규칙과 일치하고 테스트 또는 수동 검증 완료
PARTIAL: 일부 구현됐지만 검증 부족 또는 edge case 부족
INTENTIONAL_DEFERRED: 개인용/LAN 범위에서 뒤로 미룬 항목
INTENTIONAL_DIFFERENCE: 공식 규칙과 다르지만 개인용 편의상 의도한 차이
BUG: 공식 규칙과 다르고 게임 진행/공정성에 영향을 주는 문제
NOT_APPLICABLE: 현재 앱 범위에 없는 확장/시나리오 규칙
```

우선순위:

```text
BUG이면서 게임 진행, 승리 조건, private 정보, pending 해소에 영향을 주면 P0/P1로 처리한다.
PARTIAL이지만 자동/수동 검증만 부족하면 P2 또는 검증 잔여로 처리한다.
INTENTIONAL_DIFFERENCE는 최종 보고서에 이유를 기록한다.
확장판/시나리오 규칙은 NOT_APPLICABLE로 기록한다.
```

공식 규칙 감사 산출물:

```text
docs/tests/2026-05-26_online-13-official-rules-audit.md
```

감사 문서에 포함할 내용:

```text
공식 자료 링크
규칙 항목
현재 구현 파일 또는 보고서 근거
상태 분류
테스트/수동 검증 여부
누락 또는 차이점
심각도
후속 조치
```

## 수동 검증

상세 수동 검증은 별도 문서로 분리한다.

```text
docs/tests/2026-05-26_online-13-manual-regression-test-plan.md
```

13단계 본 계획서는 수동 검증 결과를 요약하고, 실패 항목을 known issues와 보강 작업으로 연결한다.

## 비공개 정보 감사

검사 대상:

```text
state payload
브라우저 화면
브라우저 콘솔 로그
서버 로그
공개 action log
결과 알림 모달
```

노출되면 안 되는 정보:

```text
상대 resources 상세
상대 dev card type/id
상대 hiddenVictoryPoints
devDeck 순서
강도로 훔친 자원 종류(actor/victim 외)
discard한 자원 종류(본인 외)
플레이어 교환 진행 중 응답자끼리의 상세 응답
```

공개 가능 정보:

```text
상대 resourceCount
상대 devCount
공개 점수
largestArmy/longestRoad 보유자
winner 확정 후 승리 요약의 victoryDevCount
은행 재고
항구 위치와 항구 종류
거래 완료 후 거래 내역 알림
강도 약탈 결과의 actor/victim 이름
```

state payload 감사 포인트:

```text
matchState.devDeck 배열이 내려오지 않는지 확인
상대 player.dev 상세가 내려오지 않는지 확인
pendingActionView가 viewer role에 맞게 필터링되는지 확인
lastRobberResult.resource가 actor/victim에게만 보이는지 확인
others의 lastRobberResult.resource는 null인지 확인
discard resources 상세가 본인 외에 노출되지 않는지 확인
playerTrade responses가 역할별로 필터링되는지 확인
```

감사 방법:

```text
WebSocket 자동 테스트의 state snapshot을 저장하거나 콘솔에 출력한다.
각 viewer별 payload에서 resources/dev/hiddenVictoryPoints/devDeck/lastRobberResult.resource를 확인한다.
브라우저 개발자 도구 Network 탭에서 WebSocket message payload를 직접 확인한다.
수동 검증 시 actor/victim/others 브라우저를 나누어 같은 이벤트의 payload 차이를 기록한다.
서버 로그나 공개 action log에 private resource/detail이 찍히지 않는지 확인한다.
```

## 모바일/UI 안정화 체크

확인:

```text
iPhone Chrome에서 보드가 잘리지 않는지
교환 모달이 화면 밖으로 밀리지 않는지
플레이어 교환 모달의 좌우 레이아웃이 모바일에서 1열로 전환되는지
개발 카드 모달 버튼이 누르기 쉬운지
discard 자원 수량 조절이 모바일에서 작지 않은지
강도 이동 클릭/드래그가 모바일에서 가능한지
결과 알림 모달이 다른 모달과 겹치지 않는지
버튼 텍스트가 잘리지 않는지
```

Safari:

```text
Safari는 성공하면 기록하되, 실패해도 Chrome 기준 통과 여부와 분리한다.
Safari에서 WebSocket/로컬 네트워크 접속 이슈가 있으면 known issues에 기록한다.
```

## 서버/로그 안정화

확인:

```text
서버 콘솔에 불필요한 DEBUG 로그가 계속 나오지 않음
에러 발생 시 requestId/code가 로그 또는 클라이언트에 추적 가능
WebSocket close가 정상적으로 connected=false 처리
종료된 방 command가 ROOM_ENDED로 거부
중복 클릭 command가 중복 처리되지 않음
request timeout이 UI에서 이해 가능한 메시지로 표시
```

## 단계별 보고서 점검

13단계 시작 전 확인:

```text
online-01~online-12 최종 보고서 존재 여부
11-1 최종 보고서 존재 여부
각 보고서의 실패/미수행/남은 위험 항목 수집
P0/P1 가능성이 있는 항목을 13단계 known issues 초안에 이관
이미 해결된 피드백이 오래된 보고서 하단에 남아 있으면 "해결됨" 또는 "11-1/12에서 처리됨"으로 표시
```

13단계 보고서에 포함:

```text
자동 테스트 실행 명령과 결과
실제 접속 URL/IP/브라우저 조합
참여 기기 목록
Chrome 기준 통과 여부
Safari 보조 검증 결과
수동 시나리오별 통과/실패/미수행
privacy audit 결과
Catan 공식 규칙 감사 결과
known issues P0/P1/P2/P3 분류
친구들과 플레이 가능 여부 최종 판단
```

## 오프라인 회귀 테스트

확인:

```text
오프라인 새 게임 시작
초기 배치
주사위/턴 종료
건설
은행/항구 교환 공용 모달
플레이어 간 교환 기존 로직
개발 카드
7/강도
승리 조건
새 게임 버튼
```

오프라인 원칙:

```text
온라인 서버 command 분기가 오프라인 로컬 동작을 깨면 안 된다.
온라인 전용 모달/상태가 오프라인에 남아 있으면 안 된다.
```

## 최종 플레이 가능 판정

친구들과 실제 플레이 가능으로 판단하는 기준:

```text
Chrome 기준 3명 이상이 같은 방에 접속 가능
게임 시작부터 초기 배치 완료까지 진행 가능
최소 3라운드 이상 턴 진행 가능
주요 command 실패 시 UI가 이해 가능한 오류를 표시
pending action이 풀리지 않는 P1 이상 문제가 없음
상대 자원/개발 카드/private response 등 핵심 비공개 정보 노출 없음
새로고침/재접속이 최소 1회 이상 성공
방 나가기/방 종료 정책이 정상 동작
```

판정 보류 기준:

```text
Safari 단독 실패
모바일 레이아웃 일부 불편하지만 핵심 버튼 사용 가능
수동 우회 가능한 P2 UI 문제
공식 룰 세부 UX 미흡하지만 게임 진행에는 영향 없음
```

## Known Issues 분류

최종 보고서에는 남은 이슈를 아래처럼 분류한다.

P0:

```text
게임 진행 불가
서버 크래시
비공개 정보 심각 노출
모든 브라우저 상태 불일치
```

P1:

```text
특정 핵심 규칙 오작동
재접속 후 진행 불가
거래/강도/pending이 풀리지 않음
승리 조건 오작동
```

P2:

```text
UI 불편
특정 브라우저 표시 문제
비핵심 로그/메시지 문제
드문 수동 우회 가능 문제
```

P3:

```text
미관
문구 개선
추가 편의 기능
```

출시/사용 가능 기준:

```text
P0 없음
P1 없음
P2/P3는 친구들과 플레이에 지장이 없으면 남겨둘 수 있음
```

P1이 남은 경우 판정:

```text
친구들과 플레이 가능으로 판정하지 않는다.
최종 판단은 "보류" 또는 "조건부 보류"로 기록한다.
P1을 known issues에 기록하더라도 사용 가능 기준을 통과한 것으로 보지 않는다.
```

## 최종 산출물

```text
docs/tests/2026-05-26_online-13-full-regression-test-plan.md
docs/tests/2026-05-26_online-13-official-rules-audit.md
docs/reports/2026-05-26_online-13-full-regression-stabilization-final-report.md
known issues 섹션 또는 문서
수동 검증 계획서 결과 요약
수동 테스트 환경 기록
실패/재현 절차
남은 후속 작업 목록
```

## 완료 기준

```text
자동 테스트가 통과한다.
Chrome 기준 실제 기기 3명 이상이 같은 방에서 주요 게임 흐름을 진행할 수 있다.
치명적인 동기화 불일치가 없다.
비공개 정보가 노출되지 않는다.
pending action이 새로고침/재접속 후 복구된다.
방 나가기/방 종료 정책이 일관되게 동작한다.
오프라인 모드가 기존처럼 동작한다.
Catan 공식 규칙 감사가 완료되고 BUG/P1 이상 항목이 처리되거나 보류 판정된다.
P0 이슈가 없다.
P1 이슈가 없다.
최종 안정화 보고서가 작성된다.
```
