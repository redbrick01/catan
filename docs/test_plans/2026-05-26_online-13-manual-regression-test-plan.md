# 온라인 13 수동 회귀 검증 계획

작성일: 2026-05-26

## 목적

13단계 전체 안정화 중 실제 브라우저/LAN 환경에서만 확인할 수 있는 항목을 별도 수동 검증 계획으로 분리한다.

이 문서는 자동 테스트가 아니라 친구들과 실제로 접속해서 게임이 가능한지 확인하기 위한 체크리스트다.

## 테스트 원칙

```text
Chrome 기준으로 통과 여부를 판단한다.
Safari는 보조 검증으로만 기록한다.
P0/P1이 발견되면 친구들과 플레이 가능으로 판정하지 않는다.
P2/P3는 플레이에 지장이 없으면 known issues로 남길 수 있다.
실패한 항목은 재현 절차, 브라우저, 기기, URL/IP, 서버 로그 유무를 기록한다.
```

## 테스트 환경 기록

실행 시 아래를 기록한다.

```text
테스트 일시
서버 실행 기기
서버 실행 명령
접속 URL/IP
방장 브라우저/기기
참가자 브라우저/기기
Chrome 통과 여부
Safari 보조 결과
서버 로그 위치 또는 캡처 여부
```

권장 기기:

```text
방장 PC: Windows + Chrome
참가자 1: MacBook + Chrome
참가자 2: iPhone + Chrome
참가자 3: 추가 PC 또는 모바일 Chrome
```

## Phase 1. Smoke

목표:

```text
접속, 방 생성, 게임 시작, 초기 배치, 최소 3라운드 진행이 가능한지 빠르게 확인한다.
```

체크리스트:

```text
서버 완전 재시작
브라우저 강력 새로고침
기존 localStorage/sessionStorage 영향 확인
방장 PC IP 확인
공유 URL로 참가자 접속
방장이 온라인 방 생성
참가자 2명 이상 입장
닉네임/참가자 목록 동기화
방장만 게임 시작 가능
게임 시작 후 모든 브라우저의 보드 동일
초기 배치 순서 동기화
현재 차례가 아닌 플레이어 배치 불가
초기 배치 완료 후 play phase 진입
현재 플레이어만 주사위 가능
주사위 결과 모든 브라우저 동일
자원 지급 본인 상세/상대 총량 표시
턴 종료 후 active player 동기화
최소 3라운드 진행
브라우저 콘솔 error 없음
서버 크래시 없음
```

Smoke 실패 시:

```text
P0 또는 P1 후보로 기록한다.
Core Rules로 넘어가지 않는다.
```

## Phase 2. Core Rules

목표:

```text
주요 규칙과 핵심 command가 실제 브라우저에서 동작하는지 확인한다.
```

### 건설

```text
도로 건설 성공/동기화
마을 건설 성공/동기화
도시 건설 성공/동기화
자원 부족 거부
잘못된 위치 거부
승점/승리 조건 동기화
```

### 은행/항구 교환

```text
교환 버튼 1개 확인
교환 모달 좌측 지불/우측 받을 자원 확인
4:1 교환 성공
3:1 일반 항구 교환 성공
2:1 특정 항구 교환 성공
자원 부족 거부
은행 재고 부족 거부
상대에게 자원 상세 미노출
```

### 플레이어 간 교환

```text
플레이어 교환 버튼 클릭 시 모든 유저 모달 표시
요청자 offer/request 개수 조절
응답자 수락/거절/흥정
흥정 조건 직접 지정
모든 응답 전 거래 확정 불가
수락한 유저 선택 후 거래 완료
거래 완료 알림 모달과 거래 내역
거래 취소 알림 모달
재요청 시 round 증가/응답 초기화
제3자 상세 노출 없음
```

### 개발 카드/11-1

```text
개발 카드 구매
본인에게만 카드 종류 표시
상대에게 devCount만 표시
구매한 턴 사용 불가
다음 자기 턴 사용 가능
풍년 카드 효과
독점 카드 효과
도로 건설 카드 무료 도로
roadBuilding 사용 직후 합법 위치가 없으면 pending 없이 종료
무료 도로 1개 배치 후 더 놓을 위치가 없으면 pending 자동 종료
무료 도로가 longestRoad에 반영
무료 도로로 10점 도달 시 winner 설정
기사 카드/largestArmy 확인
승점 카드 private 점수 확인
승점 카드로 승리 시 victoryDevCount 표시
```

### 7/강도/12단계

