"use server"; // 원장 쓰기. 후보·활성 링크 읽기는 director-data.

/**
 * 원장만 학부모-원생 ParentStudentLink를 연결하거나 해제한다.
 *
 * 호출:
 * - 연결: `(director)/director/parents/ParentStudentLinkForm.tsx`
 * - 해제: `(director)/director/parents/UnlinkParentStudentButton.tsx`
 *
 * 학부모가 임의로 자녀를 추가하지 못하게 하고,
 * 해제는 행 삭제가 아니라 `endedAt`을 남겨 이력을 보존한다.
 * 마지막 활성 링크가 끊긴 학부모는 PARENT에서 GUEST로 되돌린다.
 *
 * 의도적으로 하지 않는 일:
 * - 한 학생에 활성 링크를 두 개 두지 않는다.
 * - 휴원/퇴원 학생·미온보딩 학부모는 연결하지 않는다.
 *
 * 관련: `features/families/director-data.ts`, `lib/audit.ts`.
 */

import { revalidatePath } from "next/cache"; // parents/students. parentCount·후보 목록이 바뀐다.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // LINKED/UNLINKED. 트랜잭션 안.
import { auth } from "@/lib/auth"; // JWT. 학부모 자가 연결은 없다.
import { prisma } from "@/lib/db"; // 링크 create·endedAt. 마지막 해제는 role=GUEST.

/**
 * `useActionState`가 주고받는 연결/해제 UI 상태.
 * idle은 초기값용이며 이 파일의 성공·실패 반환에는 쓰지 않는다.
 */
export type ParentLinkState = { // Screen이 배너로 그린다. redirect 없음.
    status: "idle" | "success" | "error"; // idle은 초기값만. 이 액션은 success/error.
    message: string; // 필드 에러 맵이 아니다. 한 문장.
};

const allowedRelationships = new Set([ // 폼 자유 입력 거절. 화면 select와 집합을 맞춘다.
    "어머니", // select 옵션. 임의 문구는 has()가 거절.
    "아버지", // select 옵션.
    "조부모", // select 옵션.
    "기타 보호자", // select 옵션.
]);

const allowedEndReasons = new Set([ // 해제 이력 endReason. 임의 문구는 거절.
    "잘못된 연결", // 해제 사유. 행 삭제가 아니라 endedAt에 남긴다.
    "보호자 변경", // 해제 사유.
    "원장 수동 해제", // 해제 사유.
]);

async function requireDirector() { // throw 대신 null. 호출 측이 error 상태를 만든다.
    const session = await auth(); // JWT. 원장이 아니면 null — 연결/해제가 throw가 아니라 error 상태.
    if (!session?.user || session.user.role !== "DIRECTOR") { // 학부모가 이 액션을 쳐도 링크를 만들지 않는다.
        return null; // Screen이 권한 메시지를 그린다.
    }
    return session; // linkedBy/endedBy·감사 actor.
}

/**
 * 활성 ParentStudentLink를 하나 만든다. 학생당 활성 링크는 최대 1개.
 *
 * @param _previousState useActionState 직전 상태. 서버는 폼만 본다.
 * @param formData `parentUserId`, `studentId`, `relationship`(허용 집합만).
 * @returns 성공/실패 메시지. redirect하지 않는다.
 * @auth DIRECTOR. 아니면 error.
 * @sideEffects 링크 create, PARENT_STUDENT_LINKED 감사 로그, parents/students revalidate.
 */
