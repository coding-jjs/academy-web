"use client";

import { useMemo, useState } from "react";
import type { PermissionKey } from "@/types/roles";
import {
    staffPermissionPreset,
    teacherPermissionPreset,
} from "@/lib/permissions";
import styles from "./PermissionManagementScreen.module.css";

type MemberRole = "TEACHER" | "STAFF";

type Member = {
    id: string;
    name: string;
    role: MemberRole;
    permissions: Record<PermissionKey, boolean>;
};

const permissionLabels: Record<PermissionKey, string> = {
    viewAllStudents: "전체 학생 조회",
    viewParentContact: "학부모 연락처 조회",
    editLifeCounseling: "생활 상담 기록 수정",
    writeAiReport: "AI 리포트 작성",
    aiDirectSend: "AI 리포트 즉시 발송",
    ownClassAttendanceGrade: "담당반 출결/성적 입력",
    otherTeacherAttendanceGrade: "타 교사반 출결/성적 입력",
    sendMessage: "쪽지 발송",
    billing: "결제/청구 관리",
    linkParentStudent: "학부모-학생 연결",
};

const initialMembers: Member[] = [
    {
        id: "teacher-kim",
        name: "김민재",
        role: "TEACHER",
        permissions: { ...teacherPermissionPreset },
    },
    {
        id: "staff-lee",
        name: "이수현",
        role: "STAFF",
        permissions: { ...staffPermissionPreset },
    },
];

export default function PermissionManagementScreen() {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [selectedMemberId, setSelectedMemberId] = useState<string>(
        initialMembers[0].id,
    );

    const selectedMember = useMemo(
        () =>
            members.find((member) => member.id === selectedMemberId) ??
            members[0],
        [members, selectedMemberId],
    );

    function togglePermission(key: PermissionKey) {
        if (!selectedMember) return;

        setMembers((previous) =>
            previous.map((member) =>
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

    if (!selectedMember) return null;

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span>PERMISSIONS</span>
                    <h1>권한 설정</h1>
                    <p>교사와 직원에게 필요한 권한만 선택해 부여합니다.</p>
                </div>
                <button type="button">변경 저장</button>
            </header>

            <div className={styles.layout}>
                <aside className={styles.members}>
                    <h2>가입 사용자</h2>
                    <ul>
                        {members.map((member) => (
                            <li key={member.id}>
                                <button
                                    type="button"
                                    className={
                                        member.id === selectedMember.id
                                            ? styles.activeMember
                                            : undefined
                                    }
                                    onClick={() =>
                                        setSelectedMemberId(member.id)
                                    }
                                >
                                    <strong>{member.name}</strong>
                                    <small>
                                        {member.role === "TEACHER"
                                            ? "교사"
                                            : "직원"}
                                    </small>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <article className={styles.permissions}>
                    <h2>{selectedMember.name} 권한</h2>
                    <ul>
                        {(Object.keys(permissionLabels) as PermissionKey[]).map(
                            (key) => (
                                <li key={key}>
                                    <label>
                                        <span>{permissionLabels[key]}</span>
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedMember.permissions[key]
                                            }
                                            onChange={() =>
                                                togglePermission(key)
                                            }
                                        />
                                    </label>
                                </li>
                            ),
                        )}
                    </ul>
                </article>
            </div>
        </section>
    );
}
