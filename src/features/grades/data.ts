import "server-only"; // 조회만. 쓰기는 grades/actions.ts. 브라우저가 Prisma를 치지 않는다.

/**
 * 원장·직원 성적 입력 화면용 학생·성적·오답 조회.
 *
 * 호출: `/director/grades`, `/teacher/grades` 페이지가 where를 만들어 넘긴다.
 * 권한 스코프는 호출부가 넣은 where에만 두고, 이 파일은 화면용 묶음으로 바꾼다.
 *
 * 학생 목록의 활성 수강 take:1은 표시용 반 이름이다. 쓰기 권한의 담임 판정은 `actions.ts`가 다시 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 뷰어 조회 → `viewer-data.ts`.
 * - where를 여기서 넓히지 않음. 스코프를 빼면 전 원생이 보인다.
 *
 * 관련: `GradesManagementScreen.tsx`, `actions.ts`.
 */

import type { Prisma } from "@/generate/prisma/client"; // where 타입. 스코프는 호출부가 넣는다.
import { prisma } from "@/lib/db"; // server-only Prisma. 입력 화면 묶음만 읽는다.
import type { // 입력 화면 DTO. 뷰어 percent·imageUrls는 없다.
    GradesGradeRow, // 점수/만점만. percent는 viewer-data.
    GradesStudentOption, // take:1 표시용 반. 권한 판정은 actions.ts.
    GradesWrongRow, // 입력 오답. 학생 뷰어 imageUrls는 없다.
} from "@/features/grades/types"; // 입력 DTO. viewer-data와 나눈다.

type GradesManagementData = { // 입력 화면 묶음. 학부모 자녀 배열이 아니다.
    students: GradesStudentOption[]; // 호출부 where 스코프. 여기서 넓히지 않는다.
    grades: GradesGradeRow[]; // 최근 200건. 화면이 학생별로 다시 필터.
    wrongNotes: GradesWrongRow[]; // imageUrls 없음. 학생 뷰어 전용.
};

/**
 * 스코프가 적용된 where로 학생·최근 성적·오답을 한 묶음으로 읽는다.
 * 성적·오답은 최근 200건. 화면은 selectedStudentId로 다시 걸러 쓴다.
 */