```text
주사위 7 발생
8장 이상 플레이어 discard 모달 표시
대상자가 아닌 플레이어 대기 표시
모든 discard 완료 전 진행 불가
강도 이동 UI 표시
현재 강도 타일 선택 거부
강도 이동 후 robberTile 모든 브라우저 동일
강도 위치 타일이 이후 주사위 생산에서 제외
피해자 후보 0명: NO_VICTIM 결과 표시 후 pending 종료
피해자 후보 1명: 자동 약탈
피해자 후보 여러 명: actor에게만 chooseRobberVictim 모달
actor/victim에게 훔친 자원 종류 표시
others에게 자원 종류 미노출
lastRobberResult.id 기준으로 새로고침 후 같은 결과 모달 반복 없음
기사 카드 사용 후 같은 강도 흐름
기사 카드 사용 시 discardForSeven 미발생
주사위 전 기사 카드 사용 후 pending 해결 시 rollDice 가능
주사위 후 기사 카드 사용 후 pending 해결 시 build/trade/endTurn 가능
```

### 승리 조건

```text
마을/도시 점수 승리
승점 카드 포함 승리
largestArmy 포함 승리
longestRoad 포함 승리
roadBuilding 무료 도로로 longestRoad 획득 후 승리
승리 요약 victoryDevCount 표시
승리 후 추가 command 거부
모든 브라우저 winner 표시 동일
```

## Phase 3. Recovery And Privacy

목표:

```text
새로고침/재접속/나가기와 비공개 정보 보호가 실제 브라우저에서 안전한지 확인한다.
```

### 재접속/나가기

```text
방장 새로고침 후 복구
참가자 새로고침 후 복구
pending 중 새로고침 후 pending UI 복구
discardForSeven 중 discard 대상자 새로고침 후 discard UI 복구
moveRobber 중 actor 새로고침 후 강도 이동 UI 복구
chooseRobberVictim 중 actor 새로고침 후 피해자 선택 UI 복구
참가자 탭 닫기 -> 재접속 대기 모달
재접속 후 모달 해소
pending actor 탭 닫기 -> 다른 유저에게 reconnect-waiting 표시
pending actor 재접속 -> 같은 pendingActionView 복구
방 나가기 확인 모달
방 나가기 후 모든 유저 방 종료 알림
pending 중 방 나가기 확정 -> 방 종료와 함께 pending 상태 정리
종료된 방 재입장 금지
```

### Privacy Audit

브라우저 화면:

```text
상대 resources 상세 미노출
상대 dev card type/id 미노출
상대 hiddenVictoryPoints 미노출
discard한 자원 종류는 본인 외 미노출
강도로 훔친 자원 종류는 actor/victim 외 미노출
플레이어 교환 응답자끼리 상세 응답 미노출
```

WebSocket payload:

```text
matchState.devDeck 배열 없음
상대 player.dev 상세 없음
pendingAction raw 미노출 또는 계획된 view만 노출
pendingActionView가 viewer role에 맞게 필터링
lastRobberResult.resource가 actor/victim에게만 존재
others의 lastRobberResult.resource는 null
discard resources 상세가 본인 외에 없음
playerTrade responses가 역할별로 필터링
```

확인 방법:

```text
각 브라우저 개발자 도구 Network 탭에서 WebSocket message 확인
가능하면 자동 테스트 state snapshot도 함께 확인
서버 로그와 공개 action log에 private detail이 찍히지 않는지 확인
```

## 오프라인 Smoke

목표:

```text
온라인 전용 상태/모달이 오프라인 기존 동작을 깨지 않았는지 10분 내 확인한다.
```

체크리스트:

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
온라인 전용 모달/상태가 오프라인에 남지 않음
```

## 모바일/UI

```text
iPhone Chrome에서 보드가 잘리지 않음
교환 모달이 화면 밖으로 밀리지 않음
플레이어 교환 모달이 모바일에서 읽을 수 있음
개발 카드 모달 버튼이 누르기 쉬움
discard 자원 수량 조절이 모바일에서 작지 않음
강도 이동 클릭/드래그가 모바일에서 가능
결과 알림 모달이 다른 모달과 겹치지 않음
버튼 텍스트가 잘리지 않음
```

## 결과 기록 양식

```text
항목:
결과: PASS / FAIL / NOT RUN
심각도: P0 / P1 / P2 / P3
기기/브라우저:
재현 절차:
실제 결과:
기대 결과:
로그/스크린샷:
후속 조치:
```

## 완료 기준

```text
Smoke PASS
Core Rules P0/P1 없음
Recovery And Privacy P0/P1 없음
오프라인 Smoke PASS
Chrome 기준 3명 이상 플레이 가능
Safari 결과는 별도 기록
P2/P3 known issues 정리
```
