"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 상담 메모와 게스트 문의 탭 UI (클라이언트).
 *
 * `/teacher/counseling`(문의 없음)과 `/employee/counseling`(문의 포함)이
 * 같은 Screen을 쓴다. STAFF이고 inquiries가 있으면 문의 탭을 기본으로 연다.
 *
 * props: role, students, memos, inquiries.
 * 메모 저장은 `CounselingMemoPanel` → `createCounselingMemo`.
 * 문의 상태는 `InquiryManagementPanel` → `updateInquiryStatus`.
 */

import { useState } from "react"; // 의존성. 교사 includeInquiries false, 직원 true.
import type { // 타입만. 런타임 로직이 아니다.
    CounselingStudentOption, // 구문. 교사 includeInquiries false, 직원 true.
    StaffCounselingMemo, // 구문. 교사 includeInquiries false, 직원 true.
    StaffInquiryItem, // 구문. 교사 includeInquiries false, 직원 true.
} from "@/features/counseling/types"; // 교사 includeInquiries false, 직원 true.
import CounselingMemoPanel from "./components/CounselingMemoPanel"; // 같은 라우트 모듈. 교사 includeInquiries false, 직원 true.
import InquiryManagementPanel from "./components/InquiryManagementPanel"; // 같은 라우트 모듈. 교사 includeInquiries false, 직원 true.
import styles from "./StaffCounselingScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 메모/문의 탭을 나누고 해당 패널을 연다. */
export default function StaffCounselingScreen({ // 이 파일의 화면. 교사 includeInquiries false, 직원 true.
    role, // 구문. 교사 includeInquiries false, 직원 true.
    students, // 구문. 교사 includeInquiries false, 직원 true.
    memos, // 구문. 교사 includeInquiries false, 직원 true.
    inquiries, // 구문. 교사 includeInquiries false, 직원 true.
}: { // 구문. 교사 includeInquiries false, 직원 true.
    role: "TEACHER" | "STAFF"; // role 필드.
    students: CounselingStudentOption[]; // students 필드.
    memos: StaffCounselingMemo[]; // memos 필드.
    inquiries: StaffInquiryItem[]; // inquiries 필드.
}) { // 구문. 교사 includeInquiries false, 직원 true.
    const [activeTab, setActiveTab] = useState<"memos" | "inquiries">( // 직원이면 게스트 문의 우선. 교사는 includeInquiries: false라 문의 탭이 없다.
        role === "STAFF" && inquiries.length > 0 ? "inquiries" : "memos", // 구문. 교사 includeInquiries false, 직원 true.
    ); // 호출/그룹 끝.
    return ( // JSX 반환. 교사 includeInquiries false, 직원 true.
        <section className={styles.page}>{/* 교사/직원 공용. 원장 상담 Screen이 아니다. */}
            <header className={styles.heading}>{/* 상담 관리. 교사 page는 문의 목록이 비어 있다. */}
                <div>{/* 레이아웃 상자. */}
                    <span>COUNSELING</span>{/* 인라인 표시. */}
                    <h1>상담 관리</h1>{/* 제목. */}
                    <p>학부모 상담 요청과 진행 기록을 관리합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}
            <div className={styles.filters}>{/* 메모/문의 탭. 문의 버튼은 STAFF만. */}
                <button // 상담 메모. 교사는 본인 메모만(onlyOwnMemos).
                    type="button" // type 필드.
                    className={ // 객체/블록 시작.
                        activeTab === "memos" // 교사 includeInquiries false, 직원 true.
                            ? styles.filterActive // 교사 includeInquiries false, 직원 true.
                            : styles.filterBtn // 교사 includeInquiries false, 직원 true.
                    } // 블록 끝.
                    onClick={() => setActiveTab("memos")} // onClick 필드.
                >{/* 교사 includeInquiries false, 직원 true. */}
                    상담 기록{/* 교사 includeInquiries false, 직원 true. */}
                </button>{/* button 닫기. */}
                {role === "STAFF" && ( // 게스트 문의. 교사 page는 includeInquiries: false.
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        className={ // 객체/블록 시작.
                            activeTab === "inquiries" // 교사 includeInquiries false, 직원 true.
                                ? styles.filterActive // 교사 includeInquiries false, 직원 true.
                                : styles.filterBtn // 교사 includeInquiries false, 직원 true.
                        } // 블록 끝.
                        onClick={() => setActiveTab("inquiries")} // onClick 필드.
                    >{/* 교사 includeInquiries false, 직원 true. */}
                        상담 문의{/* 교사 includeInquiries false, 직원 true. */}
                        {inquiries.length > 0 ? ` (${inquiries.length})` : ""}{/* 교사 includeInquiries false, 직원 true. */}
                    </button> // button 닫기.
                )}{/* 구문 끝. */}
            </div>{/* div 닫기. */}
            {activeTab === "memos" ? ( // 상담 메모. 교사는 본인 메모만.
                <CounselingMemoPanel students={students} memos={memos} /> // CounselingMemoPanel. 교사 includeInquiries false, 직원 true.
            ) : role === "STAFF" ? ( // 게스트 문의. 교사 page는 includeInquiries: false.
                <InquiryManagementPanel inquiries={inquiries} /> // InquiryManagementPanel. 교사 includeInquiries false, 직원 true.
            ) : null}{/* 교사 includeInquiries false, 직원 true. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
