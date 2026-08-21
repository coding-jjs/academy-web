import "server-only"; // 조회만. 쓰기는 grades/actions.ts. 브라우저가 Prisma를 치지 않는다.

/**
 * 학부모 링크 / 학생 userId로만 읽는 성적·오답 조회.
 *
 * 호출: `/parent/grades`, `/student/grades`, 챗봇 컨텍스트.
 * 쓰기 액션(`actions.ts`)과 쿼리를 분리해 뷰어가 저장 API를 타지 않게 한다.
 *
 * 미연결 학생 계정은 빈 데이터(linked=false)로 돌려 타 학생 기록이 노출되지 않게 한다.
 * 학부모는 imageCount만, 학생은 imageUrls까지 붙인다.
 *
 * 의도적으로 하지 않는 일:
 * - 성적 입력 → `actions.ts` / `data.ts`.
 * - 링크가 끝난 자녀를 넣지 않음 → endedAt: null만.
 *
 * 관련: `types.ts`, `formatters.ts`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma. 뷰어 묶음만 읽는다.
import type { // 뷰어 DTO. 입력 GradesGradeRow와 나눈다.
    GradeHighlight, // 과목별 최근·직전. 입력 화면은 이 카드를 안 그린다.
    ParentGradesChild, // endedAt:null 링크 자녀. 타 원생을 채우지 않는다.
    StudentGradeRecord, // percent 포함. 입력 행에는 없다.
    StudentGradesData, // 본인 뷰어. linked=false면 빈 화면.
    StudentWrongNote, // 학부모는 imageCount. 학생은 imageUrls를 교차.
    WrongNoteStatus, // OPEN만 미복습 카운트.
} from "@/features/grades/types"; // 뷰어 DTO. data.ts 입력 행과 나눈다.

const gradeRecordSelection = { // 뷰어 성적. percent는 mapGradeRecord가 계산.
    id: true, // 뷰어 행. 수정 Action은 없다.
    title: true, // 평가 제목.
    subject: true, // 하이라이트 키.
    score: true, // Decimal → number.
    maxScore: true, // 0이면 percent=null.
    assessedAt: true, // ISO. formatters가 KST.
    class: { select: { name: true } }, // 저장 당시 반 이름. 쓰기 권한 판정은 아니다.
} as const; // 학부모·학생 공통 select.

const wrongNoteSelection = { // 뷰어 오답. URL은 학생 map에서만 붙인다.
    id: true, // 뷰어 행. 상태 변경 Action은 없다.
    questionNo: true, // 문항 번호.
    questionText: true, // 문제 본문.
    studentAnswer: true, // 학생 답.
    correctAnswer: true, // 정답.
    explanation: true, // 해설.
    status: true, // OPEN만 미복습 카운트.
    createdAt: true, // ISO.
    class: { select: { name: true } }, // 오답에 붙은 반.
    gradeRecord: { select: { title: true, subject: true } }, // 연결 성적.
    images: { // 학부모는 장수만. 학생 뷰어가 url을 따로 붙인다.
        orderBy: { sortOrder: "asc" }, // 표시 순서.
        select: { id: true, url: true }, // 학부모는 장수만, 학생 뷰어가 url을 따로 붙인다.
    },
} as const; // 학부모·학생 공통. imageUrls는 학생만.

/**
 * 학부모 userId에 연결된 자녀별 성적·오답.
 * 링크가 없으면 빈 배열 — 다른 학부모 자녀를 채워 넣지 않는다.
 */
