"use client";

import { useActionState, useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    createCounselingMemo,
    updateInquiryStatus,
    type CounselingActionState,
} from "./actions";
import styles from "./StaffCounselingScreen.module.css";

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "DONE" | "SPAM";

export type CounselingStudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
};

export type StaffCounselingMemo = {
    id: string;
    content: string;
    counseledAt: string;
    createdAt: string;
    studentId: string;
    studentName: string;
    studentGrade: string | null;
    authorName: string;
};

export type StaffInquiryItem = {
    id: string;
    guardianName: string;
    phone: string;
    studentGrade: string | null;
    interestedSubject: string | null;
    preferredTime: string | null;
    message: string | null;
    status: InquiryStatus;
    createdAt: string;
    assigneeName: string | null;
};

const initialState: CounselingActionState = {
    status: "idle",
    message: "",
};

const inquiryStatusMeta: Record<
    InquiryStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    NEW: { label: "신규", tone: "warning" },
    IN_PROGRESS: { label: "진행중", tone: "neutral" },
    DONE: { label: "완료", tone: "success" },
    SPAM: { label: "스팸", tone: "danger" },
};

function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

function toLocalInputValue(date = new Date()) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function StaffCounselingScreen({
    role,
    students,
    memos,
    inquiries,
}: {
    role: "TEACHER" | "STAFF";
    students: CounselingStudentOption[];
    memos: StaffCounselingMemo[];
    inquiries: StaffInquiryItem[];
}) {
    const [tab, setTab] = useState<"memos" | "inquiries">(
        role === "STAFF" && inquiries.length > 0 ? "inquiries" : "memos",
    );
    const [memoState, memoAction, memoPending] = useActionState(
        createCounselingMemo,
        initialState,
    );
    const [inquiryState, inquiryAction, inquiryPending] = useActionState(
        updateInquiryStatus,
        initialState,
    );

    const sortedMemos = useMemo(() => memos, [memos]);

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>COUNSELING</span>
                    <h1>상담 관리</h1>
                    <p>학부모 상담 요청과 진행 기록을 관리합니다.</p>
                </div>
            </header>

            <div className={styles.filters}>
                <button
                    type="button"
                    className={
                        tab === "memos" ? styles.filterActive : styles.filterBtn
                    }
                    onClick={() => setTab("memos")}
                >
                    상담 기록
                </button>
                {role === "STAFF" && (
                    <button
                        type="button"
                        className={
                            tab === "inquiries"
                                ? styles.filterActive
                                : styles.filterBtn
                        }
                        onClick={() => setTab("inquiries")}
                    >
                        상담 문의
                        {inquiries.length > 0 ? ` (${inquiries.length})` : ""}
                    </button>
                )}
            </div>

            {tab === "memos" && (
                <div className={styles.layout}>
                    <article className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>상담 등록</h2>
                        </div>

                        {students.length === 0 ? (
                            <p className={styles.muted}>
                                등록 가능한 담당 학생이 없습니다.
                            </p>
                        ) : (
                            <form action={memoAction} className={styles.form}>
                                <label className={styles.field}>
                                    <span>학생</span>
                                    <select name="studentId" required defaultValue="">
                                        <option value="" disabled>
                                            선택
                                        </option>
                                        {students.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                                {s.className
                                                    ? ` · ${s.className}`
                                                    : ""}
                                                {s.grade ? ` · ${s.grade}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className={styles.field}>
                                    <span>상담 일시</span>
                                    <input
                                        type="datetime-local"
                                        name="counseledAt"
                                        defaultValue={toLocalInputValue()}
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>상담 내용</span>
                                    <textarea
                                        name="content"
                                        rows={6}
                                        required
                                        maxLength={2000}
                                        placeholder="상담 요청 내용, 진행 상황, 후속 조치를 적어 주세요."
                                    />
                                </label>

                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={memoPending}
                                >
                                    {memoPending ? "등록 중…" : "상담 등록"}
                                </button>

                                {memoState.message && (
                                    <p
                                        className={
                                            memoState.status === "success"
                                                ? styles.success
                                                : styles.error
                                        }
                                        role="alert"
                                    >
                                        {memoState.message}
                                    </p>
                                )}
                            </form>
                        )}
                    </article>

                    <article className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>최근 상담</h2>
                            <StatusChip>{sortedMemos.length}건</StatusChip>
                        </div>

                        {sortedMemos.length === 0 ? (
                            <p className={styles.muted}>
                                등록된 상담 기록이 없습니다.
                            </p>
                        ) : (
                            <ul className={styles.list}>
                                {sortedMemos.map((memo) => (
                                    <li key={memo.id}>
                                        <div className={styles.itemTop}>
                                            <strong>{memo.studentName}</strong>
                                            <span>
                                                {formatDateTime(memo.counseledAt)}
                                            </span>
                                        </div>
                                        <p>{memo.content}</p>
                                        <small>
                                            {memo.authorName}
                                            {memo.studentGrade
                                                ? ` · ${memo.studentGrade}`
                                                : ""}
                                        </small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </div>
            )}

            {tab === "inquiries" && role === "STAFF" && (
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>게스트 상담 문의</h2>
                        <StatusChip tone="warning">
                            {inquiries.length}건
                        </StatusChip>
                    </div>

                    {inquiryState.message && (
                        <p
                            className={
                                inquiryState.status === "success"
                                    ? styles.success
                                    : styles.error
                            }
                            role="alert"
                        >
                            {inquiryState.message}
                        </p>
                    )}

                    {inquiries.length === 0 ? (
                        <p className={styles.muted}>처리할 문의가 없습니다.</p>
                    ) : (
                        <ul className={styles.inquiryList}>
                            {inquiries.map((item) => (
                                <li key={item.id}>
                                    <div className={styles.itemTop}>
                                        <strong>{item.guardianName}</strong>
                                        <StatusChip
                                            tone={
                                                inquiryStatusMeta[item.status]
                                                    .tone
                                            }
                                        >
                                            {
                                                inquiryStatusMeta[item.status]
                                                    .label
                                            }
                                        </StatusChip>
                                    </div>
                                    <p>
                                        {item.phone}
                                        {item.studentGrade
                                            ? ` · ${item.studentGrade}`
                                            : ""}
                                        {item.interestedSubject
                                            ? ` · ${item.interestedSubject}`
                                            : ""}
                                    </p>
                                    {item.message && (
                                        <p className={styles.inquiryMessage}>
                                            {item.message}
                                        </p>
                                    )}
                                    <small>
                                        {formatDateTime(item.createdAt)}
                                        {item.preferredTime
                                            ? ` · 희망 ${item.preferredTime}`
                                            : ""}
                                    </small>

                                    <form
                                        action={inquiryAction}
                                        className={styles.inquiryActions}
                                    >
                                        <input
                                            type="hidden"
                                            name="inquiryId"
                                            value={item.id}
                                        />
                                        <select
                                            name="status"
                                            defaultValue={item.status}
                                        >
                                            <option value="NEW">신규</option>
                                            <option value="IN_PROGRESS">
                                                진행중
                                            </option>
                                            <option value="DONE">완료</option>
                                            <option value="SPAM">스팸</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className={styles.secondaryBtn}
                                            disabled={inquiryPending}
                                        >
                                            상태 저장
                                        </button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            )}
        </section>
    );
}