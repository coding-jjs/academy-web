/**
 * ESLint 설정.
 * Next 코어 웹 바이탈·TypeScript 규칙을 쓰고, 빌드 산출물은 검사에서 뺀다.
 *
 * 호출: `npm run lint` / `npm run validate`. 런타임 import 없음.
 *
 * `.next`/`out`/`build`/`next-env.d.ts`를 ignore하는 이유: 생성 파일이
 * 프로젝트 규칙을 어겨도 고칠 수 없고, next-env.d.ts는 Next가 매 빌드 덮는다.
 *
 * 의도적으로 하지 않는 일:
 * - prettier를 여기에 넣지 않는다. 포맷은 에디터/별도 도구.
 * - `src/generate/prisma`를 따로 ignore하지 않는다 — 필요하면 globalIgnores에 추가.
 *
 * 관련: `package.json` lint/validate 스크립트.
 */

import { defineConfig, globalIgnores } from "eslint/config"; // flat config. prettier는 여기 없다.
import nextVitals from "eslint-config-next/core-web-vitals"; // Next 화면·레이아웃 a11y/웹바이탈. 역할 가드 규칙은 여기 없다.
import nextTs from "eslint-config-next/typescript"; // TS. src/generate는 별도 ignore하지 않는다.

const eslintConfig = defineConfig([ // npm run lint / validate. 런타임 import 없음.
  ...nextVitals, // Next 화면·레이아웃 a11y/웹바이탈. 역할 가드 규칙은 여기 없다.
  ...nextTs, // TS. src/generate는 별도 ignore하지 않는다.
  globalIgnores([ // 생성 파일은 프로젝트 규칙을 어겨도 고칠 수 없다. next-env.d.ts는 빌드가 덮는다.
    ".next/**", // Next 빌드 산출물. 매 빌드 덮는다.
    "out/**", // export 산출물.
    "build/**", // 기타 빌드 폴더.
    "next-env.d.ts", // Next가 매 빌드 덮는다. 프로젝트 규칙으로 고치지 않는다.
  ]),
]);

export default eslintConfig; // npm run lint / validate. 런타임 import 없음.
