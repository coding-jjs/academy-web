import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ParentStudentInboxScreen from "./ParentStudentInboxScreen";
import type {
    ParentStudentInboxChild,
    StudentInboxMessage,
    StudentNewsItem,
} from "./ParentStudentInboxScreen";

export const dynamic = "force-dynamic";

export default async function ParentStudentInboxPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

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

    const children: ParentStudentInboxChild[] = await Promise.all(
        links.map(async ({ student }) => {
            const enrollment = student.enrollments[0];
            let messages: StudentInboxMessage[] = [];

            if (student.userId) {
                const recipients = await prisma.messageRecipient.findMany({
                    where: { recipientUserId: student.userId },
                    orderBy: { createdAt: "desc" },
                    take: 40,
                    select: {
                        id: true,
                        readAt: true,
                        createdAt: true,
                        message: {
                            select: {
                                id: true,
                                title: true,
                                content: true,
                                deepLink: true,
                                createdAt: true,
                                sender: {
                                    select: {
                                        name: true,
                                        role: true,
                                    },
                                },
                            },
                        },
                    },
                });

                messages = recipients.map((row) => ({
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
        }),
    );

    return (
        <ParentStudentInboxScreen childList={children} news={news} />
    );
}