export async function linkParentStudent( // 학부모 자가 연결이 아니다. 학생당 활성 1개.
    _previousState: ParentLinkState, // 직전 UI. 서버는 재사용하지 않고 formData만 본다.
    formData: FormData, // parentUserId/studentId/relationship.
): Promise<ParentLinkState> { // redirect 없음. Screen이 message를 그린다.
    const session = await requireDirector(); // layout 밖 직접 호출도 여기서 막는다.

    if (!session) { // 학부모·교사가 이 액션을 쳐도 링크를 만들지 않는다.
        return { // throw가 아니라 error 상태.
            status: "error", // 필드 하이라이트가 아니라 권한 메시지.
            message: "학부모와 학생을 연결할 권한이 없습니다.", // DIRECTOR만.
        };
    }

    const parentUserId = formData.get("parentUserId"); // PARENT User.id. GUEST로 떨어진 계정은 where가 거절.
    const studentId = formData.get("studentId"); // 재원 Student.id. 휴원/퇴원은 거절.
    const relationship = formData.get("relationship"); // 허용 집합 밖이면 거절.

    if (typeof parentUserId !== "string" || !parentUserId) { // select가 비면 Prisma를 치지 않는다.
        return { status: "error", message: "학부모를 선택해 주세요." }; // 후보 목록은 director-data가 PARENT만 채운다.
    }

    if (typeof studentId !== "string" || !studentId) { // 이미 활성 링크가 있는 원생은 data가 후보에서 뺀다.
        return { status: "error", message: "학생을 선택해 주세요." }; // 휴원/퇴원 후보는 data가 안 올린다.
    }

    if ( // 폼 자유 입력 거절.
        typeof relationship !== "string" || // 문자열이 아니면 거절.
        !allowedRelationships.has(relationship) // 화면 select와 집합을 맞춘다.
    ) { // 임의 관계 문구는 이력에 남기지 않는다.
        return { // 연결을 만들지 않는다.
            status: "error", // 필드 맵이 아니라 한 문장.
            message: "학생과의 관계를 다시 선택해 주세요.", // 허용 집합 밖.
        };
    }

    try { // unique/이미 링크는 throw 메시지를 UI로.
        const metadata = await getAuditRequestMetadata(); // IP·UA.
        await prisma.$transaction(async (tx) => { // 부모·학생·기존 링크를 한 트랜잭션에서 본다.
            const [parent, student, activeLink] = await Promise.all([ // 세 조건이 모두 통과해야 create.
                tx.user.findFirst({ // GUEST·교사 계정에는 자녀 링크를 만들지 않는다.
                    where: { // 마지막 해제로 GUEST가 된 계정은 후보에서 빠진다.
                        id: parentUserId, // 폼이 고른 User.
                        role: "PARENT", // GUEST·교사 계정에는 자녀 링크를 만들지 않는다.
                        status: "ACTIVE", // BLOCKED는 연결하지 않는다.
                        onboardingCompleteAt: { not: null }, // 가입 폼이 끝나야 이름·이메일이 믿을 만하다.
                    },
                    select: { id: true }, // create에 넣을 id만.
                }),
                tx.student.findFirst({ // 휴원/퇴원에는 새 보호자를 붙이지 않는다.
                    where: { // Google이 붙은 재원 원생만. userId:null 카드는 연결 후보가 아니다.
                        id: studentId, // 폼이 고른 카드.
                        status: "ENROLLED", // 휴원/퇴원에는 새 보호자를 붙이지 않는다.
                        user: { // STUDENT 역할 부여가 끝난 계정만.
                            is: { // userId:null 카드는 여기 안 걸린다.
                                role: "STUDENT", // 대기 GUEST가 붙은 카드가 아니다.
                                status: "ACTIVE", // BLOCKED User는 거절.
                            },
                        },
                    },
                    select: { id: true }, // create에 넣을 id만.
                }),
                tx.parentStudentLink.findFirst({ // 학생당 활성 보호자 1명.
                    where: { // 해제 이력(endedAt)은 활성으로 보지 않는다.
                        studentId, // 이 원생의 활성 링크.
                        endedAt: null, // 학생당 활성 보호자 1명.
                    },
                    select: { id: true }, // 존재 여부만.
                }),
            ]);

            if (!parent) { // 역할이 PARENT가 아니거나 미온보딩.
                throw new Error("연결할 수 없는 학부모 계정입니다."); // GUEST로 떨어진 계정 포함.
            }

            if (!student) { // 휴원/퇴원·미연결 카드.
                throw new Error("연결할 수 없는 학생 계정입니다."); // ENROLLED+STUDENT+ACTIVE만.
            }

            if (activeLink) { // 이미 활성 보호자가 있으면 두 번째를 만들지 않는다.
                throw new Error("이미 학부모가 연결된 학생입니다."); // 해제는 unlink가 endedAt을 찍은 뒤.
            }

            const link = await tx.parentStudentLink.create({ // 행 삭제 이력 모델. 지금은 endedAt null.
                data: { // 학부모가 자가 연결하지 않음.
                    parentUserId: parent.id, // PARENT User.
                    studentId: student.id, // 재원 원생.
                    relationship, // 허용 집합 값.
                    linkedBy: session.user.id, // 원장 User.id. 학부모가 자가 연결하지 않음.
                },
                select: { id: true }, // 감사 targetId.
            });

            await writeAuditLog(tx, { // PARENT_STUDENT_LINKED.
                actorUserId: session.user.id, // 원장.
                action: "PARENT_STUDENT_LINKED", // 해제와 다른 액션.
                targetType: "PARENT_STUDENT_LINK", // User가 아니라 링크 행.
                targetId: link.id, // 방금 만든 링크.
                details: { // 관계까지 남겨 이력 화면이 없어도 감사가 남는다.
                    parentUserId: parent.id, // 연결된 학부모.
                    studentId: student.id, // 연결된 원생.
                    relationship, // 허용 집합 값.
                },
                metadata, // IP·UA.
            });
        });

        revalidatePath("/director/parents"); // 활성 링크 목록.
        revalidatePath("/director/students"); // parentCount·parentNames.

        return { // redirect 없음.
            status: "success", // Screen 배너.
            message: "학부모와 학생을 연결했습니다.", // 후보에서 그 학생이 빠진다.
        };
    } catch (error) { // unique/연결 오류는 UI에 트랜잭션 메시지.
        console.error("학부모-학생 연결 실패", error); // unique/연결 오류는 UI에 트랜잭션 메시지.

        return { // 부분 저장 없음. 트랜잭션이 롤백됐다.
            status: "error", // Screen 배너.
            message: // throw Error면 그 문장. 그 외 범용.
                error instanceof Error // 가드 throw를 그대로 보여 준다.
                    ? error.message // "이미 학부모가 연결된 학생입니다" 등.
                    : "연결 처리 중 오류가 발생했습니다.", // 스키마 오류는 노출하지 않는다.
        };
    }
}

