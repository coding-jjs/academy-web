import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import StudentGradesScreen from "./StudentGradesScreen";
import type {
    StudentGradesData,
    WrongNoteStatus,
} from "./StudentGradesScreen";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
    const session = await requireRole("STUDENT");

    const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
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
                take: 30,
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
                take: 30,
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
                        select: { title: true, subject: true },
                    },
                    images: {
                        orderBy: { sortOrder: "asc" },
                        select: { id: true, url: true },
                    },
                },
            },
        },
    });

    if (!student) {
        return (
            <StudentGradesScreen
                data={{
                    linked: false,
                    studentName: session.user.name ?? "학생",
                    schoolName: null,
                    grade: null,
                    className: null,
                    teacherName: null,
                    highlights: [],
                    openWrongCount: 0,
                    grades: [],
                    wrongNotes: [],
                }}
            />
        );
    }

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
            percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
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
        imageUrls: note.images.map((img) => img.url),
    }));

    const data: StudentGradesData = {
        linked: true,
        studentName: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        className: student.enrollments[0]?.class.name ?? null,
        teacherName: student.enrollments[0]?.class.teacher?.name ?? null,
        highlights,
        openWrongCount: wrongNotes.filter((n) => n.status === "OPEN").length,
        grades,
        wrongNotes,
    };

    return <StudentGradesScreen data={data} />;
}
