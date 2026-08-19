import "server-only"; // 조회만. 쓰기는 notices/actions.ts. 브라우저가 Prisma를 치지 않는다.

/**
 * 게시된 공개 공지 조회. kind=NOTICE·published·audience=ALL만 돌려 /notices와 홈에 쓴다.
 *
 * 호출: `/notices`가 getPublishedNotices, `/`(홈)이 getHomeNotices.
 * getHomeNotices는 같은 목록을 3건으로 잘라 홈 미리보기와 목록이 어긋나지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 피드 → `news/data.ts` (audience·카테고리·게시 기간).
 * - 미게시·특정 audience 공지를 공개 목록에 넣지 않음.
 *
 * 관련: `types.ts`, `actions.ts`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma. 공개 목록만 읽는다.
import { // 공개 카드 DTO. 피드 NewsItem과 나눈다.
    NOTICE_AUDIENCE_LABELS, // DB enum → 한글. 모르는 코드는 "전체".
    formatNoticeListDate, // MM.DD(KST).
    type Notice, // 공개 /notices 카드. 역할 피드가 아니다.
} from "@/features/notices/types"; // 공개 DTO. news/types.ts가 아니다.

function mapNotice(row: { // Prisma 행 → 공개 카드. MIME/5MB는 업로드 쪽.
    id: string; // NewsItem id. kind=NOTICE 행만.
    audience: string; // DB 코드. 화면에는 한글 라벨만.
    title: string; // 80자. 카드 한 줄.
    content: string | null; // 공개 목록은 공백이면 "내용이 없습니다."
    createdAt: Date; // formatNoticeListDate가 KST MM.DD.
    imageUrl: string | null; // 버킷 notices 공개 URL.
}): Notice { // 공개 카드. 피드 NewsItem이 아니다.
    return { // 화면이 DB enum·Date를 모르게.
        id: row.id, // NewsItem id. kind=NOTICE 행만.
        audience: NOTICE_AUDIENCE_LABELS[row.audience] ?? "전체", // 모르는 코드는 "전체". 화면이 DB enum을 모르게.
        title: row.title, // 카드 한 줄.
        date: formatNoticeListDate(row.createdAt), // MM.DD(KST).
        body: row.content?.trim() || "내용이 없습니다.", // 공개 목록 카드용. 작성 액션 map은 빈 문자열.
        imageUrl: row.imageUrl, // 버킷 notices 공개 URL. MIME/5MB는 업로드 쪽.
    };
}

/**
 * 공개 /notices용 공지 목록. 기본 200건.
 */
export async function getPublishedNotices(limit = 200): Promise<Notice[]> { // 로그인 없이. 피드 getPublishedNews와 쿼리를 나눈다.
    const rows = await prisma.newsItem.findMany({ // kind=NOTICE·published·audience=ALL만.
        where: { // 학부모 전용·BANNER·미게시는 뺀다.
            kind: "NOTICE", // 피드 BANNER·학부모 전용은 뺀다.
            published: true, // 미게시는 공개 목록에 안 넣는다.
            audience: "ALL", // 로그인 없이 공개 목록.
        },
        orderBy: [{ createdAt: "desc" }], // 최신 먼저.
        take: limit, // 홈은 3, 목록은 200.
        select: { // 공개 카드 필드만. 카테고리·게시 기간은 피드 쪽.
            id: true, // NewsItem id.
            audience: true, // 한글 라벨로 내린다.
            title: true, // 카드 제목.
            content: true, // body. 공백이면 "내용이 없습니다."
            createdAt: true, // MM.DD(KST).
            imageUrl: true, // 버킷 notices 공개 URL.
        },
    });

    return rows.map(mapNotice); // 공개 카드 DTO. 피드 ISO와 형식이 다르다.
}

/**
 * 홈 미리보기. 같은 쿼리를 limit만 줄여 목록 첫 화면과 내용이 갈라지지 않게 한다.
 */
export async function getHomeNotices(limit = 3): Promise<Notice[]> { // 같은 where. 홈 바 클릭은 /notices.
    return getPublishedNotices(limit); // 같은 where. 홈 바 클릭은 /notices.
}
