"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PermissionKey } from "@/types/roles";
import type { PermissionMember } from "@/features/permissions/types";
import { presetForRole } from "@/lib/permissions";
import { saveMemberPermissions } from "@/features/permissions/actions";
import styles from "./PermissionManagementScreen.module.css";

const permissionLabels: Record<PermissionKey, string> = {
    viewAllStudents: "전체 학생 조회",
    viewParentContact: "학부모 연락처 조회",
    editLifeCounseling: "생활 상담 기록 수정",
    writeAiReport: "AI 리포트 작성",
    aiDirectSend: "AI 리포트 즉시 발송",
    ownClassAttendanceGrade: "담당반 출결/성적 입력",
    otherTeacherAttendanceGrade: "타 선생님반 출결/성적 입력",
    sendMessage: "쪽지 발송",
    billing: "결제/청구 관리",
    linkParentStudent: "학부모-학생 연결",
};

export default function PermissionManagementScreen({
    members: initialMembers,
}: {
    members: PermissionMember[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [members, setMembers] = useState(initialMembers);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
        initialMembers[0]?.id ?? null,
    );
    const [feedback, setFeedback] = useState<string | null>(null);

    const selectedMember = useMemo(
        () =>
            members.find((m) => m.id === selectedMemberId) ??
            members[0] ??
            null,
        [members, selectedMemberId],
    );

    function togglePermission(key: PermissionKey) {
        if (!selectedMember) return;
        if (selectedMember.role === "TEACHER" && key === "billing") return;
        setFeedback(null);
        setMembers((prev) =>
            prev.map((member) =>
                member.id === selectedMember.id
                    ? {
                          ...member,
                          permissions: {
                              ...member.permissions,
                              [key]: !member.permissions[key],
                          },
                      }
                    : member,
            ),
        );
    }

    function applyPreset() {
        if (!selectedMember) return;
        setFeedback(null);
        const preset = presetForRole(selectedMember.role);
        setMembers((prev) =>
            prev.map((member) =>
                member.id === selectedMember.id
                    ? { ...member, permissions: preset }
                    : member,
            ),
        );
    }

    function handleSave() {
        if (!selectedMember) return;
        setFeedback(null);

        startTransition(async () => {
            const result = await saveMemberPermissions({
                userId: selectedMember.id,
                permissions: selectedMember.permissions,
            });

            if (!result.ok) {
                setFeedback(result.message);
                return;
            }

            setFeedback(result.message ?? "저장 완료");
            router.refresh();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span>PERMISSIONS</span>
                    <h1>권한 설정</h1>
                    <p>선생님와 직원에게 필요한 권한만 선택해 부여합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={!selectedMember || isPending}
                        onClick={applyPreset}
                    >
                        역할 프리셋
                    </button>
                    <button
                        type="button"
                        disabled={!selectedMember || isPending}
                        onClick={handleSave}
                    >
                        {isPending ? "저장 중…" : "변경 저장"}
                    </button>
                </div>
            </header>

            {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

            {members.length === 0 ? (
                <div className={styles.empty}>
                    <h2>선생님·직원이 없습니다</h2>
                    <p>
                        가입 사용자에서 선생님 또는 직원 역할을 부여하면 여기에
                        표시됩니다.
                    </p>
                </div>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.members}>
                        <h2>가입 사용자</h2>
                        <ul>
                            {members.map((member) => (
                                <li key={member.id}>
                                    <button
                                        type="button"
                                        className={
                                            member.id === selectedMember?.id
                                                ? styles.activeMember
                                                : undefined
                                        }
                                        onClick={() =>
                                            setSelectedMemberId(member.id)
                                        }
                                    >
                                        <span>
                                            <strong>{member.name}</strong>
                                            <em>{member.email}</em>
                                        </span>
                                        <small>
                                            {member.role === "TEACHER"
                                                ? "선생님"
                                                : "직원"}
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {selectedMember ? (
                        <article className={styles.permissions}>
                            <h2>{selectedMember.name} 권한</h2>
                            <ul>
                                {(
                                    Object.keys(
                                        permissionLabels,
                                    ) as PermissionKey[]
                                ).map((key) => {
                                    const teacherBillingLocked =
                                        selectedMember.role === "TEACHER" &&
                                        key === "billing";
                                    return (
                                        <li key={key}>
                                            <label>
                                                <span>
                                                    {permissionLabels[key]}
                                                    {teacherBillingLocked
                                                        ? " (선생님 불가)"
                                                        : ""}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedMember
                                                            .permissions[key]
                                                    }
                                                    disabled={
                                                        teacherBillingLocked ||
                                                        isPending
                                                    }
                                                    onChange={() =>
                                                        togglePermission(key)
                                                    }
                                                />
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </article>
                    ) : null}
                </div>
            )}
        </section>
    );
}
