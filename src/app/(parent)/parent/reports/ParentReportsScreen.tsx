"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 자녀에게 발송된 AI 리포트 본문 UI (클라이언트).
 *
 * props: childList(받은 리포트만), activeChildId.
 * 초안/반려는 page 데이터가 이미 걸렀다. 학부모가 교사 작성 과정을 보지 않게 한다.
 *
 * 자녀 전환은 child 쿠키. 승인·반려 Action은 없다 → 원장 DirectorReportsScreen.
 */

import { useMemo, useState } from "react"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { ParentReportChild } from "@/features/reports/parent-types"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.
import { writeParentChildCookie } from "@/features/families/parent-child-cooke"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 자녀 탭과 선택한 리포트 본문·이력을 그린다. */
export default function ParentReportsScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    activeChildId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList: ParentReportChild[]; // childList 필드.
    activeChildId: string; // activeChildId 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const activeChild = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList.find((child) => child.id === activeChildId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const [activeReportId, setActiveReportId] = useState<string | null>( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        activeChild?.reports[0]?.id ?? null, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    ); // 호출/그룹 끝.
    const activeReport = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        if (!activeChild) return null; // 분기. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        return ( // SENT 리포트만. 초안/반려는 숨긴다.
            activeChild.reports.find( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                (report) => report.id === activeReportId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            ) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            activeChild.reports[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            null // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        ); // 호출/그룹 끝.
    }, [activeChild, activeReportId]); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const pastReports = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        if (!activeChild || !activeReport) return activeChild?.reports ?? []; // 분기. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        return activeChild.reports.filter( // 반환. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            (report) => report.id !== activeReport.id, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        ); // 호출/그룹 끝.
    }, [activeChild, activeReport]); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.

    function selectChild(childId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        writeParentChildCookie(childId); // 쿠키 + URL. 승인·반려는 원장 Screen.
        router.replace(`/parent/reports?childId=${childId}`); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    return ( // SENT 리포트만. 초안/반려는 숨긴다.
        <section className={styles.page}>{/* SENT 리포트만. 초안/반려는 숨긴다. */}
            <header className={styles.heading}>{/* SENT 리포트만. 초안/반려는 page가 걸렀다. */}
                <div>{/* 레이아웃 상자. */}
                    <span>AI REPORT</span>{/* 인라인 표시. */}
                    <h1>학습 리포트</h1>{/* 제목. */}
                    <p>선생님이 전한 자녀의 성장 기록을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            {childList.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.emptyPanel}>{/* 원장 연결 전 */}
                    <h2>연결된 자녀가 없습니다</h2>{/* 소제목. */}
                    <p>{/* 문장. */}
                        학원에서 학부모-학생 연결을 완료하면 이곳에 학습{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                        리포트가 표시됩니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    </p>{/* p 닫기. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    {childList.length > 1 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.childTabs} role="tablist">{/* 자녀 탭 */}
                            {childList.map((child) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                    key={child.id} // key 필드.
                                    type="button" // type 필드.
                                    role="tab" // role 필드.
                                    aria-selected={child.id === activeChildId} // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    className={ // 객체/블록 시작.
                                        child.id === activeChildId // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? styles.activeTab // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : undefined // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    } // 블록 끝.
                                    onClick={() => selectChild(child.id)} // onClick 필드.
                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {child.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </button> // button 닫기.
                            ))}{/* 구문 끝. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    {!activeReport ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.emptyPanel}>{/* 발송된 리포트 없음 */}
                            <h2>아직 받은 리포트가 없습니다</h2>{/* 소제목. */}
                            <p>{/* 문장. */}
                                선생님이 작성하고 원장 승인 후 발송되면 여기에서{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                확인할 수 있습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            </p>{/* p 닫기. */}
                        </div> // div 닫기.
                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.content}>{/* 레이아웃 상자. */}
                            <article className={styles.hero}>{/* 선택한 리포트 본문 */}
                                <StatusChip tone="success">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {formatPeriodLabel( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        activeReport.periodStart, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        activeReport.periodEnd, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    )}{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    리포트{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </StatusChip>{/* StatusChip 닫기. */}
                                <h2>{/* 소제목. */}
                                    {activeChild?.className // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        ? `${activeChild.className} 학습 보고서` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        : `${activeChild?.name} 학습 보고서`}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </h2>{/* h2 닫기. */}
                                <p>{activeReport.content || "(내용 없음)"}</p>{/* 문장. */}
                                <div className={styles.heroMeta}>{/* 레이아웃 상자. */}
                                    <span>{/* 인라인 표시. */}
                                        {activeReport.teacherName}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {activeReport.sentAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? ` · ${formatDate(activeReport.sentAt)}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </span>{/* span 닫기. */}
                                    <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        tone={ // 객체/블록 시작.
                                            activeReport.parentReadAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? "neutral" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : "warning" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        } // 블록 끝.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {activeReport.parentReadAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? "읽음" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : "새 리포트"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                            </article>{/* article 닫기. */}

                            {activeReport.keywords.length > 0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <article className={styles.panel}>{/* SENT 리포트만. 초안/반려는 숨긴다. */}
                                    <h3>평가 키워드</h3>{/* 소제목. */}
                                    <ul className={styles.keywordList}>{/* 목록. */}
                                        {activeReport.keywords.map( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            (keyword) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={keyword}>{keyword}</li> // 항목.
                                            ), // 구문 끝.
                                        )}{/* 구문 끝. */}
                                    </ul>{/* ul 닫기. */}
                                </article> // article 닫기.
                            )}{/* 구문 끝. */}

                            <article className={styles.panel}>{/* 지난 보고서 */}
                                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                    <h3>지난 보고서</h3>{/* 소제목. */}
                                    <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {pastReports.length}건{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                                {pastReports.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <p className={styles.empty}>{/* 문장. */}
                                        이전 보고서가 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p> // p 닫기.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <ul className={styles.reportList}>{/* 목록. */}
                                        {pastReports.map((report) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <li key={report.id}>{/* 항목. */}
                                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                                    type="button" // type 필드.
                                                    onClick={() => // onClick 필드.
                                                        setActiveReportId( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            report.id, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        ) // 호출/그룹 끝.
                                                    } // 블록 끝.
                                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    <span>{/* 인라인 표시. */}
                                                        <strong>{/* 강조. */}
                                                            {formatPeriodLabel( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                report.periodStart, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                report.periodEnd, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            )}{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            학습 보고서{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <small>{/* 보조 문장. */}
                                                            {report.teacherName}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </small>{/* small 닫기. */}
                                                    </span>{/* span 닫기. */}
                                                    <span>보기</span>{/* 인라인 표시. */}
                                                </button>{/* button 닫기. */}
                                            </li> // li 닫기.
                                        ))}{/* 구문 끝. */}
                                    </ul> // ul 닫기.
                                )}{/* 구문 끝. */}
                            </article>{/* article 닫기. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 리포트 기간을 KST 월 라벨로. */
function formatPeriodLabel(startIso: string, endIso: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const end = new Date(endIso); // 기간을 KST 월 라벨로.
    return new Intl.DateTimeFormat("ko-KR", { // 반환. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        timeZone: "Asia/Seoul", // timeZone 필드.
        month: "long", // month 필드.
    }).format(end); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} // 블록 끝.

/** ISO를 KST 월/일 짧은 표시로. */
function formatDate(iso: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    return new Intl.DateTimeFormat("ko-KR", { // ISO를 KST 월/일로.
        timeZone: "Asia/Seoul", // timeZone 필드.
        month: "numeric", // month 필드.
        day: "numeric", // day 필드.
    }).format(new Date(iso)); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} // 블록 끝.
