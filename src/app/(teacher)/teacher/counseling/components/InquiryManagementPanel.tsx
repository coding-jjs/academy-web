"use client";

/**
 * 게스트 상담 문의 상태 변경 패널 (클라이언트).
 *
 * `useActionState(updateInquiryStatus)`.
 * 직원 counseling page가 inquiries를 채울 때만 건이 보인다.
 * 교사 page는 includeInquiries: false라 빈 목록이다.
 * 원생 자동 등록은 하지 않는다.
 */

import { useActionState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    formatCounselingDateTime,
    INQUIRY_STATUS_METADATA,
} from "@/features/counseling/presentation";
import type { StaffInquiryItem } from "@/features/counseling/types";
import {
    updateInquiryStatus,
    type CounselingActionState,
} from "@/features/counseling/actions";
import styles from "../StaffCounselingScreen.module.css";

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" };

/** 문의 건별 상태 select를 제출한다. */
export default function InquiryManagementPanel({
    inquiries,
}: {
    inquiries: StaffInquiryItem[];
}) {
    const [state, formAction, isPending] = useActionState(
        updateInquiryStatus,
        INITIAL_STATE,
    );
    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}>
                <h2>게스트 상담 문의</h2>
                <StatusChip tone="warning">{inquiries.length}건</StatusChip>
            </div>
            {state.message && (
                <p
                    className={
                        state.status === "success"
                            ? styles.success
                            : styles.error
                    }
                    role="alert"
                >
                    {state.message}
                </p>
            )}
            {inquiries.length === 0 ? (
                <p className={styles.muted}>처리할 문의가 없습니다.</p>
            ) : (
                <ul className={styles.inquiryList}>
                    {inquiries.map((inquiry) => {
                        const metadata =
                            INQUIRY_STATUS_METADATA[inquiry.status];
                        return (
                            <li key={inquiry.id}>
                                <div className={styles.itemTop}>
                                    <strong>{inquiry.guardianName}</strong>
                                    <StatusChip tone={metadata.tone}>
                                        {metadata.label}
                                    </StatusChip>
                                </div>
                                <p>
                                    {inquiry.phone}
                                    {inquiry.studentGrade
                                        ? ` · ${inquiry.studentGrade}`
                                        : ""}
                                    {inquiry.interestedSubject
                                        ? ` · ${inquiry.interestedSubject}`
                                        : ""}
                                </p>
                                {inquiry.message && (
                                    <p className={styles.inquiryMessage}>
                                        {inquiry.message}
                                    </p>
                                )}
                                <small>
                                    {formatCounselingDateTime(
                                        inquiry.createdAt,
                                    )}
                                    {inquiry.preferredTime
                                        ? ` · 희망 ${inquiry.preferredTime}`
                                        : ""}
                                </small>
                                <form
                                    action={formAction}
                                    className={styles.inquiryActions}
                                >
                                    <input
                                        type="hidden"
                                        name="inquiryId"
                                        value={inquiry.id}
                                    />
                                    <select
                                        name="status"
                                        defaultValue={inquiry.status}
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
                                        disabled={isPending}
                                    >
                                        상태 저장
                                    </button>
                                </form>
                            </li>
                        );
                    })}
                </ul>
            )}
        </article>
    );
}
