import "server-only"; // 조회만. 쓰기는 counseling/actions.ts. 브라우저가 Prisma를 치지 않는다.

/**
 * 직원 상담 화면용 조회. 스코프 안 재원생 메모와, 선택적으로 미완료 문의를 묶는다.
 *
 * 호출: `/teacher/counseling`(onlyOwnMemos, 문의 없음),
 * `/employee/counseling`(전체 메모, includeInquiries).
 * 교사와 사무가 같은 StaffCounselingScreen을 쓰되 데이터 범위만 다르게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 완료·스팸 문의를 넣지 않음. NEW/IN_PROGRESS만.
 * - 쓰기 → `actions.ts`.
 *
 * 관련: `types.ts`, `@/lib/staff-scope`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma. 스코프 안만 읽는다.
import { // 직원 스코프. 원장 director-data는 스코프 없이 전 원생.
    enrollmentScopeWhere, // take:1 표시용 반. 쓰기 권한 판정이 아니다.
    studentScopeWhere, // 재원생 where. 퇴원생 메모는 원장 액션.
    type StaffScope, // 교사·사무 범위.
} from "@/lib/staff-scope"; // 원장 전 원생 조회와 나눈다.
import type { // 직원 화면 DTO. 게스트 제출 InquiryState가 아니다.
    CounselingStudentOption, // 메모 대상. 게스트 문의 보호자가 아니다.
    StaffCounselingMemo, // 목록 행. 수정·삭제는 없다.
    StaffInquiryItem, // 게스트 문의. 제출자 userId는 없다.
} from "@/features/counseling/types"; // 상담 DTO. inquiries/actions 폼 상태가 아니다.

/**
 * 상담 대상 학생·메모·문의 묶음.
 *
 * @param includeInquiries 직원 화면만 true. 교사는 문의 큐를 보지 않는다.
 * @param onlyOwnMemos 교사는 true(본인 작성). 직원은 false(스코프 안 전체).
 */