export async function getParentGradesChildren( // 본인 링크만. 입력 getGradesManagementData와 나눈다.
    parentUserId: string, // PARENT User id. 원생 카드 id가 아니다.
): Promise<ParentGradesChild[]> { // 끊긴 자녀를 넣지 않는다.
    const links = await prisma.parentStudentLink.findMany({ // endedAt:null만.
        where: { parentUserId, endedAt: null }, // 본인 링크만. 끊긴 자녀를 넣지 않는다.
        orderBy: { linkedAt: "asc" }, // 연결 순.
        select: { // 자녀 카드. 타 학부모 자녀를 채우지 않는다.
            student: { // 원생. 입력 화면 선택 목록과 쿼리를 나눈다.
                select: { // 뷰어 필드. 쓰기 권한 판정이 아니다.
                    id: true, // 자녀 원생 카드.
                    name: true, // 자녀 이름.
                    schoolName: true, // 온보딩 학교.
                    grade: true, // 온보딩 학년.
                    enrollments: { // take:1 표시용 현재 반. 권한 판정이 아니다.
                        where: { status: "ACTIVE", endedAt: null }, // 해제 수강은 반 이름에서 뺀다.
                        take: 1, // 표시용 현재 반. 쓰기 권한의 담임 판정은 아니다.
                        select: { // 반·담임 이름.
                            class: { // 표시용. actions.ts take:1 담임 판정과 다르다.
                                select: { // 이름·담임만.
                                    name: true, // 반 이름.
                                    teacher: { select: { name: true } }, // 그 반 담임.
                                },
                            },
                        },
                    },
                    gradeRecords: { // 최근 성적. percent는 map에서.
                        orderBy: { assessedAt: "desc" }, // 최근 평가일.
                        take: 20, // 최근 20건. 입력 화면 200건과 쿼리를 나눈다.
                        select: gradeRecordSelection, // percent는 mapGradeRecord.
                    },
                    wrongNotes: { // imageCount만. imageUrls는 학생 뷰어.
                        orderBy: { createdAt: "desc" }, // 최근 작성.
                        take: 20, // 최근 20건.
                        select: wrongNoteSelection, // URL은 학부모 map에서 안 붙인다.
                    },
                },
            },
        },
    });

    return links.map(({ student }) => { // 본인 자녀만. 타 원생을 채우지 않는다.
        const grades = student.gradeRecords.map(mapGradeRecord); // percent 포함. 학부모는 수정 Action이 없다.
        const wrongNotes = student.wrongNotes.map(mapWrongNote); // imageCount만. imageUrls는 학생 뷰어 전용.
        return { // ParentGradesChild. 입력 화면 묶음이 아니다.
            id: student.id, // 자녀 원생 카드.
            name: student.name, // 자녀 이름.
            schoolName: student.schoolName, // 온보딩 학교.
            grade: student.grade, // 온보딩 학년.
            className: student.enrollments[0]?.class.name ?? null, // take:1 표시용.
            teacherName: student.enrollments[0]?.class.teacher?.name ?? null, // 그 반 담임.
            highlights: getGradeHighlights(grades), // 과목별 최근·직전 상위 3.
            openWrongCount: countOpenWrongNotes(wrongNotes), // OPEN만.
            grades, // percent 포함.
            wrongNotes, // imageCount만.
        };
    });
}

/**
 * 로그인한 학생 계정의 성적. Student.userId가 없으면 빈 화면용 데이터를 준다.
 *
 * @param fallbackStudentName 미연결일 때 헤더에 쓸 세션 이름.
 */
export async function getStudentGradesData( // 본인만. 타 학생 기록을 채우지 않는다.
    studentUserId: string, // STUDENT User id. 원생 카드 id가 아니다.
    fallbackStudentName: string, // 미연결일 때 세션 이름.
): Promise<StudentGradesData> { // linked=false면 빈 화면.
    const student = await prisma.student.findFirst({ // Student.userId가 세션과 맞는 행만.
        where: { userId: studentUserId }, // Student.userId가 세션과 맞는 행만. 타 학생 기록을 채우지 않는다.
        select: { // 본인 뷰어. 학부모 자녀 배열이 아니다.
            id: true, // 원생 카드.
            name: true, // 본인 이름.
            schoolName: true, // Student 행의 학교.
            grade: true, // Student 행의 학년.
            enrollments: { // take:1 표시용 현재 반·담임.
                where: { status: "ACTIVE", endedAt: null }, // 해제 수강은 반 이름에서 뺀다.
                take: 1, // 표시용 현재 반·담임. 학생 본인 화면.
                select: gradeRecordSelection, // 기존 select. 로직을 바꾸지 않는다.
            },
            wrongNotes: { // 본인 오답. 학부모는 imageCount만.
                orderBy: { createdAt: "desc" }, // 최근 작성.
                take: 30, // 학생 오답 상한. 학부모 20과 다르다.
                select: wrongNoteSelection, // imageUrls는 아래에서 붙인다.
            },
        },
    });

    if (!student) return createUnlinkedGradesData(fallbackStudentName); // 미연결 계정. 빈 데이터로 타 학생 기록이 노출되지 않게.

    const grades = student.gradeRecords.map(mapGradeRecord); // 본인 성적. 수정 Action 없음.
    const wrongNotes = student.wrongNotes.map((note) => ({ // 학생만 사진 URL.
        ...mapWrongNote(note), // imageCount 포함.
        imageUrls: note.images.map((image) => image.url), // 학생만 사진을 연다. 학부모는 imageCount만.
    }));

    return { // 연결됨. 타 학생 점수를 채우지 않는다.
        linked: true, // Student 행이 세션 userId와 맞음.
        studentName: student.name, // 본인 이름.
        schoolName: student.schoolName, // Student 행의 학교.
        grade: student.grade, // Student 행의 학년.
        className: student.enrollments[0]?.class.name ?? null, // take:1 표시용.
        teacherName: student.enrollments[0]?.class.teacher?.name ?? null, // 그 반 담임.
        highlights: getGradeHighlights(grades), // 과목별 최근·직전.
        openWrongCount: countOpenWrongNotes(wrongNotes), // OPEN만.
        grades, // 본인 성적. 수정 Action 없음.
        wrongNotes, // 학생만 imageUrls.
    };
}

