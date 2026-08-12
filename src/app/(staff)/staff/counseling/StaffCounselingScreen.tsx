"use client";

import { useState } from "react";
import type { CounselingStudentOption, StaffCounselingMemo, StaffInquiryItem } from "@/features/counseling/types";
import CounselingMemoPanel from "./components/CounselingMemoPanel";
import InquiryManagementPanel from "./components/InquiryManagementPanel";
import styles from "./StaffCounselingScreen.module.css";

export default function StaffCounselingScreen({ role, students, memos, inquiries }: { role: "TEACHER" | "STAFF"; students: CounselingStudentOption[]; memos: StaffCounselingMemo[]; inquiries: StaffInquiryItem[] }) {
    const [activeTab, setActiveTab] = useState<"memos" | "inquiries">(role === "STAFF" && inquiries.length > 0 ? "inquiries" : "memos");
    return (
        <section className={styles.page}>
            <header className={styles.heading}><div><span>COUNSELING</span><h1>상담 관리</h1><p>학부모 상담 요청과 진행 기록을 관리합니다.</p></div></header>
            <div className={styles.filters}>
                <button type="button" className={activeTab === "memos" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("memos")}>상담 기록</button>
                {role === "STAFF" && <button type="button" className={activeTab === "inquiries" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("inquiries")}>상담 문의{inquiries.length > 0 ? ` (${inquiries.length})` : ""}</button>}
            </div>
            {activeTab === "memos" ? <CounselingMemoPanel students={students} memos={memos} /> : role === "STAFF" ? <InquiryManagementPanel inquiries={inquiries} /> : null}
        </section>
    );
}
