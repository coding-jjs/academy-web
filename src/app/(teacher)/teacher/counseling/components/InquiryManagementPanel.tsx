"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 게스트 상담 문의 상태 변경 패널 (클라이언트).
 *
 * `useActionState(updateInquiryStatus)`.
 * 직원 counseling page가 inquiries를 채울 때만 건이 보인다.
 * 교사 page는 includeInquiries: false라 빈 목록이다.
 * 원생 자동 등록은 하지 않는다.
 */

import { useActionState } from "react"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    formatCounselingDateTime, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    INQUIRY_STATUS_METADATA, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/counseling/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import type { StaffInquiryItem } from "@/features/counseling/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    updateInquiryStatus, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    type CounselingActionState, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/counseling/actions"; // 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffCounselingScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" }; // 교사 Screen. StaffDashboard는 교사 전용.

/** 문의 건별 상태 select를 제출한다. */
export default function InquiryManagementPanel({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    inquiries, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    inquiries: StaffInquiryItem[]; // inquiries 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    const [state, formAction, isPending] = useActionState( // updateInquiryStatus. 교사 page는 includeInquiries: false라 빈 목록.
        updateInquiryStatus, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
        INITIAL_STATE, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.
    return ( // 게스트 문의 상태. 교사 includeInquiries:false면 비어 있다.
        <article className={styles.panel}>{/* 게스트 문의 상태. 교사 includeInquiries:false면 비어 있다. */}
            <div className={styles.panelHead}>{/* /guest/inquiry 건. 원생 자동 등록 없음. */}
                <h2>게스트 상담 문의</h2>{/* 소제목. */}
                <StatusChip tone="warning">{inquiries.length}건</StatusChip>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
            </div>{/* div 닫기. */}
            {state.message && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p // 문장.
                    className={ // 객체/블록 시작.
                        state.status === "success" // 교사 Screen. StaffDashboard는 교사 전용.
                            ? styles.success // 교사 Screen. StaffDashboard는 교사 전용.
                            : styles.error // 교사 Screen. StaffDashboard는 교사 전용.
                    } // 블록 끝.
                    role="alert" // role 필드.
                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    {state.message}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </p> // p 닫기.
            )}{/* 구문 끝. */}
            {inquiries.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={styles.muted}>처리할 문의가 없습니다.</p> // 처리할 문의 없음. 교사 라우트면 항상 여기.
            ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <ul className={styles.inquiryList}>{/* 상태 select → 저장 */}
                    {inquiries.map((inquiry) => { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        const metadata = // 교사 Screen. StaffDashboard는 교사 전용.
                            INQUIRY_STATUS_METADATA[inquiry.status]; // 교사 Screen. StaffDashboard는 교사 전용.
                        return ( // 게스트 문의 상태. 교사 includeInquiries:false면 비어 있다.
                            <li key={inquiry.id}>{/* 항목. */}
                                <div className={styles.itemTop}>{/* 레이아웃 상자. */}
                                    <strong>{inquiry.guardianName}</strong>{/* 강조. */}
                                    <StatusChip tone={metadata.tone}>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
                                        {metadata.label}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                                <p>{/* 문장. */}
                                    {inquiry.phone}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    {inquiry.studentGrade // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? ` · ${inquiry.studentGrade}` // 교사 Screen. StaffDashboard는 교사 전용.
                                        : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    {inquiry.interestedSubject // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? ` · ${inquiry.interestedSubject}` // 교사 Screen. StaffDashboard는 교사 전용.
                                        : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </p>{/* p 닫기. */}
                                {inquiry.message && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                    <p className={styles.inquiryMessage}>{/* 문장. */}
                                        {inquiry.message}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </p> // p 닫기.
                                )}{/* 구문 끝. */}
                                <small>{/* 보조 문장. */}
                                    {formatCounselingDateTime( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                        inquiry.createdAt, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                    )}{/* 구문 끝. */}
                                    {inquiry.preferredTime // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? ` · 희망 ${inquiry.preferredTime}` // 교사 Screen. StaffDashboard는 교사 전용.
                                        : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </small>{/* small 닫기. */}
                                <form // 게스트 문의 상태. 교사 includeInquiries:false면 비어 있다.
                                    action={formAction} // action 필드.
                                    className={styles.inquiryActions} // className 필드.
                                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    <input // 문의 상태만. 원생 카드는 안 만든다.
                                        type="hidden" // type 필드.
                                        name="inquiryId" // name 필드.
                                        value={inquiry.id} // value 필드.
                                    />{/* 구문 끝. */}
                                    <select // 선택. 서버에서 다시 검증한다.
                                        name="status" // name 필드.
                                        defaultValue={inquiry.status} // defaultValue 필드.
                                    >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        <option value="NEW">신규</option>{/* 선택지. */}
                                        <option value="IN_PROGRESS">{/* 선택지. */}
                                            진행중{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        </option>{/* option 닫기. */}
                                        <option value="DONE">완료</option>{/* 선택지. */}
                                        <option value="SPAM">스팸</option>{/* 선택지. */}
                                    </select>{/* select 닫기. */}
                                    <button // pending이면 상태 중복 저장을 막는다.
                                        type="submit" // type 필드.
                                        className={styles.secondaryBtn} // className 필드.
                                        disabled={isPending} // disabled 필드.
                                    >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        상태 저장{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </button>{/* button 닫기. */}
                                </form>{/* form 닫기. */}
                            </li> // li 닫기.
                        ); // 호출/그룹 끝.
                    })}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
