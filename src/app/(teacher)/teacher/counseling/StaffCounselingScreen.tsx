"use client";

/**
 * 상담 관리 UI (클라이언트).
 *
 * `/teacher/counseling`과 `/employee/counseling`이 같이 쓴다.
 * 교사: 문의 탭 비움, 본인 메모. 직원: 게스트 문의 포함.
 * 배정된 이탈 케어는 `ChurnCarePanel`로 상단에 올린다.
 *
 * Server Action 제출은 패널 자식이 한다. 이 파일은 탭만.
 */

import { useState } from "react";
import type {
    CounselingStudentOption,
    StaffCounselingMemo,
    StaffInquiryItem,
} from "@/features/counseling/types";
import CounselingMemoPanel from "./components/CounselingMemoPanel";
import ChurnCarePanel from "./components/ChurnCarePanel";
import InquiryManagementPanel from "./components/InquiryManagementPanel";
import type { TeacherChurnCareTask } from "@/features/churn/types";
import styles from "./StaffCounselingScreen.module.css";

export default function StaffCounselingScreen({
    role,
    students,
    memos,
    inquiries,
    churnTasks = [],
}: {
    role: "TEACHER" | "STAFF";
    students: CounselingStudentOption[];
    memos: StaffCounselingMemo[];
    inquiries: StaffInquiryItem[];
    churnTasks?: TeacherChurnCareTask[];
}) {
    const [activeTab, setActiveTab] = useState<"memos" | "inquiries">(
        role === "STAFF" && inquiries.length > 0 ? "inquiries" : "memos",
    );
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>COUNSELING</span>
                    <h1>상담 관리</h1>
                    <p>이탈 케어와 상담 기록을 관리합니다.</p>
                </div>
            </header>
            {churnTasks.length > 0 ? (
                <div className={styles.careTop}>
                    <ChurnCarePanel tasks={churnTasks} />
                </div>
            ) : null}
            <div className={styles.filters}>
                <button
                    type="button"
                    className={
                        activeTab === "memos"
                            ? styles.filterActive
                            : styles.filterBtn
                    }
                    onClick={() => setActiveTab("memos")}
                >
                    상담 기록
                </button>
                {role === "STAFF" && (
                    <button
                        type="button"
                        className={
                            activeTab === "inquiries"
                                ? styles.filterActive
                                : styles.filterBtn
                        }
                        onClick={() => setActiveTab("inquiries")}
                    >
                        상담 문의
                        {inquiries.length > 0 ? ` (${inquiries.length})` : ""}
                    </button>
                )}
            </div>
            {activeTab === "memos" ? (
                <CounselingMemoPanel students={students} memos={memos} />
            ) : role === "STAFF" ? (
                <InquiryManagementPanel inquiries={inquiries} />
            ) : null}
        </section>
    );
}
