import "server-only";

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
} from "@/features/grades/types";

type GradesManagementData = {
    students: GradesStudentOption[];
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
};

export async function getGradesManagementData({
    studentWhere,
    gradeWhere,
    wrongNoteWhere,
}: {
    studentWhere: Prisma.StudentWhereInput;
    gradeWhere?: Prisma.GradeRecordWhereInput;
    wrongNoteWhere?: Prisma.WrongNoteWhereInput;
}): Promise<GradesManagementData> {
    const [studentRecords, gradeRecords, wrongNoteRecords] = await Promise.all([
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
            where: gradeWhere,
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
            where: wrongNoteWhere,
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

    const students = studentRecords.map((student) => {
        const activeEnrollment = student.enrollments[0];

        return {
            id: student.id,
            name: student.name,
            classId: activeEnrollment?.classId ?? null,
            className: activeEnrollment?.class.name ?? null,
        };
    });

    const grades = gradeRecords.map((grade) => ({
        id: grade.id,
        studentId: grade.studentId,
        title: grade.title,
        subject: grade.subject,
        score: Number(grade.score),
        maxScore: Number(grade.maxScore),
        assessedAt: grade.assessedAt.toISOString(),
        className: grade.class?.name ?? null,
    }));

    const wrongNotes = wrongNoteRecords.map((wrongNote) => ({
        id: wrongNote.id,
        studentId: wrongNote.studentId,
        gradeRecordId: wrongNote.gradeRecordId,
        questionNo: wrongNote.questionNo,
        questionText: wrongNote.questionText,
        studentAnswer: wrongNote.studentAnswer,
        correctAnswer: wrongNote.correctAnswer,
        explanation: wrongNote.explanation,
        status: wrongNote.status,
        createdAt: wrongNote.createdAt.toISOString(),
        gradeTitle: wrongNote.gradeRecord?.title ?? null,
    }));

    return { students, grades, wrongNotes };
}
