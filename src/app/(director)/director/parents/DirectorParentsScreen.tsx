/**
 * 학부모-학생 연결 관리 UI (서버 컴포넌트).
 *
 * `/director/parents`가 연결. 가족 관계는 원장만 만든다.
 * props: parents, students, activeLinks — families director-data.
 * 연결은 `ParentStudentLinkForm` → `linkParentStudent`,
 * 해제는 `UnlinkParentStudentButton` → `unlinkParentStudent`.
 */

import type {
    ActiveFamilyLink,
    LinkableParent,
    LinkableStudent,
} from "@/features/families/types";
import { formatStudentSchool } from "@/features/students/presentation";
import {
    cx,
    emptyStateStyles,
    pageHeadingStyles,
    screenStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import ParentStudentLinkForm from "./ParentStudentLinkForm";
import UnlinkParentStudentButton from "./UnlinkParentStudentButton";
import styles from "./page.module.css";

/** 요약 카드·연결 폼·현재 링크 목록을 그린다. */
export default function DirectorParentsScreen({
    parents,
    students,
    activeLinks,
}: {
    parents: LinkableParent[];
    students: LinkableStudent[];
    activeLinks: ActiveFamilyLink[];
}) {
    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>PARENTS</span>
                    <h1>학부모 관리</h1>
                    <p>가입이 완료된 학부모와 학생을 연결하고 관리합니다.</p>
                </div>
                <div className={styles.activeBadge}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    연결 중<strong>{activeLinks.length}</strong>
                </div>
            </header>
            <section className={styles.summary} aria-label="연결 가능 계정 요약">
                <SummaryCard
                    kind="parent"
                    value={parents.length}
                    label="연결 가능한 학부모"
                    description="활성 상태인 학부모 계정입니다."
                />
                <SummaryCard
                    kind="student"
                    value={students.length}
                    label="연결 가능한 학생"
                    description="현재 학부모가 연결되지 않은 학생입니다."
                />
            </section>
            <ParentStudentLinkForm parents={parents} students={students} />
            <section className={cx(surfaceStyles.soft, styles.linkListPanel)}>
                <header className={styles.listHeader}>
                    <div>
                        <span className={pageHeadingStyles.sectionLabel}>
                            ACTIVE CONNECTIONS
                        </span>
                        <h2>현재 가족 연결</h2>
                        <p className={typographyStyles.hint}>
                            학부모 계정과 연결된 학생을 확인하고 관리합니다.
                        </p>
                    </div>
                    <span className={cx(typographyStyles.muted, styles.linkCount)}>
                        {activeLinks.length} CONNECTIONS
                    </span>
                </header>
                {activeLinks.length === 0 ? (
                    <div className={cx(emptyStateStyles.compact, styles.empty)}>
                        <div className={styles.emptyIcon} aria-hidden="true">
                            ✓
                        </div>
                        <h3>현재 연결된 가족이 없습니다</h3>
                        <p>위 연결 폼에서 연결하면 이곳에 표시됩니다.</p>
                    </div>
                ) : (
                    <ul className={styles.linkList}>
                        {activeLinks.map((link) => (
                            <li className={styles.linkCard} key={link.id}>
                                <div className={styles.familyConnection}>
                                    <Person
                                        kind="parent"
                                        role="학부모"
                                        name={link.parent.name}
                                        primary={link.parent.email}
                                        secondary={link.parent.phone}
                                    />
                                    <div
                                        className={styles.connectionArrow}
                                        aria-hidden="true"
                                    >
                                        <span />
                                        <strong>→</strong>
                                        <span />
                                    </div>
                                    <Person
                                        kind="student"
                                        role="학생"
                                        name={link.student.name}
                                        primary={formatStudentSchool(
                                            link.student.schoolName,
                                            link.student.grade,
                                            "학교·학년 미입력",
                                        )}
                                        secondary={link.student.email}
                                    />
                                </div>
                                <div className={styles.linkMeta}>
                                    <span className={styles.relationshipBadge}>
                                        {link.relationship ?? "보호자"}
                                    </span>
                                    <div>
                                        <span className={typographyStyles.muted}>연결일</span>
                                        <time dateTime={link.linkedAt}>
                                            {formatLinkedAt(link.linkedAt)}
                                        </time>
                                    </div>
                                </div>
                                <div className={styles.linkActions}>
                                    <UnlinkParentStudentButton
                                        linkId={link.id}
                                        parentName={link.parent.name}
                                        studentName={link.student.name}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    );
}

/** 연결 가능 학부모/학생 수 요약 카드. */
function SummaryCard({
    kind,
    value,
    label,
    description,
}: {
    kind: "parent" | "student";
    value: number;
    label: string;
    description: string;
}) {
    return (
        <article className={cx(surfaceStyles.soft, styles.summaryCard)}>
            <div
                className={
                    kind === "parent"
                        ? styles.parentSummaryIcon
                        : styles.studentSummaryIcon
                }
                aria-hidden="true"
            >
                {kind === "parent" ? "P" : "S"}
            </div>
            <div className={styles.summaryContent}>
                <span className={typographyStyles.muted}>{label}</span>
                <strong>{value}명</strong>
                <p className={typographyStyles.hint}>{description}</p>
            </div>
        </article>
    );
}

/** 링크 행의 학부모 또는 학생 신원 블록. */
function Person({
    kind,
    role,
    name,
    primary,
    secondary,
}: {
    kind: "parent" | "student";
    role: string;
    name: string;
    primary: string;
    secondary?: string | null;
}) {
    return (
        <div className={styles.personBlock}>
            <div
                className={
                    kind === "parent" ? styles.parentAvatar : styles.studentAvatar
                }
                aria-hidden="true"
            >
                {name.trim().charAt(0).toUpperCase() || "A"}
            </div>
            <div className={styles.personInfo}>
                <span className={styles.personRole}>{role}</span>
                <strong>{name}</strong>
                <p className={typographyStyles.hint}>{primary}</p>
                {secondary && (
                    <small className={typographyStyles.muted}>{secondary}</small>
                )}
            </div>
        </div>
    );
}

/** 연결일을 KST 긴 날짜로. */
function formatLinkedAt(date: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(date));
}
