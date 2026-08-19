"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 교사·직원 권한 키 토글 UI (클라이언트).
 *
 * `/director/permissions`. 저장: `saveMemberPermissions`.
 * 교사 billing 키는 서버가 다시 false로 막는다. 화면에서 켜도 청구 메뉴가 생기지 않는다.
 *
 * props: members — permissions data.
 */

import { useMemo, useState, useTransition } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import type { PermissionKey } from "@/types/roles"; // 타입만. 런타임 로직이 아니다.
import type { PermissionMember } from "@/features/permissions/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { presetForRole } from "@/lib/permissions"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { saveMemberPermissions } from "@/features/permissions/actions"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./PermissionManagementScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const permissionLabels: Record<PermissionKey, string> = { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    viewAllStudents: "전체 학생 조회", // viewAllStudents 필드.
    viewParentContact: "학부모 연락처 조회", // viewParentContact 필드.
    editLifeCounseling: "생활 상담 기록 수정", // editLifeCounseling 필드.
    writeAiReport: "AI 리포트 작성", // writeAiReport 필드.
    aiDirectSend: "AI 리포트 즉시 발송", // aiDirectSend 필드.
    ownClassAttendanceGrade: "담당반 출결/성적 입력", // ownClassAttendanceGrade 필드.
    otherTeacherAttendanceGrade: "타 선생님반 출결/성적 입력", // otherTeacherAttendanceGrade 필드.
    sendMessage: "쪽지 발송", // sendMessage 필드.
    billing: "결제/청구 관리", // billing 필드.
    linkParentStudent: "학부모-학생 연결", // linkParentStudent 필드.
}; // 블록 끝.

