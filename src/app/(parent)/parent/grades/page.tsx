import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ParentGradesScreen from "@/app/(parent)/parent/grades/ParentGradesScreen";
import type {
    ParentGradesChild,
    WrongNoteStatus,
} from "@/app/(parent)/parent/grades/ParentGradesScreen";

export const dynamic = "force-dynamic";

export default async function ParentGradesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

    const links = await prisma.parentStudentLink.findMany({
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
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        take: 1,
                        select: {
                            class: {
                                select: {
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                    },
                    gradeRecords: {
                        orderBy: { assessedAt: "desc" },
                        take: 20,
                        select: {
                            id: true,
                            title: true,
                            subject: true,
                            score: true,
                            maxScore: true,
                            assessedAt: true,
                            class: { select: { name: true } },
                        },
                    },
                    wrongNotes: {
                        orderBy: { createdAt: "desc" },
                        take: 20,
                        select: {
                            id: true,
                            questionNo: true,
                            questionText: true,
                            studentAnswer: true,
                            correctAnswer: true,
                            explanation: true,
                            status: true,
                            createdAt: true,
                            class: { select: { name: true } },
                            gradeRecord: {
                                select: {
                                    title: true,
                                    subject: true,
                                },
                            },
                            images: {
                                orderBy: { sortOrder: "asc" },
                                select: { id: true },
                            },
                        },
                    },
                },
            },
        },
    });

    const children: ParentGradesChild[] = links.map(({ student }) => {
        const enrollment = student.enrollments[0];
        const grades = student.gradeRecords.map((g) => {
            const score = Number(g.score);
            const maxScore = Number(g.maxScore);
            return {
                id: g.id,
                title: g.title,
                subject: g.subject,
                className: g.class?.name ?? null,
                score,
                maxScore,
                percent:
                    maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
                assessedAt: g.assessedAt.toISOString(),
            };
        });

        const subjectLatest = new Map<
            string,
            { score: number; previous: number | null }
        >();
        for (const g of grades) {
            const existing = subjectLatest.get(g.subject);
            if (!existing) {
                subjectLatest.set(g.subject, { score: g.score, previous: null });
            } else if (existing.previous == null) {
                subjectLatest.set(g.subject, {
                    score: existing.score,
                    previous: g.score,
                });
            }
        }

        const highlights = Array.from(subjectLatest.entries())
            .slice(0, 3)
            .map(([subject, values]) => ({
                subject,
                score: values.score,
                delta:
                    values.previous == null
                        ? null
                        : Math.round((values.score - values.previous) * 10) / 10,
            }));

        const wrongNotes = student.wrongNotes.map((note) => ({
            id: note.id,
            questionNo: note.questionNo,
            questionText: note.questionText,
            studentAnswer: note.studentAnswer,
            correctAnswer: note.correctAnswer,
            explanation: note.explanation,
            status: note.status as WrongNoteStatus,
            createdAt: note.createdAt.toISOString(),
            className: note.class?.name ?? null,
            subject: note.gradeRecord?.subject ?? null,
            gradeTitle: note.gradeRecord?.title ?? null,
            imageCount: note.images.length,
        }));

        const openWrongCount = wrongNotes.filter(
            (n) => n.status === "OPEN",
        ).length;

        return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            highlights,
            openWrongCount,
            grades,
            wrongNotes,
        };
    });

    return <ParentGradesScreen childList={children} />;
}