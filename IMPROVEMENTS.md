# 프로젝트 구조 개선 사항

## 1. 페이지 구조 개선
- `index.tsx`와 `feed.tsx`를 통합하여 중복 제거
- 페이지들을 기능별로 하위 디렉토리로 그룹화:
  - `/profile`: 프로필 관련 페이지 (profile-edit, profile-setup)
  - `/auth`: 인증 관련 페이지 (login)
  - `/routes`: 경로 관련 페이지 (map, routeConfirmation)

## 2. 컴포넌트 중복 최소화
- 공통 `ProfileImage` 컴포넌트 생성
- 지도 관련 공통 `MapComponent` 컴포넌트 생성

## 3. 타입 정의 통합
- `route.ts`와 `map.ts` 타입 정의 통합
- 중복 타입 제거 및 일관된 타입 정의 적용

## 4. 에러 처리 통합
- 일관된 에러 처리를 위한 `errorHandler.ts` 유틸리티 생성
- 에러 타입별 메시지 처리 기능 추가

## 5. 전역 상태 관리 개선
- 경로 데이터용 `RouteContext` 추가
- 전역적으로 경로 데이터를 관리하여 중복 API 호출 감소

## 6. 스타일링 일관성
- 공통 스타일 클래스를 `components.css`에 정의
- 재사용 가능한 Tailwind 클래스 추출

## 7. 서비스 계층 구조화
- `routeService.ts` 파일을 기능별로 분리:
  - `routeQueryService.ts`: 경로 조회 관련 함수
  - `routeMutationService.ts`: 경로 생성/수정/삭제 관련 함수

## 8. 경로 참조 업데이트
- 이동된 페이지에 대한 모든 참조 경로 업데이트

## 9. 코드 스플리팅 최적화
- 지도 컴포넌트에 `dynamic import` 적용
- 초기 로딩 시간 단축 및 성능 최적화 