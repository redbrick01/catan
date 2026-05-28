# Catan 기본 플레이어봇 개발 프로세스 가이드라인

작성일: 2026-05-26  
적용 범위: 기본 플레이어봇 구현, 봇 UI, 봇 자동 행동, 봇 관련 테스트/문서화 전체

## 1. 목적

이 문서는 Catan 프로젝트에 기본 플레이어봇을 구현할 때 따라야 하는 전용 개발 절차를 정의한다.

기존 `docs/guides/development-process-guideline.md`의 절차를 기본으로 삼되, 봇 작업에서 특히 중요한 다음 요소를 추가로 강제한다.

```text
봇은 서버에서 실행된다.
봇은 일반 플레이어 좌석을 차지한다.
봇 행동은 사람 command와 같은 규칙 검증을 통과한다.
봇 때문에 게임이 멈추면 안 된다.
봇은 비공개 정보를 부당하게 사용하거나 노출하면 안 된다.
봇 테스트는 재현 가능해야 한다.
```

## 2. 산출물 흐름

봇 구현 작업은 다음 순서를 따른다.

```text
1. 관련 문서 확인
2. 해당 단계 구현 계획서 확인 또는 갱신
3. 구현
4. 해당 단계 테스트 계획서 작성
5. 자동/WebSocket 테스트 수행
6. 브라우저 수동 테스트 수행
7. 회귀 테스트 수행
8. 최종 보고서 작성
```

아래 중 하나라도 빠지면 해당 단계는 완료로 보지 않는다.

```text
구현 계획서
테스트 계획서
테스트 결과
최종 보고서
```

## 3. 관련 기준 문서

작업 시작 전 다음 문서를 확인한다.

공통:

```text
docs/guides/development-process-guideline.md
docs/reference/catan-detailed-rules.md
docs/reference/rule-gap-analysis.md
```

봇 상위 문서:

```text
docs/plans/2026-05-26_bot-00-basic-bot-roadmap.md
docs/plans/2026-05-26_bot-mode-considerations.md
```

봇 단계별 계획서:

```text
docs/plans/2026-05-26_bot-01-player-model-lobby-plan.md
docs/plans/2026-05-26_bot-02-turn-runner-plan.md
docs/plans/2026-05-26_bot-03-initial-placement-plan.md
docs/plans/2026-05-26_bot-04-basic-actions-plan.md
docs/plans/2026-05-26_bot-05-robber-seven-pending-plan.md
docs/plans/2026-05-26_bot-06-dev-cards-plan.md
docs/plans/2026-05-26_bot-07-trade-response-plan.md
docs/plans/2026-05-26_bot-08-ui-logging-plan.md
docs/plans/2026-05-26_bot-09-stabilization-regression-plan.md
```

관련 온라인 문서:

```text
docs/plans/2026-05-26_online-03-protocol-sync-plan.md
docs/plans/2026-05-26_online-06-initial-placement-plan.md
docs/plans/2026-05-26_online-07-roll-resource-turn-plan.md
docs/plans/2026-05-26_online-10-player-trade-plan.md
docs/plans/2026-05-26_online-11-development-cards-plan.md
docs/plans/2026-05-26_online-12-robber-seven-pending-plan.md
```

## 4. 절대 원칙

### 4.1 봇은 서버 권위 원칙을 따른다

온라인 모드에서 봇은 서버 컴퓨터에서 실행한다.

```text
사람: 브라우저 -> command -> 서버 검증 -> 상태 변경 -> broadcast
봇: 서버 runner -> runBotCommand -> 서버 검증 -> 상태 변경 -> broadcast
```

봇은 WebSocket 인증 흐름을 타지 않을 수 있지만, 게임 규칙 검증은 우회하지 않는다.

### 4.2 봇 전용 직접 상태 변경을 금지한다

봇 구현 중 다음 방식은 금지한다.

```text
bot.resources를 직접 고친다.
edge.owner를 검증 없이 직접 바꾼다.
game.active를 봇 편의를 위해 직접 넘긴다.
pending action을 처리하지 않고 지운다.
승리 조건을 우회해서 처리한다.
```

허용되는 방식:

```text
runBotCommand(room, botPlayer, payload)
공통 command 검증 함수 호출
기존 서버 command handler에서 검증 로직 추출 후 재사용
```

### 4.3 봇 때문에 게임이 멈추면 안 된다

봇 작업의 최우선 완료 기준은 안정성이다.

봇은 다음 상황을 반드시 처리해야 한다.

```text
초기 배치
일반 턴
주사위 7
자원 버리기
강도 이동
피해자 선택
개발 카드 추가 선택
거래 응답
턴 종료
```

판단에 실패하면 합법 fallback을 실행한다.

### 4.4 runner 중복 실행을 막는다

한 방에서 봇 runner는 동시에 하나만 실행되어야 한다.

