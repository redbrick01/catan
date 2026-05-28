# 문서 작성/배치 규칙

작성일: 2026-05-28

## 목적

Catan 문서가 루트, 계획, 테스트, 보고서, 스크린샷 폴더에 섞이지 않도록 문서 위치와 형식을 고정한다. 새 문서를 만들거나 기존 문서를 이동할 때는 이 문서를 기준으로 한다.

## 표준 디렉터리

| 위치 | 용도 |
| --- | --- |
| `docs/README.md` | 문서 허브와 전체 목차 |
| `docs/overview/` | 프로젝트 현황, 로드맵, 릴리스 수준 요약 |
| `docs/features/` | 기능별 현재 상태, 관련 계획/테스트/보고서 링크 |
| `docs/guides/` | 개발 절차, 문서화 절차, 작업 방식 |
| `docs/reference/` | 게임 규칙, 규칙 차이 분석, 봇 판단 기준 |
| `docs/plans/` | 구현 전 계획서 |
| `docs/tests/` | 테스트 계획, 테스트 결과, 감사 문서 |
| `docs/tests/artifacts/` | 스크린샷, JSON 로그 등 테스트 산출물 |
| `docs/reports/` | 완료 보고서, gate summary |
| `docs/issues/` | known issues, playability issues, 후속 조치 목록 |

루트에는 `README.md`만 둔다. 프로젝트 기준 문서도 루트에 두지 않고 `docs/guides` 또는 `docs/reference`에 둔다.

## 파일명 규칙

날짜별 산출물은 다음 형식을 사용한다.

```text
YYYY-MM-DD_<area>-<sequence>-<short-title>-plan.md
YYYY-MM-DD_<area>-<sequence>-<short-title>-test-plan.md
YYYY-MM-DD_<area>-<sequence>-<short-title>-final-report.md
```

영역 이름은 가능하면 아래 중 하나를 쓴다.

```text
offline
online
bot
ui
game-feel
rules
quality
```

기능별 현재 상태 문서는 날짜를 붙이지 않는다. 예: `docs/features/bot-players.md`.

## 문서 형식

계획서는 아래 순서를 기본으로 한다.

```text
# 제목

작성일:
상태:
관련 문서:

## 목적
## 현재 상태
## 범위
## 구현 계획
## 영향 파일
## 검증 계획
## 완료 기준
## 남은 위험
```

테스트 문서는 아래 순서를 기본으로 한다.

```text
# 제목

작성일:
상태:
대상 계획:

## 목적
## 테스트 환경
## 자동 검증
## 수동 검증
## 결과
## 미검증 항목
## 산출물
```

최종 보고서는 아래 순서를 기본으로 한다.

```text
# 제목

작성일:
상태:
관련 계획:
관련 테스트:

## 요약
## 변경 사항
## 검증 결과
## 미검증 항목
## 남은 위험
## 후속 작업
```

## 링크 규칙

- 문서 허브와 기능 문서에서는 상대 링크를 사용한다.
- 오래된 경로인 `docs/implementation_plans`, `docs/test_plans`, `docs/final_reports`, `docs/known_issues`는 사용하지 않는다.
- 테스트 스크린샷과 JSON 로그는 `docs/tests/artifacts/`로 링크한다.
- 코드 파일은 루트 기준 경로를 그대로 쓴다. 예: `script.js`, `server.js`.

## 갱신 규칙

기능 구현을 완료하면 최소한 아래 문서를 함께 갱신한다.

```text
docs/features/<관련 기능>.md
docs/overview/status-and-roadmap.md
docs/README.md
```

새로운 작업 단위가 생기면 `docs/plans`, `docs/tests`, `docs/reports`에 같은 제목 축으로 문서를 남긴다. 검증하지 못한 항목은 `docs/issues` 또는 해당 최종 보고서의 `미검증 항목`에 남긴다.
