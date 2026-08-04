import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
    WrongNoteStatus,
} from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorGradesPage() {
    await requireRole("DIRECTOR");

    const [studentsRaw, gradesRaw, wrongsRaw] = await Promise.all([
        prisma.student.findMany({
            where: { status: "ENROLLED" },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                enrollments: {
                    where: { endedAt: null, status: "ACTIVE" },
                    take: 1,
                    select: {
                        classId: true,
                        class: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.gradeRecord.findMany({
            orderBy: { assessedAt: "desc" },
            take: 200,
            select: {
                id: true,
                studentId: true,
                title: true,
                subject: true,
                score: true,
                maxScore: true,
                assessedAt: true,
                class: { select: { name: true } },
            },
        }),
        prisma.wrongNote.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
                id: true,
                studentId: true,
                gradeRecordId: true,
                questionNo: true,
                questionText: true,
                studentAnswer: true,
                correctAnswer: true,
                explanation: true,
                status: true,
                createdAt: true,
                gradeRecord: { select: { title: true } },
            },
        }),
    ]);

    const students: GradesStudentOption[] = studentsRaw.map((s) => ({
        id: s.id,
        name: s.name,
        classId: s.enrollments[0]?.classId ?? null,
        className: s.enrollments[0]?.class.name ?? null,
    }));

    const grades: GradesGradeRow[] = gradesRaw.map((g) => ({
        id: g.id,
        studentId: g.studentId,
        title: g.title,
        subject: g.subject,
        score: Number(g.score),
        maxScore: Number(g.maxScore),
        assessedAt: g.assessedAt.toISOString(),
        className: g.class?.name ?? null,
    }));

    const wrongNotes: GradesWrongRow[] = wrongsRaw.map((w) => ({
        id: w.id,
        studentId: w.studentId,
        gradeRecordId: w.gradeRecordId,
        questionNo: w.questionNo,
        questionText: w.questionText,
        studentAnswer: w.studentAnswer,
        correctAnswer: w.correctAnswer,
        explanation: w.explanation,
        status: w.status as WrongNoteStatus,
        createdAt: w.createdAt.toISOString(),
        gradeTitle: w.gradeRecord?.title ?? null,
    }));

    return (
        <GradesManagementScreen
            students={students}
            grades={grades}
            wrongNotes={wrongNotes}
            canManage
        />
    );
}
