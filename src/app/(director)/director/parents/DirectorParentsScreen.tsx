/**
 * 학부모-학생 연결 관리 UI (서버 컴포넌트).
 *
 * `/director/parents`가 연결. 가족 관계는 원장만 만든다.
 * props: parents, students, activeLinks — families director-data.
 * 연결은 `ParentStudentLinkForm` → `linkParentStudent`,
 * 해제는 `UnlinkParentStudentButton` → `unlinkParentStudent`.
 */

import type { // 타입만. 런타임 로직이 아니다.
    ActiveFamilyLink, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    LinkableParent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    LinkableStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/families/types"; // 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import ParentStudentLinkForm from "./ParentStudentLinkForm"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import UnlinkParentStudentButton from "./UnlinkParentStudentButton"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 요약 카드·연결 폼·현재 링크 목록을 그린다. */
export default function DirectorParentsScreen({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    parents, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    activeLinks, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    parents: LinkableParent[]; // parents 필드.
    students: LinkableStudent[]; // students 필드.
    activeLinks: ActiveFamilyLink[]; // activeLinks 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 학부모-원생 링크. 학부모가 스스로 묶지 못한다.
        <section className={screenStyles.animatedPage}>{/* 학부모-원생 링크. 학부모가 스스로 묶지 못한다. */}
            <header className={pageHeadingStyles.root}>{/* 현재 연결 수 */}
                <div>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.eyebrow}>PARENTS</span>{/* 인라인 표시. */}
                    <h1>학부모 관리</h1>{/* 제목. */}
                    <p>가입이 완료된 학부모와 학생을 연결하고 관리합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.activeBadge}>{/* 레이아웃 상자. */}
                    <span className={styles.statusDot} aria-hidden="true" />{/* 인라인 표시. */}
                    연결 중<strong>{activeLinks.length}</strong>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <section className={styles.summary} aria-label="연결 가능 계정 요약">{/* 연결 가능 학부모·학생 수 */}
                <SummaryCard // SummaryCard. 원장 Screen. layout requireRole DIRECTOR.
                    kind="parent" // kind 필드.
                    value={parents.length} // value 필드.
                    label="연결 가능한 학부모" // label 필드.
                    description="활성 상태인 학부모 계정입니다." // description 필드.
                />{/* 구문 끝. */}
                <SummaryCard // SummaryCard. 원장 Screen. layout requireRole DIRECTOR.
                    kind="student" // kind 필드.
                    value={students.length} // value 필드.
                    label="연결 가능한 학생" // label 필드.
                    description="현재 학부모가 연결되지 않은 학생입니다." // description 필드.
                />{/* 구문 끝. */}
            </section>{/* section 닫기. */}

            <ParentStudentLinkForm parents={parents} students={students} />{/* linkParentStudent. 학부모가 스스로 묶지 못한다. */}

            <section className={cx(surfaceStyles.soft, styles.linkListPanel)}>{/* 현재 가족 연결 */}
                <header className={styles.listHeader}>{/* 학부모-원생 링크. 학부모가 스스로 묶지 못한다. */}
                    <div>{/* 레이아웃 상자. */}
                        <span className={pageHeadingStyles.sectionLabel}>{/* 인라인 표시. */}
                            ACTIVE CONNECTIONS{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </span>{/* span 닫기. */}
                        <h2>현재 가족 연결</h2>{/* 소제목. */}
                        <p className={typographyStyles.hint}>{/* 문장. */}
                            학부모 계정과 연결된 학생을 확인하고 관리합니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}
                    <span className={cx(typographyStyles.muted, styles.linkCount)}>{/* 인라인 표시. */}
                        {activeLinks.length} CONNECTIONS{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </span>{/* span 닫기. */}
                </header>{/* header 닫기. */}

                {activeLinks.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <div className={cx(emptyStateStyles.compact, styles.empty)}>{/* 연결 전 */}
                        <div className={styles.emptyIcon} aria-hidden="true">{/* 레이아웃 상자. */}
                            ✓{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </div>{/* div 닫기. */}
                        <h3>현재 연결된 가족이 없습니다</h3>{/* 소제목. */}
                        <p>위 연결 폼에서 연결하면 이곳에 표시됩니다.</p>{/* 문장. */}
                    </div> // div 닫기.
                ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <ul className={styles.linkList}>{/* 해제 버튼은 unlinkParentStudent */}
                        {activeLinks.map((link) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <li className={styles.linkCard} key={link.id}>{/* 항목. */}
                                <div className={styles.familyConnection}>{/* 레이아웃 상자. */}
                                    <Person // Person. 원장 Screen. layout requireRole DIRECTOR.
                                        kind="parent" // kind 필드.
                                        role="학부모" // role 필드.
                                        name={link.parent.name} // name 필드.
                                        primary={link.parent.email} // primary 필드.
                                        secondary={link.parent.phone} // secondary 필드.
                                    />{/* 구문 끝. */}
                                    <div // 레이아웃 상자.
                                        className={styles.connectionArrow} // className 필드.
                                        aria-hidden="true" // 원장 Screen. layout requireRole DIRECTOR.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        <span />{/* 인라인 표시. */}
                                        <strong>→</strong>{/* 강조. */}
                                        <span />{/* 인라인 표시. */}
                                    </div>{/* div 닫기. */}
                                    <Person // Person. 원장 Screen. layout requireRole DIRECTOR.
                                        kind="student" // kind 필드.
                                        role="학생" // role 필드.
                                        name={link.student.name} // name 필드.
                                        primary={formatStudentSchool( // primary 필드.
                                            link.student.schoolName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            link.student.grade, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            "학교·학년 미입력", // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        )} // 구문 끝.
                                        secondary={link.student.email} // secondary 필드.
                                    />{/* 구문 끝. */}
                                </div>{/* div 닫기. */}
                                <div className={styles.linkMeta}>{/* 레이아웃 상자. */}
                                    <span className={styles.relationshipBadge}>{/* 인라인 표시. */}
                                        {link.relationship ?? "보호자"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </span>{/* span 닫기. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <span className={typographyStyles.muted}>연결일</span>{/* 인라인 표시. */}
                                        <time dateTime={link.linkedAt}>{/* time. 원장 Screen. layout requireRole DIRECTOR. */}
                                            {formatLinkedAt(link.linkedAt)}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        </time>{/* time 닫기. */}
                                    </div>{/* div 닫기. */}
                                </div>{/* div 닫기. */}
                                <div className={styles.linkActions}>{/* 레이아웃 상자. */}
                                    <UnlinkParentStudentButton // UnlinkParentStudentButton. 원장 Screen. layout requireRole DIRECTOR.
                                        linkId={link.id} // linkId 필드.
                                        parentName={link.parent.name} // parentName 필드.
                                        studentName={link.student.name} // studentName 필드.
                                    />{/* 구문 끝. */}
                                </div>{/* div 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </section>{/* section 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 연결 가능 학부모/학생 수 요약 카드. */
function SummaryCard({ // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    kind, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    value, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    label, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    description, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    kind: "parent" | "student"; // kind 필드.
    value: number; // value 필드.
    label: string; // label 필드.
    description: string; // description 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 연결 가능 수 표시만.
        <article className={cx(surfaceStyles.soft, styles.summaryCard)}>{/* 학부모-원생 링크. 학부모가 스스로 묶지 못한다. */}
            <div // 레이아웃 상자.
                className={ // 객체/블록 시작.
                    kind === "parent" // 원장 Screen. layout requireRole DIRECTOR.
                        ? styles.parentSummaryIcon // 원장 Screen. layout requireRole DIRECTOR.
                        : styles.studentSummaryIcon // 원장 Screen. layout requireRole DIRECTOR.
                } // 블록 끝.
                aria-hidden="true" // 원장 Screen. layout requireRole DIRECTOR.
            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                {kind === "parent" ? "P" : "S"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            <div className={styles.summaryContent}>{/* 레이아웃 상자. */}
                <span className={typographyStyles.muted}>{label}</span>{/* 인라인 표시. */}
                <strong>{value}명</strong>{/* 강조. */}
                <p className={typographyStyles.hint}>{description}</p>{/* 문장. */}
            </div>{/* div 닫기. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 링크 행의 학부모 또는 학생 신원 블록. */
function Person({ // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    kind, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    role, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    name, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    primary, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    secondary, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    kind: "parent" | "student"; // kind 필드.
    role: string; // role 필드.
    name: string; // name 필드.
    primary: string; // primary 필드.
    secondary?: string | null; // secondary 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 링크 행의 학부모 또는 학생.
        <div className={styles.personBlock}>{/* 레이아웃 상자. */}
            <div // 레이아웃 상자.
                className={ // 객체/블록 시작.
                    kind === "parent" ? styles.parentAvatar : styles.studentAvatar // 원장 Screen. layout requireRole DIRECTOR.
                } // 블록 끝.
                aria-hidden="true" // 원장 Screen. layout requireRole DIRECTOR.
            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                {name.trim().charAt(0).toUpperCase() || "A"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            <div className={styles.personInfo}>{/* 레이아웃 상자. */}
                <span className={styles.personRole}>{role}</span>{/* 인라인 표시. */}
                <strong>{name}</strong>{/* 강조. */}
                <p className={typographyStyles.hint}>{primary}</p>{/* 문장. */}
                {secondary && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <small className={typographyStyles.muted}>{secondary}</small> // 보조 문장.
                )}{/* 구문 끝. */}
            </div>{/* div 닫기. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 연결일을 KST 긴 날짜로. */
function formatLinkedAt(date: string) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    return new Intl.DateTimeFormat("ko-KR", { // 연결일을 KST 긴 날짜로.
        timeZone: "Asia/Seoul", // timeZone 필드.
        year: "numeric", // year 필드.
        month: "long", // month 필드.
        day: "numeric", // day 필드.
    }).format(new Date(date)); // 원장 Screen. layout requireRole DIRECTOR.
} // 블록 끝.
