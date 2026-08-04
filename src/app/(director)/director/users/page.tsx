import { prisma } from "@/lib/db";
import RoleAssignmentForm from "./RoleAssignmentForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DirectorUsersPage() {
    const [users, unlinkedStudents] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "GUEST",
                status: "ACTIVE",
                onboardingCompleteAt: {
                    not: null,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                schoolName: true,
                grade: true,
                createdAt: true,
                studentProfile: {
                    select: { id: true, status: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        prisma.student.findMany({
            where: {
                userId: null,
                status: { in: ["ENROLLED", "PAUSED"] },
            },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span className={styles.eyebrow}>NEW USERS</span>
                    <h1>가입 사용자</h1>
                    <p>
                        가입 정보를 확인하고 학원에서 사용할 역할을 부여하세요.
                    </p>
                </div>
                <div className={styles.pendingBadge}>
                    <span aria-hidden="true" />
                    역할 대기
                    <strong>{users.length}</strong>
                </div>
            </header>

            <div className={styles.summary}>
                <article className={styles.summaryPrimary}>
                    <div className={styles.summaryIcon} aria-hidden="true">
                        {users.length}
                    </div>
                    <div>
                        <span>현재 대기 인원</span>
                        <strong>{users.length}명</strong>
                        <p>Google 인증과 가입 정보 입력을 완료했습니다.</p>
                    </div>
                </article>
                <article className={styles.guide}>
                    <span>역할 부여 안내</span>
                    <p>
                        역할을 부여하면 해당 사용자는 즉시 전용 화면에 접근할 수
                        있습니다.
                    </p>
                </article>
            </div>

            <div className={styles.listPanel}>
                <div className={styles.listHeader}>
                    <div>
                        <h2>역할 부여 대기</h2>
                        <p>최근 가입한 사용자 순서로 표시됩니다.</p>
                    </div>
                    <span>{users.length} USERS</span>
                </div>

                {users.length === 0 ? (
                    <div className={styles.empty}>
                        <div aria-hidden="true">✓</div>
                        <h2>모든 역할 부여를 완료했어요</h2>
                        <p>새롭게 가입한 사용자가 생기면 이곳에 표시됩니다.</p>
                    </div>
                ) : (
                    <ul className={styles.userList}>
                        {users.map((user) => (
                            <li className={styles.userCard} key={user.id}>
                                <div className={styles.identity}>
                                    <div
                                        className={styles.avatar}
                                        aria-hidden="true"
                                    >
                                        {getInitial(user.name)}
                                    </div>
                                    <div className={styles.person}>
                                        <div className={styles.nameLine}>
                                            <strong>{user.name}</strong>
                                            <span>신규</span>
                                        </div>
                                        <a href={`mailto:${user.email}`}>
                                            {user.email}
                                        </a>
                                        <time
                                            dateTime={user.createdAt.toISOString()}
                                        >
                                            {formatJoinedAt(user.createdAt)} 가입
                                        </time>
                                    </div>
                                </div>

                                <dl className={styles.details}>
                                    <div>
                                        <dt>연락처</dt>
                                        <dd>{user.phone ?? "미입력"}</dd>
                                    </div>
                                    <div>
                                        <dt>학교·학년</dt>
                                        <dd>
                                            {formatSchool(
                                                user.schoolName,
                                                user.grade,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>주소</dt>
                                        <dd>{user.address ?? "미입력"}</dd>
                                    </div>
                                </dl>

                                <RoleAssignmentForm
                                    userId={user.id}
                                    userName={user.name}
                                    students={unlinkedStudents}
                                    hasStudentProfile={Boolean(
                                        user.studentProfile,
                                    )}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function getInitial(name: string) {
    return name.trim().charAt(0).toUpperCase() || "A";
}

function formatJoinedAt(date: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
    }).format(date);
}

function formatSchool(schoolName: string | null, grade: string | null) {
    if (!schoolName && !grade) return "미입력";
    if (!schoolName) return `${grade}학년`;
    if (!grade) return schoolName;
    return `${schoolName} · ${grade}학년`;
}