function mapGradeRecord( // 뷰어 행. 입력 GradesGradeRow에는 percent가 없다.
    gradeRecord: { // Prisma 행. Decimal은 unknown으로 받아 Number.
        id: string; // 뷰어 행 id.
        title: string; // 평가 제목.
        subject: string; // 하이라이트 키.
        score: unknown; // Decimal → number.
        maxScore: unknown; // 0이면 percent=null.
        assessedAt: Date; // ISO로 내린다.
        class: { name: string } | null; // 저장 당시 반.
    },
): StudentGradeRecord { // percent 포함.
    const score = Number(gradeRecord.score); // Decimal → number. 입력 화면과 같은 변환.
    const maxScore = Number(gradeRecord.maxScore); // 0이면 percent=null.
    return { // 뷰어 카드. 수정 Action은 없다.
        id: gradeRecord.id, // 뷰어 행.
        title: gradeRecord.title, // 평가 제목.
        subject: gradeRecord.subject, // 하이라이트 키.
        className: gradeRecord.class?.name ?? null, // 저장 당시 반.
        score, // number.
        maxScore, // 0이면 percent=null.
        percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : null, // 만점 0이면 null. 입력 행에는 이 필드가 없다.
        assessedAt: gradeRecord.assessedAt.toISOString(), // ISO. formatters가 KST.
    };
}

function mapWrongNote(note: { // 학부모 imageCount. 학생 imageUrls는 호출부가 붙인다.
    id: string; // 뷰어 행.
    questionNo: string | null; // 문항 번호.
    questionText: string | null; // 문제 본문.
    studentAnswer: string | null; // 학생 답.
    correctAnswer: string | null; // 정답.
    explanation: string | null; // 해설.
    status: string; // OPEN만 카운트.
    createdAt: Date; // ISO.
    class: { name: string } | null; // 오답에 붙은 반.
    gradeRecord: { title: string; subject: string } | null; // 연결 성적.
    images: Array<{ id: string; url: string }>; // 학부모는 length만.
}): StudentWrongNote { // 상태 변경 Action은 없다.
    return { // 뷰어 오답. URL은 학생만 교차.
        id: note.id, // 뷰어 행.
        questionNo: note.questionNo, // 문항 번호.
        questionText: note.questionText, // 문제 본문.
        studentAnswer: note.studentAnswer, // 학생 답.
        correctAnswer: note.correctAnswer, // 정답.
        explanation: note.explanation, // 해설.
        status: note.status as WrongNoteStatus, // OPEN만 미복습 카운트.
        createdAt: note.createdAt.toISOString(), // ISO.
        className: note.class?.name ?? null, // 오답에 붙은 반.
        subject: note.gradeRecord?.subject ?? null, // 연결 성적 과목.
        gradeTitle: note.gradeRecord?.title ?? null, // 연결 성적 제목.
        imageCount: note.images.length, // 학부모는 장수만. 학생 뷰어가 imageUrls를 따로 붙인다.
    };
}

function getGradeHighlights(grades: StudentGradeRecord[]): GradeHighlight[] { // 입력 화면은 이 카드를 안 그린다.
    const latestBySubject = new Map< // 과목별 최근·직전. 세 번째부터는 버린다.
        string, // subject 키.
        { score: number; previous: number | null } // previous 없으면 delta=null.
    >(); // 과목 맵.

    for (const grade of grades) { // assessedAt desc 전제. 첫 행=최근.
        const latest = latestBySubject.get(grade.subject); // 과목별 누적.
        if (!latest) { // 과목별 첫 행 = 최근.
            latestBySubject.set(grade.subject, { // 직전은 아직 없음.
                score: grade.score, // assessedAt desc 목록의 과목별 첫 행 = 최근.
                previous: null, // 직전 없음. 화면은 "비교 없음".
            });
        } else if (latest.previous == null) { // 둘째 행만 직전.
            latest.previous = grade.score; // 둘째 행 = 직전. 세 번째부터는 버린다.
        }
    }

    return Array.from(latestBySubject, ([subject, values]) => ({ // 상위 3과목만.
        subject, // 과목 키.
        score: values.score, // 최근 점수.
        delta: // 직전 없으면 null.
            values.previous == null // 비교 대상 없음.
                ? null // 비교 대상 없음. 화면은 "비교 없음".
                : Math.round((values.score - values.previous) * 10) / 10, // 소수 1자리. formatters가 부호를 붙인다.
    })).slice(0, 3); // 상위 3과목만.
}

function countOpenWrongNotes(notes: Array<{ status: WrongNoteStatus }>) { // 뷰어 카운트. 입력 화면 칩과 같다.
    return notes.filter((note) => note.status === "OPEN").length; // OPEN만 미복습. REVIEWED/MASTERED는 뺀다.
}

function createUnlinkedGradesData(studentName: string): StudentGradesData { // Student 행 없음. 타 학생 점수를 채우지 않는다.
    return { // 빈 화면. 세션 이름만.
        linked: false, // Student 행이 없을 때. 다른 학생 점수를 채우지 않는다.
        studentName, // 세션 이름 fallback. 타인 이름을 넣지 않는다.
        schoolName: null, // 연결 전.
        grade: null, // 연결 전.
        className: null, // 반 없음.
        teacherName: null, // 담임 없음.
        highlights: [], // 타 학생 하이라이트를 넣지 않는다.
        openWrongCount: 0, // 미복습 없음.
        grades: [], // 타 학생 성적을 채우지 않는다.
        wrongNotes: [], // 타 학생 오답을 채우지 않는다.
    };
}