export async function getGradesManagementData({ // 쓰기 화면 조회. 뷰어 getParent/StudentGrades와 나눈다.
    studentWhere, // page가 넣은 스코프. 여기서 넓히면 전 원생이 보인다.
    gradeWhere, // 호출부 스코프. 학부모 viewer-data와 쿼리를 나눈다.
    wrongNoteWhere, // 호출부 스코프.
}: { // 스코프는 호출부. 이 파일은 묶음만.
    studentWhere: Prisma.StudentWhereInput; // page 스코프. 여기서 넓히지 않는다.
    gradeWhere?: Prisma.GradeRecordWhereInput; // 없으면 전 건 — 호출부가 넣어야 한다.
    wrongNoteWhere?: Prisma.WrongNoteWhereInput; // 없으면 전 건.
}): Promise<GradesManagementData> { // 화면은 selectedStudentId로 다시 건다.
    const [studentRecords, gradeRecords, wrongNoteRecords] = await Promise.all([ // 세 쿼리 병렬. 뷰어 쿼리와 나눈다.
        prisma.student.findMany({ // 입력 화면 선택 목록.
            where: studentWhere, // page가 넣은 스코프. 여기서 넓히면 전 원생이 보인다.
            orderBy: { name: "asc" }, // 이름순.
            select: { // 선택 항목. 뷰어 하이라이트는 없다.
                id: true, // 원생 카드. 성적 저장 studentId.
                name: true, // 출석 명단 이름.
                enrollments: { // 표시용 현재 반. 권한은 actions.ts가 take:1로 다시 본다.
                    where: { endedAt: null, status: "ACTIVE" }, // 해제는 CANCELLED+endedAt. 활성만 반 이름.
                    take: 1, // 표시용 현재 반. 쓰기 권한의 담임 판정은 actions.ts가 take:1로 다시 한다.
                    select: { // 반 id·이름. 권한 키가 아니다.
                        classId: true, // 성적 저장 시 반을 붙일 때. 권한 키가 아니다.
                        class: { select: { name: true } }, // 반 이름 표시.
                    },
                },
            },
        }),
        prisma.gradeRecord.findMany({ // 입력 화면 성적. percent는 계산하지 않는다.
            where: gradeWhere, // 호출부 스코프. 학부모 viewer-data와 쿼리를 나눈다.
            orderBy: { assessedAt: "desc" }, // 최근 평가일.
            take: 200, // 최근 200건. 화면이 학생별로 다시 필터한다.
            select: { // 점수/만점. percent는 viewer-data.
                id: true, // 수정 시 gradeId. 삭제는 없다.
                studentId: true, // 워크스페이스가 고른 학생으로 다시 건다.
                title: true, // 평가 제목.
                subject: true, // 과목 키.
                score: true, // Decimal → number.
                maxScore: true, // 0이면 뷰어 percent는 null.
                assessedAt: true, // ISO. 화면은 KST.
                class: { select: { name: true } }, // 저장 당시 반. 없으면 null.
            },
        }),
        prisma.wrongNote.findMany({ // 입력 화면 오답. imageUrls는 학생 뷰어 전용.
            where: wrongNoteWhere, // 호출부 스코프.
            orderBy: { createdAt: "desc" }, // 최근 작성.
            take: 200, // 최근 200건. imageUrls는 학생 뷰어 전용이라 여기 없다.
            select: { // 입력 오답. 학부모 imageCount도 없다.
                id: true, // 수정 시 wrongNoteId.
                studentId: true, // 고른 학생 오답만 패널에 넘긴다.
                gradeRecordId: true, // 연결 성적. updateWrongNote는 이 값을 받지 않는다.
                questionNo: true, // 문항 번호.
                questionText: true, // 문제 본문.
                studentAnswer: true, // 학생 답.
                correctAnswer: true, // 정답.
                explanation: true, // 해설.
                status: true, // OPEN만 미복습 카운트.
                createdAt: true, // ISO.
                gradeRecord: { select: { title: true } }, // 연결 성적 제목.
            },
        }),
    ]);

    const students = studentRecords.map((student) => { // take:1 표시용. 복수 수강이어도 반 이름 하나.
        const activeEnrollment = student.enrollments[0]; // take:1 표시용. 쓰기 권한의 담임 판정은 actions.ts.

        return { // GradesStudentOption. 뷰어 자녀 DTO가 아니다.
            id: student.id, // 원생 카드.
            name: student.name, // 출석 명단 이름.
            classId: activeEnrollment?.classId ?? null, // 미배정이면 성적 행에 반 없이 저장.
            className: activeEnrollment?.class.name ?? null, // 표시용. 권한 판정이 아니다.
        };
    });

    const grades = gradeRecords.map((grade) => ({ // Decimal → number. percent는 계산하지 않는다.
        id: grade.id, // 수정 시 gradeId.
        studentId: grade.studentId, // 화면이 학생별로 다시 필터.
        title: grade.title, // 평가 제목.
        subject: grade.subject, // 과목 키.
        score: Number(grade.score), // Decimal → number. 화면이 Prisma 타입을 모르게.
        maxScore: Number(grade.maxScore), // 0이면 뷰어 percent는 null.
        assessedAt: grade.assessedAt.toISOString(), // ISO. 화면은 KST 문구만.
        className: grade.class?.name ?? null, // 저장 당시 반.
    }));

    const wrongNotes = wrongNoteRecords.map((wrongNote) => ({ // 입력 오답. imageUrls 없음.
        id: wrongNote.id, // 수정 시 wrongNoteId.
        studentId: wrongNote.studentId, // 고른 학생만 패널에 넘긴다.
        gradeRecordId: wrongNote.gradeRecordId, // 수정 화면은 이 연결을 잠근다.
        questionNo: wrongNote.questionNo, // 문항 번호.
        questionText: wrongNote.questionText, // 문제 본문.
        studentAnswer: wrongNote.studentAnswer, // 학생 답.
        correctAnswer: wrongNote.correctAnswer, // 정답.
        explanation: wrongNote.explanation, // 해설.
        status: wrongNote.status, // OPEN만 미복습 카운트.
        createdAt: wrongNote.createdAt.toISOString(), // ISO.
        gradeTitle: wrongNote.gradeRecord?.title ?? null, // 연결 성적 제목.
    }));

    return { students, grades, wrongNotes }; // 화면은 selectedStudentId로 다시 건다. 여기서 학생을 고르지 않는다.
}