예약된 runner는 실행 직전에 다음을 확인한다.

```text
room.status
room.revision
game.phase
active seat 또는 setupIndex
pending action 종류
pending actor
bot player가 아직 room에 있는지
```

아래 상황에서는 예약을 취소한다.

```text
방 종료
새 게임
revision 변경
pending action 변경
현재 actor 변경
봇 제거
서버 오류
```

### 4.5 비공개 정보 공정성을 지킨다

서버 봇은 전체 상태를 볼 수 있지만, 기본 봇은 사람이 알 수 없는 정보를 전략에 사용하지 않는다.

금지:

```text
상대의 정확한 개발 카드 종류를 보고 거래 판단
상대의 정확한 자원 종류를 보고 강도 피해자 선택
숨겨진 승점 카드를 알고 견제 판단
비공개 정보를 로그로 출력
```

허용:

```text
공개 승점
공개 건물/도로
공개 기사 수
공개 자원 총량
공개 행동 로그에서 추정 가능한 정보
```

### 4.6 사람 전용 게임을 회귀시키지 않는다

봇 작업 후에도 다음은 계속 동작해야 한다.

```text
오프라인 3~4인 게임
온라인 사람 3~4인 게임
로비 만들기/참가
재접속
비공개 정보 view
플레이어 거래
개발 카드
7/강도
```

## 5. 단계별 진행 규칙

봇 작업은 01부터 09까지 순서대로 진행한다.

```text
01. 플레이어 모델 및 로비
02. 턴 실행기
03. 초기 배치
04. 일반 턴 기본 행동
05. 7/강도/pending action
06. 개발 카드
07. 거래 응답
08. UI 및 로그
09. 안정화 및 회귀 테스트
```

순서를 건너뛰지 않는다. 특히 `02 턴 실행기`가 안정화되기 전에는 고급 행동을 붙이지 않는다.

각 단계는 다음 파일 세트를 만든다.

```text
docs/plans/2026-05-26_bot-XX-...-plan.md
docs/tests/2026-05-26_bot-XX-...-test-plan.md
docs/reports/2026-05-26_bot-XX-...-final-report.md
```

## 6. 단계별 필수 확인 사항

### 6.1 bot-01 플레이어 모델 및 로비

필수 확인:

```text
최소 사람 수 1명
총 플레이어 수 3~4명
봇 최대 수는 4명 제한 안에서만 허용
봇은 reconnect 대상이 아님
봇 제거는 lobby 상태에서만 허용
```

완료 전 테스트:

```text
방장만 봇 추가/제거 가능
사람 1 + 봇 2 시작 가능
사람 1 + 봇 1 시작 불가
봇만 있는 게임 시작 불가
```

### 6.2 bot-02 턴 실행기

필수 확인:

```text
runBotCommand 경로가 규칙 검증을 공유한다.
runner 중복 실행이 없다.
오래된 timer가 실행되지 않는다.
봇이 행동 불가 시 턴 종료 fallback에 도달한다.
```

완료 전 테스트:

```text
봇이 주사위를 굴린다.
봇이 턴을 종료한다.
봇 2명이 연속이어도 순서대로 진행된다.
```

### 6.3 bot-03 초기 배치

필수 확인:

```text
거리 규칙
setup1/setup2 순서
도로와 정착지 연결
setup2 초기 자원 지급
```

완료 전 테스트:

```text
봇 포함 게임이 play phase까지 진입한다.
초기 배치가 모든 브라우저에 동기화된다.
```

### 6.4 bot-04 일반 턴 기본 행동

필수 확인:

```text
주요 행동 최대 2개
은행/항구 교역 최대 1회
행동 불가 시 턴 종료
모든 행동은 command 검증 경유
```

완료 전 테스트:

```text
도시/정착지/도로/개발 카드 구매 각각 실행 가능
자원 부족 시 무한 루프 없이 턴 종료
```

### 6.5 bot-05 7/강도/pending action

필수 확인:

```text
discard 수량 정확성
강도 타일 합법성
피해자 후보 합법성
피해자 없음 처리
훔친 자원 비공개 로그
```

완료 전 테스트:

```text
forced dice 7
봇 discard
봇 robber move
봇 victim 선택
pending action 종료
```

### 6.6 bot-06 개발 카드

필수 확인:

```text
구매 턴 사용 금지
승점 카드 비공개
기사 후 강도 pending 처리
풍년 은행 재고 확인
```

완료 전 테스트:

```text
기사 사용
풍년 사용
승점 카드 승리 조건 반영
개발 카드 정보 미노출
```

### 6.7 bot-07 거래 응답

필수 확인:

```text
봇 대상 거래 pending 감지
accept/reject 자동 응답
불가능한 거래 거절
비공개 정보 미사용
```

완료 전 테스트:

```text
봇에게 유리한 거래 수락
봇에게 불리한 거래 거절
거래 pending 정리
```

