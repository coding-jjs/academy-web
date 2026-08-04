import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
    WrongNoteStatus,
} from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

export default async function StaffGradesPage() {
    const session = await requireRole("STAFF", "TEACHER");

    const [canOwn, canOther] = await Promise.all([
        userHasPermission(session.user.id, "ownClassAttendanceGrade"),
        userHasPermission(session.user.id, "otherTeacherAttendanceGrade"),
    ]);
    const canManage = canOwn || canOther;

    if (!canManage) {
        return (
            <GradesManagementScreen
                students={[]}
                grades={[]}
                wrongNotes={[]}
                canManage={false}
                deniedMessage="성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요."
            />
        );
    }

    const scope = await getStaffScope(session.user.id);
    const studentWhere = {
        status: "ENROLLED" as const,
        ...studentScopeWhere(scope),
    };

    const [studentsRaw, gradesRaw, wrongsRaw] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere,
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
            where: { student: studentWhere },
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
            where: { student: studentWhere },
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
