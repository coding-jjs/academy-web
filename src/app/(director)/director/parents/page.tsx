import { prisma } from "@/lib/db";
import ParentStudentLinkForm from "./ParentStudentLinkForm";
import UnlinkParentStudentButton from "./UnlinkParentStudentButton";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DirectorParentsPage() {
    const [parents, students, activeLinks] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "PARENT",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { name: "asc" },
        }),
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                user: {
                    is: {
                        role: "STUDENT",
                        status: "ACTIVE",
                    },
                },
                parentLinks: {
                    none: { endedAt: null },
                },
            },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
            },
            orderBy: { name: "asc" },
        }),
        prisma.parentStudentLink.findMany({
            where: { endedAt: null },
            select: {
                id: true,
                relationship: true,
                linkedAt: true,
                parent: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                student: {
                    select: {
                        name: true,
                        schoolName: true,
                        grade: true,
                        user: {
                            select: { email: true },
                        },
                    },
                },
            },
            orderBy: { linkedAt: "desc" },
        }),
    ]);

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span className={styles.eyebrow}>PARENTS</span>
                    <h1>학부모 관리</h1>
                    <p>
                        가입이 완료된 학부모와 학생을 연결하고 현재 연결 상태를
                        관리합니다.
                    </p>
                </div>
                <div className={styles.activeBadge}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    연결 중<strong>{activeLinks.length}</strong>
                </div>
            </header>

            <section
                className={styles.summary}
                aria-label="연결 가능 계정 요약"
            >
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

            <section className={styles.linkListPanel}>
                <header className={styles.listHeader}>
                    <div>
                        <span className={styles.sectionLabel}>
                            ACTIVE CONNECTIONS
                        </span>
                        <h2>현재 가족 연결</h2>
                        <p>학부모 계정과 연결된 학생을 확인하고 관리합니다.</p>
                    </div>
                    <span className={styles.linkCount}>
                        {activeLinks.length} CONNECTIONS
                    </span>
                </header>

                {activeLinks.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon} aria-hidden="true">
                            ✓
                        </div>
                        <h3>현재 연결된 가족이 없습니다</h3>
                        <p>
                            위 연결 폼에서 학부모와 학생을 연결하면 이곳에
                            표시됩니다.
                        </p>
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
                                        primary={formatStudentDetails(
                                            link.student.schoolName,
                                            link.student.grade,
                                        )}
                                        secondary={link.student.user?.email}
                                    />
                                </div>

                                <div className={styles.linkMeta}>
                                    <span className={styles.relationshipBadge}>
                                        {link.relationship ?? "보호자"}
                                    </span>
                                    <div>
                                        <span>연결일</span>
                                        <time
                                            dateTime={link.linkedAt.toISOString()}
                                        >
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
        <article className={styles.summaryCard}>
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
                <span>{label}</span>
                <strong>{value}명</strong>
                <p>{description}</p>
            </div>
        </article>
    );
}

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
                    kind === "parent"
                        ? styles.parentAvatar
                        : styles.studentAvatar
                }
                aria-hidden="true"
            >
                {getInitial(name)}
            </div>
            <div className={styles.personInfo}>
                <span className={styles.personRole}>{role}</span>
                <strong>{name}</strong>
                <p>{primary}</p>
                {secondary && <small>{secondary}</small>}
            </div>
        </div>
    );
}

function getInitial(name: string) {
    return name.trim().charAt(0).toUpperCase() || "A";
}

function formatStudentDetails(schoolName: string | null, grade: string | null) {
    if (!schoolName && !grade) return "학교·학년 미입력";
    if (!schoolName) return `${grade}학년`;
    if (!grade) return schoolName;
    return `${schoolName} · ${grade}학년`;
}

function formatLinkedAt(date: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}