### 6.8 bot-08 UI 및 로그

필수 확인:

```text
로비 봇 배지
게임 중 봇 배지
봇 턴 버튼 비활성화
로그 문구
비공개 정보 노출 없음
```

완료 전 테스트:

```text
데스크톱 화면
모바일 화면
다중 브라우저 상태 동기화
콘솔 오류 없음
```

### 6.9 bot-09 안정화 및 회귀 테스트

필수 확인:

```text
사람 1 + 봇 2
사람 2 + 봇 1
사람 2 + 봇 2
사람 3~4 온라인 회귀
오프라인 3~4 회귀
```

완료 전 테스트:

```text
여러 턴 진행
7/강도 진행
거래 pending 진행
봇 승리 처리
서버 콘솔 오류 없음
브라우저 콘솔 오류 없음
```

## 7. 테스트 계획서 작성 규칙

각 단계 구현 후 테스트 계획서를 작성한다.

권장 위치:

```text
docs/tests/
```

파일명:

```text
2026-05-26_bot-XX-short-name-test-plan.md
```

필수 항목:

```text
테스트 대상
관련 구현 계획서
변경 파일 목록
테스트 환경
자동 테스트 항목
WebSocket 테스트 항목
브라우저 수동 테스트 항목
회귀 테스트 항목
비공개 정보 노출 점검
실패 시 확인할 로그
완료 기준
```

## 8. 봇 테스트 재현성 규칙

봇 테스트는 랜덤성과 timer 때문에 재현이 어려울 수 있다. 따라서 테스트 모드에서는 다음을 우선한다.

```text
NODE_ENV=test에서 봇 delay 제거 또는 최소화
forced dice 사용
고정 보드 또는 고정 random seed 사용
고정 개발 카드 덱 사용
봇 행동 최대 횟수 제한
테스트 종료 시 bot timer 정리
```

자동 테스트에서 피해야 할 것:

```text
실제 시간 500ms delay에 의존
랜덤 주사위 결과에 의존
랜덤 보드 결과에 의존
봇이 언젠가 행동할 것이라고 기다리는 테스트
```

## 9. 구현 중 계획 변경 규칙

구현 중 다음이 발견되면 즉시 해당 단계 계획서를 갱신한다.

```text
기존 command handler를 봇이 재사용하기 어렵다.
서버 상태 구조가 계획과 다르다.
pending action 종류가 추가로 필요하다.
UI 변경 범위가 예상보다 커진다.
테스트를 위해 fixture나 helper가 필요하다.
오프라인 모드에 영향이 생긴다.
```

계획서가 현실과 어긋난 상태로 구현을 계속하지 않는다.

## 10. 최종 보고서 작성 규칙

각 단계 종료 시 최종 보고서를 작성한다.

권장 위치:

```text
docs/reports/
```

파일명:

```text
2026-05-26_bot-XX-short-name-final-report.md
```

필수 항목:

```text
작업명
작성일
관련 구현 계획서
관련 테스트 계획서
변경 파일 목록
구현 요약
봇 설계 반영 내용
테스트 결과
통과한 항목
실패한 항목
수행하지 못한 항목
비공개 정보 점검 결과
남은 위험
후속 작업
최종 판단
```

최종 판단:

```text
완료
부분 완료
보류
실패
```

## 11. 작업 완료 체크리스트

각 봇 단계 완료 전 아래를 확인한다.

```text
[ ] 관련 기준 문서를 확인했다.
[ ] 해당 단계 구현 계획서를 확인하거나 갱신했다.
[ ] 구현 계획서 범위 안에서만 코드를 수정했다.
[ ] 봇 행동이 서버 규칙 검증을 통과한다.
[ ] 봇 runner 중복 실행 가능성을 검토했다.
[ ] pending action 방치 가능성을 검토했다.
[ ] 비공개 정보 사용/노출 여부를 검토했다.
[ ] 테스트 계획서를 작성했다.
[ ] 자동/WebSocket 테스트를 수행했다.
[ ] 브라우저 수동 테스트를 수행했다.
[ ] 사람 전용 온라인 회귀를 확인했다.
[ ] 오프라인 회귀를 확인했다.
[ ] 실패하거나 수행하지 못한 테스트를 기록했다.
[ ] 최종 보고서를 작성했다.
```

## 12. 강제 준수 문구

봇 작업은 아래 문구를 기준으로 진행한다.

> 봇은 서버에서 실행한다.  
> 봇은 규칙 검증을 우회하지 않는다.  
> 봇 때문에 게임이 멈추면 안 된다.  
> 봇은 비공개 정보를 부당하게 쓰거나 노출하지 않는다.  
> 봇 테스트는 재현 가능해야 한다.  
> 단계별 계획서, 테스트 계획서, 최종 보고서 없이 완료로 보지 않는다.

