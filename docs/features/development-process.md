# 개발 프로세스

## 목적

이 문서는 기능 개발, 버그 수정, UI 개선, 테스트 보강을 같은 흐름으로 관리하기 위한 실무 기준입니다. 코드를 바꾸는 것만으로 작업이 끝난 것으로 보지 않고, 계획과 검증 문서를 함께 남깁니다.

## 기본 산출물 흐름

```text
1. 관련 문서 확인
2. 구현 계획서 작성 또는 기존 계획서 갱신
3. 구현
4. 테스트 계획서 작성
5. 테스트 수행
6. 최종 보고서 작성
```

## 문서 위치

```text
docs/plans/     구현 전 계획
docs/tests/     테스트 계획과 실행 결과
docs/reports/   완료 보고서
docs/issues/    남은 문제와 후속 권장
docs/features/  기능별 현재 상태와 기존 문서 묶음
```

## 기준 문서

- [일반 개발 프로세스 가이드라인](../guides/development-process-guideline.md)
- [봇 개발 프로세스 가이드라인](../guides/bot-development-process-guideline.md)
- [상세 규칙 정리](../reference/catan-detailed-rules.md)
- [규칙 보완 문서](../reference/rule-gap-analysis.md)
- [플레이봇 참고자료 기반 구현 가이드라인](../reference/playbot-reference-guideline.md)

## 기능 변경 시 체크리스트

- 변경하려는 기능의 `docs/features/*.md` 문서를 먼저 확인합니다.
- 관련 구현 계획이 없으면 새 계획을 작성합니다.
- 구현 중 계획과 달라진 점이 있으면 계획 문서를 갱신합니다.
- 테스트 계획에는 자동 테스트, 수동 테스트, 미실행 항목을 분리해서 적습니다.
- 최종 보고서에는 변경 파일, 검증 결과, known issues 반영 여부를 기록합니다.
- 기능 상태가 바뀌면 해당 기능별 문서의 현재 지원 범위와 관련 문서 링크를 갱신합니다.

## 파일명 규칙

날짜는 `YYYY-MM-DD` 형식을 사용합니다. 기능 prefix는 기존 패턴을 따릅니다.

```text
2026-05-26_online-09-bank-harbor-trade-plan.md
2026-05-26_online-09-bank-harbor-trade-test-plan.md
2026-05-26_online-09-bank-harbor-trade-final-report.md
```

봇 기능은 `bot-NN`, 온라인 기능은 `online-NN`, 오프라인 플레이 보강은 `play-NNN` 또는 `stage-N` 패턴을 사용합니다.

## 최종 보고서에 포함할 내용

- 목표
- 참고 문서
- 변경 사항
- 실행한 테스트
- 실행하지 못한 테스트와 이유
- 남은 제한 사항
- 후속 권장 작업

## Git에 올리기 전 문서 점검

- 루트 `README.md`에서 실행 방법과 문서 진입점이 보이는지 확인합니다.
- 새 문서가 `docs/README.md` 또는 기능별 문서에서 링크되는지 확인합니다.
- 오래된 내용이 있으면 삭제보다 "현재 상태"와 "제한 사항"으로 정정합니다.
- 스크린샷, 로그, 테스트 결과는 어떤 기능 검증의 증거인지 문서에 연결합니다.
- 빈 로그 파일이나 로컬 임시 파일은 `.gitignore` 대상인지 확인합니다.
