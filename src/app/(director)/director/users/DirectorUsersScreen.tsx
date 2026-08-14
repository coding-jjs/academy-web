import type {
    PendingRoleUser,
    UnlinkedStudentOption,
} from "@/features/users/types";
import { formatStudentSchool } from "@/features/students/presentation";
import {
    cx,
    emptyStateStyles,
    pageHeadingStyles,
    screenStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import RoleAssignmentForm from "./RoleAssignmentForm";
import styles from "./page.module.css";

export default function DirectorUsersScreen({
    users,
    unlinkedStudents,
}: {
    users: PendingRoleUser[];
    unlinkedStudents: UnlinkedStudentOption[];
}) {
    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>NEW USERS</span>
                    <h1>가입 사용자</h1>
                    <p>가입 정보를 확인하고 학원에서 사용할 역할을 부여하세요.</p>
                </div>
                <div className={styles.pendingBadge}>
                    <span aria-hidden="true" />
                    역할 대기<strong>{users.length}</strong>
                </div>
            </header>

            <div className={styles.summary}>
                <article className={cx(surfaceStyles.soft, styles.summaryPrimary)}>
                    <div className={styles.summaryIcon} aria-hidden="true">
                        {users.length}
                    </div>
                    <div>
                        <span className={typographyStyles.muted}>현재 대기 인원</span>
                        <strong>{users.length}명</strong>
                        <p className={typographyStyles.hint}>
                            Google 인증과 가입 정보 입력을 완료했습니다.
                        </p>
                    </div>
                </article>
                <article className={cx(surfaceStyles.soft, styles.guide)}>
                    <span className={typographyStyles.muted}>역할 부여 안내</span>
                    <p className={typographyStyles.hint}>
                        역할을 부여하면 즉시 전용 화면에 접근할 수 있습니다.
                    </p>
                </article>
            </div>

            <div className={cx(surfaceStyles.soft, styles.listPanel)}>
                <div className={styles.listHeader}>
                    <div>
                        <h2>역할 부여 대기</h2>
                        <p className={typographyStyles.hint}>
                            최근 가입한 사용자 순서로 표시됩니다.
                        </p>
                    </div>
                    <span className={typographyStyles.muted}>{users.length} USERS</span>
                </div>

                {users.length === 0 ? (
                    <div className={cx(emptyStateStyles.root, styles.empty)}>
                        <div aria-hidden="true">✓</div>
                        <h2>모든 역할 부여를 완료했어요</h2>
                        <p className={typographyStyles.muted}>
                            새롭게 가입한 사용자가 생기면 이곳에 표시됩니다.
                        </p>
                    </div>
                ) : (
                    <ul className={styles.userList}>
                        {users.map((user) => (
                            <li key={user.id} className={styles.userCard}>
                                <div className={styles.identity}>
                                    <div
                                        className={styles.avatar}
                                        aria-hidden="true"
                                    >
                                        {user.name.trim().charAt(0) || "?"}
                                    </div>
                                    <div className={styles.person}>
                                        <div className={styles.nameLine}>
                                            <strong>{user.name}</strong>
                                            <span>NEW</span>
                                        </div>
                                        <a href={`mailto:${user.email}`}>
                                            {user.email}
                                        </a>
                                        <time dateTime={user.joinedAt}>
                                            {new Date(
                                                user.joinedAt,
                                            ).toLocaleDateString("ko-KR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}{" "}
                                            가입
                                        </time>
                                    </div>
                                </div>

                                <dl className={styles.details}>
                                    <div>
                                        <dt>연락처</dt>
                                        <dd>{user.phone ?? "미입력"}</dd>
                                    </div>
                                    <div>
                                        <dt>주소</dt>
                                        <dd>{user.address ?? "미입력"}</dd>
                                    </div>
                                    <div>
                                        <dt>학교·학년</dt>
                                        <dd>
                                            {formatStudentSchool(
                                                user.schoolName,
                                                user.grade,
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                <RoleAssignmentForm
                                    userId={user.id}
                                    userName={user.name}
                                    students={unlinkedStudents}
                                    hasStudentProfile={user.hasStudentProfile}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}