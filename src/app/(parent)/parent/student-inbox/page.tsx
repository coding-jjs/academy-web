import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import ParentStudentInboxScreen from "./ParentStudentInboxScreen";
import type {
    ParentStudentInboxChild,
    StudentInboxMessage,
    StudentNewsItem,
} from "./ParentStudentInboxScreen";

export const dynamic = "force-dynamic";

export default async function ParentStudentInboxPage() {
    const session = await requireRole("PARENT");

    const now = new Date();

    const [links, newsRows] = await Promise.all([
        prisma.parentStudentLink.findMany({
            where: {
                parentUserId: session.user.id,
                endedAt: null,
            },
            orderBy: { linkedAt: "asc" },
            select: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        schoolName: true,
                        grade: true,
                        userId: true,
                        enrollments: {
                            where: { status: "ACTIVE", endedAt: null },
                            take: 1,
                            select: {
                                class: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["STUDENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [
                    {
                        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
                    },
                ],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 20,
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                category: true,
            },
        }),
    ]);

    const news: StudentNewsItem[] = newsRows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        createdAt: row.createdAt.toISOString(),
    }));

    const studentUserIds = links
        .map(({ student }) => student.userId)
        .filter((userId): userId is string => Boolean(userId));
    const recipientRows =
        studentUserIds.length === 0
            ? []
            : await prisma.messageRecipient.findMany({
                  where: { recipientUserId: { in: studentUserIds } },
                  orderBy: { createdAt: "desc" },
                  select: {
                      id: true,
                      recipientUserId: true,
                      readAt: true,
                      createdAt: true,
                      message: {
                          select: {
                              id: true,
                              title: true,
                              content: true,
                              createdAt: true,
                              sender: { select: { name: true, role: true } },
                          },
                      },
                  },
              });
    const recipientsByUser = Map.groupBy(
        recipientRows,
        (row) => row.recipientUserId,
    );

    const children: ParentStudentInboxChild[] = links.map(({ student }) => {
            const enrollment = student.enrollments[0];
            let messages: StudentInboxMessage[] = [];

            if (student.userId) {
                messages = (recipientsByUser.get(student.userId) ?? [])
                    .slice(0, 40)
                    .map((row) => ({
                    recipientId: row.id,
                    messageId: row.message.id,
                    title: row.message.title,
                    content: row.message.content,
                    // 학생 민감 딥링크는 학부모 화면에 노출하지 않음
                    deepLink: null,
                    createdAt: row.message.createdAt.toISOString(),
                    readAt: row.readAt?.toISOString() ?? null,
                    senderName: row.message.sender?.name ?? "A학원",
                    senderRole: row.message.sender?.role ?? null,
                    }));
            }

            return {
                id: student.id,
                name: student.name,
                schoolName: student.schoolName,
                grade: student.grade,
                className: enrollment?.class.name ?? null,
                hasStudentAccount: Boolean(student.userId),
                messages,
            };
        });

    return (
        <ParentStudentInboxScreen childList={children} news={news} />
    );
}
