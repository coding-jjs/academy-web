# A학원 SaaS · Next.js

원장, 교사·직원, 학부모, 학생, 게스트가 사용하는 단일 Next.js 풀스택 프로젝트입니다.

## git 명령어

```bash
git checkout main
git pull origin main
git checkout [본인_브랜치명]
git merge main
---본인 작업 후---
git add .
git commit -m "커밋 내용"
git push origin [본인_브랜치명]
```

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Google 로그인 설정

1. Google Cloud Console에서 OAuth 클라이언트 유형을 **웹 애플리케이션**으로 생성합니다.
2. 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google`을 등록합니다.
3. `.env.example`을 `.env.local`로 복사하고 Google 클라이언트 ID와 보안 비밀을 입력합니다.
4. `npx auth secret`으로 `AUTH_SECRET`을 생성한 뒤 개발 서버를 다시 실행합니다.

`.env.local`은 저장소에 커밋하지 않습니다. 배포 환경에서는 실제 도메인의
`https://도메인/api/auth/callback/google`도 Google Cloud Console에 등록해야 합니다.

## 주요 기능

- `/director`, `/staff`, `/parent`, `/student`, `/guest` 역할별 접근 제어 라우트
- 교직원용 `AdminShell`, 회원용 `MemberShell`
- Auth.js 기반 Google OAuth 로그인
- Google 인증 후 추가 정보를 입력하는 회원가입 흐름
- Apple 디자인 토큰 기반의 반응형 UI
- Prisma 마이그레이션으로 관리하는 PostgreSQL 스키마
- `/preview`에서 기존 전체 역할 와이어프레임 제공

## 주요 구조

```text
prisma/                     PostgreSQL·Prisma 스키마
scripts/                    운영 스크립트
src/app/(auth)/             로그인·회원가입·로그인 후 역할 분기
src/app/(director)/         원장 라우트
src/app/(staff)/            교직원 라우트
src/app/(parent)/           학부모 라우트
src/app/(student)/          학생 라우트
src/app/(guest)/            게스트 라우트
src/components/layout/      AdminShell·MemberShell
src/features/               여러 역할이 공유하는 도메인 화면·액션
src/lib/                    인증·DB·권한·공통 서버 로직
src/types/                  공통 역할·권한 타입
```

Next.js 16에서는 `middleware.ts`가 폐기되어 동일한 역할을 하는
`src/proxy.ts`를 사용합니다.

## 데이터베이스

```bash
npx prisma migrate dev      # 로컬 개발 DB
npx prisma migrate deploy   # 배포 DB
```

`prisma/schema.prisma`가 애플리케이션의 기준 스키마이며, 변경 이력은
`prisma/migrations`에서 관리합니다. 초기 SQL을 별도로 복제해 관리하지 않습니다.

## 최초 원장 설정

Google 로그인과 회원가입을 마친 GUEST 계정을 최초 원장으로 한 번만 승격합니다.

```bash
npm run bootstrap:director -- director@example.com
```

`BOOTSTRAP_SECRET`이 필요하며, 이미 원장이 존재하면 요청을 거부합니다.

## 검사

```bash
npm run validate
```
