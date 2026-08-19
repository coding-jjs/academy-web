import "server-only"; // 조회만. 원장 작성 UI는 없다. 브라우저가 Prisma를 치지 않는다.

/**
 * 학부모·학생 피드용 게시 NewsItem 조회.
 *
 * 호출: `/parent/news`, `/student/news`가 audience를 넘겨 NewsScreen에 넣는다.
 * audience는 본인+ALL이고 게시 기간(startsAt/endsAt) 안만 돌려준다.
 *
 * 학생은 STUDENT_YOUTH·GENERAL만 남겨 학부모용 입학·모집 공지(PARENT_ADMISSION 등)가
 * 학생 피드에 안 뜨게 한다. 필터 칩(`presentation.ts`)과 같은 카테고리 집합이다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 /notices 목록 → `notices/data.ts` (kind=NOTICE, audience=ALL).
 * - 원장 작성 UI. 이 모듈은 읽기만.
 *
 * 관련: `NewsScreen.tsx`, `types.ts`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma. 피드 기간 안만 읽는다.
import type { NewsItem } from "@/features/news/types"; // 역할 피드 DTO. 공개 Notice와 나눈다.

/**
 * 역할별 체험 소식 피드.
 * STUDENT면 학부모 입학 카테고리를 where에서 빼 클라이언트 필터만으로 숨기지 않는다.
 */
export async function getPublishedNews(audience: "PARENT" | "STUDENT") { // 공개 /notices와 쿼리를 나눈다.
    const now = new Date(); // 게시 기간 비교. 공개 공지는 기간 필터가 없다.
    const rows = await prisma.newsItem.findMany({ // 본인+ALL. 학생은 PARENT_ADMISSION을 where에서 뺀다.
        where: { // 클라이언트 칩만으로 입학 공지를 숨기지 않는다.
            published: true, // 미게시는 피드에 안 넣는다.
            audience: { in: [audience, "ALL"] }, // 본인 역할 + 양쪽 공통.
            ...(audience === "STUDENT" // 학생 where. 학부모는 입학 카테고리를 남긴다.
                ? { category: { in: ["STUDENT_YOUTH", "GENERAL"] as const } } // 학부모 입학 카테고리는 클라이언트 필터만으로 숨기지 않는다.
                : {}), // 학부모는 PARENT_ADMISSION을 남긴다.
            OR: [{ startsAt: null }, { startsAt: { lte: now } }], // 시작 전 게시 제외.
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }], // 게시 기간 안만. 공개 /notices 쿼리와 나눈다.
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], // 정렬 후 최신.
        take: 50, // 피드 상한. 공개 목록 200과 다르다.
        select: { // 피드 카드 필드. 공개 Notice의 MM.DD와 형식이 다르다.
            id: true, // 피드 행.
            kind: true, // NOTICE=글, BANNER=이미지·링크.
            category: true, // 학생은 STUDENT_YOUTH·GENERAL만.
            audience: true, // PARENT/STUDENT/ALL.
            title: true, // 카드 제목.
            content: true, // 본문. 없으면 화면이 "상세 내용이 없습니다."
            imageUrl: true, // http(s)만 NewsScreen이 연다.
            linkUrl: true, // 자세히 보기. javascript: 는 화면이 거절.
            startsAt: true, // ISO로 내린다.
            endsAt: true, // ISO로 내린다.
            createdAt: true, // ISO. 화면은 KST.
        },
    });

    return rows.map( // Date → ISO. 화면은 KST로 표시한다.
        (row): NewsItem => ({ // 공개 Notice DTO가 아니다.
            ...row, // kind·category·audience 그대로.
            startsAt: row.startsAt?.toISOString() ?? null, // Date → ISO. 화면은 KST로 표시한다.
            endsAt: row.endsAt?.toISOString() ?? null, // 기간 밖은 where에서 이미 뺐다.
            createdAt: row.createdAt.toISOString(), // ISO. 공개 카드 MM.DD와 형식이 다르다.
        }),
    );
}