/**
 * 활성 링크에 endedAt을 찍는다. 행을 삭제하지 않아 연결 이력을 남긴다.
 *
 * 마지막 활성 링크가 없으면 해당 User.role을 PARENT → GUEST로 내린다.
 * 학부모 화면이 자녀 없이 PARENT로 남는 것을 막기 위함이다.
 *
 * @param _previousState useActionState 직전 상태.
 * @param formData `linkId`, `reason`(허용 해제 사유만).
 * @returns 성공/실패 메시지.
 * @auth DIRECTOR.
 * @sideEffects endedAt/endedBy/endReason, 조건적 role=GUEST, UNLINKED 감사 로그.
 */
export async function unlinkParentStudent( // 행 삭제가 아니다. 마지막이면 PARENT→GUEST.
    _previousState: ParentLinkState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // linkId/reason.
): Promise<ParentLinkState> { // redirect 없음.
    const session = await requireDirector(); // 학부모 자가 해제가 아니다.

    if (!session) { // 교사가 이 액션을 쳐도 endedAt을 찍지 않는다.
        return { // throw가 아니라 error 상태.
            status: "error", // 권한 메시지.
            message: "연결을 해제할 권한이 없습니다.", // DIRECTOR만.
        };
    }

    const linkId = formData.get("linkId"); // 활성 ParentStudentLink.id. 이미 endedAt이면 거절.
    const reason = formData.get("reason"); // 허용 해제 사유만.

    if (typeof linkId !== "string" || !linkId) { // hidden이 비면 Prisma를 치지 않는다.
        return { // 이력 덮어쓰기가 아니다.
            status: "error", // 한 문장.
            message: "연결 정보가 올바르지 않습니다.", // 없는 linkId.
        };
    }

    if (typeof reason !== "string" || !allowedEndReasons.has(reason)) { // 임의 문구는 endReason에 안 남긴다.
        return { // 해제를 하지 않는다.
            status: "error", // 사유 select와 집합을 맞춘다.
            message: "연결 해제 사유를 선택해 주세요.", // 허용 집합 밖.
        };
    }

    try { // 이미 해제된 행은 throw.
        const metadata = await getAuditRequestMetadata(); // IP·UA.
        await prisma.$transaction(async (tx) => { // endedAt과 조건부 GUEST를 한 트랜잭션.
            const link = await tx.parentStudentLink.findFirst({ // 이미 해제된 행은 거절. 이력 덮어쓰기를 막는다.
                where: { // endedAt이 있는 과거 링크는 이 화면 버튼이 안 나온다.
                    id: linkId, // Unlink 버튼의 linkId.
                    endedAt: null, // 이미 해제된 행은 거절. 이력 덮어쓰기를 막는다.
                },
                select: { // 남은 링크 카운트·감사 details에 쓴다.
                    id: true, // update where.
                    parentUserId: true, // 마지막이면 이 User를 GUEST로.
                    studentId: true, // 감사 details.
                },
            });

            if (!link) { // 이미 해제됐거나 없는 id.
                throw new Error("이미 해제됐거나 존재하지 않는 연결입니다."); // 행 삭제가 아니라 endedAt 중복을 막는다.
            }

            await tx.parentStudentLink.update({ // 행 삭제 금지. 연결 이력을 남긴다.
                where: { id: link.id }, // 방금 찾은 활성 행.
                data: { // 삭제 대신 종료 컬럼.
                    endedAt: new Date(), // 행 삭제 금지. 연결 이력을 남긴다.
                    endedBy: session.user.id, // 원장. 학부모 자가 해제 아님.
                    endReason: reason, // 허용 집합 값.
                },
            });

            const remainingParentLinks = await tx.parentStudentLink.count({ // 다른 자녀가 남아 있으면 PARENT 유지.
                where: { // 방금 끊은 행은 endedAt이 있어 안 센다.
                    parentUserId: link.parentUserId, // 같은 학부모.
                    endedAt: null, // 아직 살아있는 자녀 링크.
                },
            });

            if (remainingParentLinks === 0) { // 마지막 자녀가 없으면 PARENT로 남지 않게.
                await tx.user.updateMany({ // 역할만. 온보딩 프로필은 남긴다.
                    where: { // 이미 GUEST면 0건. 교사 계정을 내리지 않는다.
                        id: link.parentUserId, // 링크의 학부모.
                        role: "PARENT", // PARENT만. TEACHER를 건드리지 않는다.
                    },
                    data: { role: "GUEST" }, // 마지막 자녀가 없으면 PARENT로 남지 않게. 학부모 홈 접근을 끊는다.
                });
            }

            await writeAuditLog(tx, { // PARENT_STUDENT_UNLINKED.
                actorUserId: session.user.id, // 원장.
                action: "PARENT_STUDENT_UNLINKED", // 연결과 다른 액션.
                targetType: "PARENT_STUDENT_LINK", // 링크 행. User가 아니다.
                targetId: link.id, // endedAt을 찍은 행.
                details: { // 사유·양쪽 id.
                    parentUserId: link.parentUserId, // GUEST로 내렸을 수도 있다.
                    studentId: link.studentId, // 끊긴 원생.
                    reason, // 허용 해제 사유.
                },
                metadata, // IP·UA.
            });
        });

        revalidatePath("/director/parents"); // 활성 목록에서 빠짐. GUEST는 후보에서 사라진다.
        revalidatePath("/director/students"); // parentCount.

        return { // redirect 없음.
            status: "success", // Screen 배너.
            message: "학부모와 학생의 연결을 해제했습니다.", // 마지막이면 역할도 GUEST.
        };
    } catch (error) { // 이미 해제된 행 등.
        console.error("학부모-학생 연결 해제 실패", error); // 내부만. PII를 넓게 남기지 않는다.

        return { // 부분 저장 없음.
            status: "error", // Screen 배너.
            message: // throw Error면 그 문장.
                error instanceof Error // 가드 throw.
                    ? error.message // "이미 해제됐거나…"
                    : "연결 해제 중 오류가 발생했습니다.", // 범용.
        };
    }
}
