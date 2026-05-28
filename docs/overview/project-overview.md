# 프로젝트 개요

Catan은 브라우저에서 실행되는 보드게임 프로젝트입니다. 오프라인 로컬 플레이, 소규모 LAN/온라인 방 플레이, 서버가 제어하는 봇 플레이를 함께 지원합니다.

이 저장소는 단순한 UI 데모가 아니라 실제 플레이 가능한 게임 흐름을 기준으로 관리됩니다. 규칙 정확도, 서버 권위 상태 동기화, 비공개 정보 보호, 회귀 테스트 문서를 함께 유지합니다.

## 주요 기능

- 3~4인 오프라인 플레이
- 랜덤 보드, 숫자 칩, 사막, 도둑, 항구 배치
- 초기 정착지/도로 배치와 시작 자원 지급
- 주사위, 자원 생산, 은행 재고 처리
- 도로, 정착지, 도시 건설
- 은행/항구 교환, 플레이어 간 교환
- 개발 카드 구매와 사용
- 7 처리, 자원 버리기, 도둑 이동, 자원 빼앗기
- 최장 교역로, 최대 기사력, 승점 판정
- WebSocket 기반 온라인 방 생성/참가/재접속
- 서버 권위 게임 상태와 플레이어별 비공개 정보 필터링
- 봇 플레이어 추가, 자동 턴 진행, 기본 의사결정

## 프로젝트 구조

```text
index.html       브라우저 UI 마크업
styles.css       화면 레이아웃과 반응형 스타일
script.js        클라이언트 게임/UI/온라인 연결 로직
server.js        정적 파일 서버, WebSocket 서버, 온라인 게임 엔진, 봇 러너
scripts/         WebSocket 및 정적 회귀 테스트 스크립트
docs/            문서 허브, 기능 설명, 계획, 테스트, 보고서, 기준 문서
assets/          프로젝트 정적 자산
```

## 문서 구조

```text
docs/features/   기능별 현재 상태와 진입 문서
docs/overview/   프로젝트 현황, 로드맵, 큰 그림
docs/guides/     개발/문서화 작업 절차
docs/reference/  규칙, 감사 기준, 봇 판단 기준 같은 장기 기준 문서
docs/plans/      날짜별 구현 계획
docs/tests/      테스트 계획, 테스트 결과, 감사 문서
docs/reports/    최종 보고서와 완료 요약
docs/issues/     알려진 문제와 후속 조치
```

## 개발 원칙

이 프로젝트의 작업 흐름은 다음 산출물을 기준으로 합니다.

```text
1. 관련 문서 확인
2. 구현 계획 작성 또는 갱신
3. 구현
4. 테스트 계획 작성
5. 테스트 수행
6. 최종 보고서 작성
```

상세 기준은 [개발 프로세스](../features/development-process.md), [개발 프로세스 가이드라인](../guides/development-process-guideline.md), [문서 작성/배치 규칙](../guides/documentation-style-guide.md)을 따릅니다.

## 테스트

현재 `scripts` 디렉터리에는 온라인 핵심 기능과 봇 안정화 회귀 테스트가 포함되어 있습니다.

대표 실행 예:

```bash
node --check server.js
node --check script.js
node scripts/online-08-basic-building-ws-test.js
node scripts/online-09-bank-trade-ws-test.js
node scripts/online-10-player-trade-ws-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-12-robber-seven-pending-ws-test.js
node scripts/bot-09-stabilization-regression-test.js
```

더 자세한 테스트 범위와 미검증 항목은 [테스트와 검증](../features/testing-and-quality.md)을 확인하세요.