export async function getStaffCounselingData({ // 원장 director-data와 스코프를 나눈다.
    staffScope, // 교사·사무 범위. 원장은 이 함수를 안 탄다.
    includeInquiries, // 직원만 true. 교사는 문의 큐를 보지 않는다.
    onlyOwnMemos = false, // 교사는 true(본인 작성). 직원은 false.
}: { // page가 넣는다. 이 파일은 묶음만.
    staffScope: StaffScope; // 스코프. 원장 전 원생과 나눈다.
    includeInquiries: boolean; // 교사 page는 false.
    onlyOwnMemos: boolean; // 교사 true. 직원 false.
}): Promise<{ // 교사 문의 배열은 비어 있다.
    students: CounselingStudentOption[]; // ENROLLED만. 퇴원생 메모는 원장.
    memos: StaffCounselingMemo[]; // onlyOwnMemos면 본인 작성분.
    inquiries: StaffInquiryItem[]; // includeInquiries가 false면 [].
}> { // 직원 상담 묶음. 게스트 createInquiry와 나눈다.
    const [studentRecords, memoRecords, inquiryRecords] = await Promise.all([ // 세 쿼리 병렬.
        prisma.student.findMany({ // 상담 대상 선택. 게스트 문의 보호자가 아니다.
            where: { // 재원생만. 퇴원생 메모는 원장 액션.
                status: "ENROLLED", // 재원생만. 퇴원생 메모는 원장 액션.
                ...studentScopeWhere(staffScope), // 스코프 안. 원장 director-data는 스코프 없음.
            },
            orderBy: { name: "asc" }, // 이름순.
            take: 200, // 선택 목록 상한.
            select: { // 표시용. 쓰기 권한 판정이 아니다.
                id: true, // 원생 카드. 직원 메모는 ENROLLED만.
                name: true, // 상담 대상 이름.
                schoolName: true, // 온보딩 학교.
                grade: true, // 온보딩 학년.
                enrollments: { // take:1 표시용 현재 반·담임.
                    where: enrollmentScopeWhere(staffScope), // 스코프 안 수강.
                    take: 1, // 표시용 현재 반·담임. 쓰기 권한 판정은 아니다.
                    select: { // 반 이름·담임. 권한 키가 아니다.
                        class: { // 표시용. 성적 take:1 담임 판정과 다르다.
                            select: { // 이름·담임만.
                                name: true, // 반 이름.
                                teacher: { select: { name: true } }, // 그 반 담임.
                            },
                        },
                    },
                },
            },
        }),
        prisma.counselingMemo.findMany({ // 목록 행. 수정·삭제는 없다.
            where: { // 교사 본인 vs 직원 스코프 안 전체.
                ...(onlyOwnMemos ? { authorUserId: staffScope.userId } : {}), // 교사 화면은 본인 작성분. 직원은 스코프 안 전 메모.
                ...(staffScope.viewAllStudents // 전 원생 보면 student where를 안 붙인다.
                    ? {} // 전 원생 메모. 원장 director-data take:500과 상한이 다르다.
                    : { student: studentScopeWhere(staffScope) }), // 스코프 안 학생만.
            },
            orderBy: { counseledAt: "desc" }, // 상담 일시 우선.
            take: 50, // 최근 50. 원장 500과 다르다.
            select: { // 목록 행. 문의 DTO가 아니다.
                id: true, // 메모 행.
                content: true, // 본문 2~2000자.
                counseledAt: true, // ISO. 화면은 KST datetime.
                createdAt: true, // ISO 작성.
                student: { select: { id: true, name: true, grade: true } }, // 원생. 게스트 문의 보호자가 아니다.
                author: { select: { name: true } }, // 작성자 User. onlyOwnMemos는 본인만.
            },
        }),
        includeInquiries // 직원만 true. 교사는 문의 큐를 보지 않는다.
            ? prisma.inquiry.findMany({ // 게스트 문의. 제출자 userId는 없다.
                  where: { status: { in: ["NEW", "IN_PROGRESS"] } }, // DONE/SPAM은 큐에서 빼 진행 중만. 교사 page는 includeInquiries:false.
                  orderBy: { createdAt: "desc" }, // 최근 접수.
                  take: 30, // 큐 상한.
                  select: { // StaffInquiryItem. 원생 카드를 만들지 않는다.
                      id: true, // updateInquiryStatus의 inquiryId.
                      guardianName: true, // 게스트 폼 보호자. 제출자 userId는 없다.
                      phone: true, // 연락처.
                      studentGrade: true, // 선택 학년.
                      interestedSubject: true, // 선택 과목.
                      preferredTime: true, // 선택 희망 시간.
                      message: true, // 선택 본문.
                      status: true, // NEW/IN_PROGRESS만.
                      createdAt: true, // ISO 접수.
                      assignee: { select: { name: true } }, // 상태를 바꾼 사무. 별도 배정 UI는 없다.
                  },
              })
            : Promise.resolve([]), // 교사 상담은 문의 큐를 비운다. 직원만 true.
    ]);

    return { // 화면 묶음. Prisma 모델을 그대로 노출하지 않는다.
        students: studentRecords.map((student) => ({ // ENROLLED 선택 항목.
            id: student.id, // 원생 카드.
            name: student.name, // 상담 대상 이름.
            schoolName: student.schoolName, // 온보딩 학교.
            grade: student.grade, // 온보딩 학년.
            className: student.enrollments[0]?.class.name ?? null, // take:1 표시용.
            teacherName: student.enrollments[0]?.class.teacher?.name ?? null, // 그 반 담임.
        })),
        memos: memoRecords.map((memo) => ({ // 목록 행. 수정·삭제는 없다.
            id: memo.id, // 메모 행.
            content: memo.content, // 상담 본문.
            counseledAt: memo.counseledAt.toISOString(), // ISO. 화면은 KST datetime.
            createdAt: memo.createdAt.toISOString(), // ISO 작성.
            studentId: memo.student.id, // 원장 상세가 이 키로 다시 건다.
            studentName: memo.student.name, // 목록 이름.
            studentGrade: memo.student.grade, // 학년 표시.
            authorName: memo.author.name, // 작성자 User 이름.
        })),
        inquiries: inquiryRecords.map((inquiry) => ({ // 게스트 문의. userId 없음.
            id: inquiry.id, // updateInquiryStatus의 inquiryId.
            guardianName: inquiry.guardianName, // 게스트 문의. 제출자 userId는 없다.
            phone: inquiry.phone, // 연락처.
            studentGrade: inquiry.studentGrade, // 선택 학년.
            interestedSubject: inquiry.interestedSubject, // 선택 과목.
            preferredTime: inquiry.preferredTime, // 선택 희망 시간.
            message: inquiry.message, // 선택 본문.
            status: inquiry.status, // NEW/IN_PROGRESS만.
            createdAt: inquiry.createdAt.toISOString(), // ISO 접수.
            assigneeName: inquiry.assignee?.name ?? null, // 상태를 바꾼 사무. 별도 배정 UI는 없다.
        })),
    };
}
