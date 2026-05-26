# Katan

브라우저에서 실행되는 카탄 스타일 보드게임 프로젝트입니다. 오프라인 로컬 플레이, 소규모 LAN/온라인 방 플레이, 서버가 제어하는 봇 플레이를 함께 지원하는 것을 목표로 합니다.

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

## 실행

필요 조건:

- Node.js
- npm

설치:

```bash
npm install
```

서버 실행:

```bash
npm start
```

또는 OS별 실행 스크립트를 사용할 수 있습니다.

```bash
npm run open
```

기본 포트는 `4173`입니다. 서버를 실행하면 로컬 접속 URL과 같은 네트워크에서 접속 가능한 URL이 터미널에 표시됩니다.

## 프로젝트 구조

```text
index.html       브라우저 UI 마크업
styles.css       화면 레이아웃과 반응형 스타일
script.js        클라이언트 게임/UI/온라인 연결 로직
server.js        정적 파일 서버, WebSocket 서버, 온라인 게임 엔진, 봇 러너
scripts/         WebSocket 및 정적 회귀 테스트 스크립트
docs/            기능별 문서, 구현 계획, 테스트 계획, 최종 보고서
assets/          프로젝트 정적 자산
```

## 문서 안내

문서는 기능별로 다시 묶어 `docs/features` 아래에 정리했습니다.

- [문서 허브](docs/README.md)
- [프로젝트 진행 상황과 발전 로드맵](docs/project-status-and-roadmap.md)
- [오프라인 플레이와 규칙 정확도](docs/features/offline-play.md)
- [온라인 멀티플레이](docs/features/online-multiplayer.md)
- [봇 플레이어](docs/features/bot-players.md)
- [UI와 플레이 보조](docs/features/ui-and-play-assists.md)
- [테스트와 검증](docs/features/testing-and-quality.md)
- [개발 프로세스](docs/features/development-process.md)

기존의 날짜별 구현 계획, 테스트 계획, 최종 보고서는 삭제하지 않고 보존했습니다. 새 기능별 문서는 기존 문서를 찾아가기 위한 진입점이자 현재 기능 상태 요약입니다.

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

상세 기준은 [개발 프로세스](docs/features/development-process.md)와 `catan_implementation_process_guideline.md`를 따릅니다.

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

더 자세한 테스트 범위와 미검증 항목은 [테스트와 검증](docs/features/testing-and-quality.md)을 확인하세요.