/** 멤버를 고르고 권한 체크박스를 저장한다. */
export default function PermissionManagementScreen({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    members: initialMembers, // members 필드.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    members: PermissionMember[]; // members 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const [isPending, startTransition] = useTransition(); // pending. 중복 제출을 막는다.
    const [members, setMembers] = useState(initialMembers); // 교사·직원 권한 토글. 교사 billing 키는 서버가 다시 false.
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>( // 교사·직원 한 명. 원장 본인은 목록에 없다.
        initialMembers[0]?.id ?? null, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.
    const [feedback, setFeedback] = useState<string | null>(null); // Action 결과 안내. JWT를 여기서 안 갱신한다.

    const selectedMember = useMemo( // 목록에서 고른 교사·직원.
        () => // 원장 Screen. layout requireRole DIRECTOR.
            members.find((m) => m.id === selectedMemberId) ?? // 원장 Screen. layout requireRole DIRECTOR.
            members[0] ?? // 원장 Screen. layout requireRole DIRECTOR.
            null, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        [members, selectedMemberId], // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.

    function togglePermission(key: PermissionKey) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!selectedMember) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        if (selectedMember.role === "TEACHER" && key === "billing") return; // 교사 billing은 UI에서도 못 켠다. 서버가 다시 false.
        setFeedback(null); // 이전 안내를 지운다.
        setMembers((prev) => // 원장 Screen. layout requireRole DIRECTOR.
            prev.map((member) => // 원장 Screen. layout requireRole DIRECTOR.
                member.id === selectedMember.id // 원장 Screen. layout requireRole DIRECTOR.
                    ? { // 구문. 원장 Screen. layout requireRole DIRECTOR.
                          ...member, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                          permissions: { // permissions 필드.
                              ...member.permissions, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                              [key]: !member.permissions[key], // 구문. 원장 Screen. layout requireRole DIRECTOR.
                          }, // 객체/호출 끝.
                      } // 블록 끝.
                    : member, // 구문. 원장 Screen. layout requireRole DIRECTOR.
            ), // 구문 끝.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    function applyPreset() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!selectedMember) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        setFeedback(null); // 이전 안내를 지운다.
        const preset = presetForRole(selectedMember.role); // 역할 기본값. 저장 전 로컬만.
        setMembers((prev) => // 원장 Screen. layout requireRole DIRECTOR.
            prev.map((member) => // 원장 Screen. layout requireRole DIRECTOR.
                member.id === selectedMember.id // 원장 Screen. layout requireRole DIRECTOR.
                    ? { ...member, permissions: preset } // 원장 Screen. layout requireRole DIRECTOR.
                    : member, // 구문. 원장 Screen. layout requireRole DIRECTOR.
            ), // 구문 끝.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    function handleSave() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!selectedMember) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        setFeedback(null); // 이전 안내를 지운다.

        startTransition(async () => { // 전환. 권한 키를 바꾸지 않는다.
            const result = await saveMemberPermissions({ // saveMemberPermissions. 교사 billing은 서버가 다시 false.
                userId: selectedMember.id, // userId 필드.
                permissions: selectedMember.permissions, // permissions 필드.
            }); // 객체/호출 끝.

            if (!result.ok) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
                setFeedback(result.message); // 원장 Screen. layout requireRole DIRECTOR.
                return; // 원장 Screen. layout requireRole DIRECTOR.
            } // 블록 끝.

            setFeedback(result.message ?? "저장 완료"); // 원장 Screen. layout requireRole DIRECTOR.
            router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // 교사·직원 권한 토글. 교사 billing 키는 서버가 다시 false.
        <section className={styles.page}>{/* 교사·직원 권한 토글. 교사 billing 키는 서버가 다시 false. */}
            <header className={styles.header}>{/* 프리셋·저장 */}
                <div>{/* 레이아웃 상자. */}
                    <span>PERMISSIONS</span>{/* 인라인 표시. */}
                    <h1>권한 설정</h1>{/* 제목. */}
                    <p>선생님와 직원에게 필요한 권한만 선택해 부여합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.headerActions}>{/* 레이아웃 상자. */}
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        className={styles.secondaryButton} // className 필드.
                        disabled={!selectedMember || isPending} // disabled 필드.
                        onClick={applyPreset} // onClick 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        역할 프리셋{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </button>{/* button 닫기. */}
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        disabled={!selectedMember || isPending} // disabled 필드.
                        onClick={handleSave} // onClick 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        {isPending ? "저장 중…" : "변경 저장"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </button>{/* button 닫기. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            {feedback ? <p className={styles.feedback}>{feedback}</p> : null}{/* 원장 Screen. layout requireRole DIRECTOR. */}

            {members.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <div className={styles.empty}>{/* 교사·직원 역할이 아직 없음 */}
                    <h2>선생님·직원이 없습니다</h2>{/* 소제목. */}
                    <p>{/* 문장. */}
                        가입 사용자에서 선생님 또는 직원 역할을 부여하면 여기에{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        표시됩니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </p>{/* p 닫기. */}
                </div> // div 닫기.
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <aside className={styles.members}>{/* 교사·직원 선택 */}
                        <h2>가입 사용자</h2>{/* 소제목. */}
                        <ul>{/* 목록. */}
                            {members.map((member) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                <li key={member.id}>{/* 항목. */}
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={ // 객체/블록 시작.
                                            member.id === selectedMember?.id // 원장 Screen. layout requireRole DIRECTOR.
                                                ? styles.activeMember // 원장 Screen. layout requireRole DIRECTOR.
                                                : undefined // 원장 Screen. layout requireRole DIRECTOR.
                                        } // 블록 끝.
                                        onClick={() => // onClick 필드.
                                            setSelectedMemberId(member.id) // 원장 Screen. layout requireRole DIRECTOR.
                                        } // 블록 끝.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        <span>{/* 인라인 표시. */}
                                            <strong>{member.name}</strong>{/* 강조. */}
                                            <em>{member.email}</em>{/* em. 원장 Screen. layout requireRole DIRECTOR. */}
                                        </span>{/* span 닫기. */}
                                        <small>{/* 보조 문장. */}
                                            {member.role === "TEACHER" // 원장 Screen. layout requireRole DIRECTOR.
                                                ? "선생님" // 원장 Screen. layout requireRole DIRECTOR.
                                                : "직원"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        </small>{/* small 닫기. */}
                                    </button>{/* button 닫기. */}
                                </li> // li 닫기.
                            ))}{/* 구문 끝. */}
                        </ul>{/* ul 닫기. */}
                    </aside>{/* aside 닫기. */}

                    {selectedMember ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <article className={styles.permissions}>{/* 권한 키 토글. 청구는 준비 중이라 켜도 메뉴가 안 생긴다. */}
                            <h2>{selectedMember.name} 권한</h2>{/* 소제목. */}
                            <ul>{/* 목록. */}
                                {( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    Object.keys( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        permissionLabels, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    ) as PermissionKey[] // 원장 Screen. layout requireRole DIRECTOR.
                                ).map((key) => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    const teacherBillingLocked = // 청구/결제는 준비 중. Toss 정산 없음.
                                        selectedMember.role === "TEACHER" && // 원장 Screen. layout requireRole DIRECTOR.
                                        key === "billing"; // 청구/결제는 준비 중. Toss 정산 없음.
                                    return ( // 교사·직원 권한 토글. 교사 billing 키는 서버가 다시 false.
                                        <li key={key}>{/* 항목. */}
                                            <label>{/* 필드 라벨. */}
                                                <span>{/* 인라인 표시. */}
                                                    {permissionLabels[key]}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                                    {teacherBillingLocked // 청구/결제는 준비 중. Toss 정산 없음.
                                                        ? " (선생님 불가)" // 원장 Screen. layout requireRole DIRECTOR.
                                                        : ""}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                                </span>{/* span 닫기. */}
                                                <input // 입력. 서버에서 다시 검증한다.
                                                    type="checkbox" // type 필드.
                                                    checked={ // 객체/블록 시작.
                                                        selectedMember // 원장 Screen. layout requireRole DIRECTOR.
                                                            .permissions[key] // 원장 Screen. layout requireRole DIRECTOR.
                                                    } // 블록 끝.
                                                    disabled={ // 객체/블록 시작.
                                                        teacherBillingLocked || // 청구/결제는 준비 중. Toss 정산 없음.
                                                        isPending // 원장 Screen. layout requireRole DIRECTOR.
                                                    } // 블록 끝.
                                                    onChange={() => // onChange 필드.
                                                        togglePermission(key) // 원장 Screen. layout requireRole DIRECTOR.
                                                    } // 블록 끝.
                                                />{/* 구문 끝. */}
                                            </label>{/* label 닫기. */}
                                        </li> // li 닫기.
                                    ); // 호출/그룹 끝.
                                })}{/* 구문 끝. */}
                            </ul>{/* ul 닫기. */}
                        </article> // article 닫기.
                    ) : null}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
