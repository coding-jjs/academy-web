/**
 * GUEST 역할 부여 UI (서버 컴포넌트).
 *
 * `/director/users`. props: users, unlinkedStudents — director-data.
 * 부여는 `RoleAssignmentForm` → `assignUserRole`. 이미 역할 있는 유저를 덮지 않는다.
 * 학생이면 미연결 원생 카드를 고르게 한다.
 */

import type { // 타입만. 런타임 로직이 아니다.
    PendingRoleUser, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    UnlinkedStudentOption, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/users/types"; // 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import RoleAssignmentForm from "./RoleAssignmentForm"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 대기 목록과 각 행의 역할 부여 폼을 그린다. */
export default function DirectorUsersScreen({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    users, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    unlinkedStudents, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    users: PendingRoleUser[]; // users 필드.
    unlinkedStudents: UnlinkedStudentOption[]; // unlinkedStudents 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 역할 대기 GUEST. 부트스트랩 API와 별개.
        <section className={screenStyles.animatedPage}>{/* 역할 대기 GUEST. 부트스트랩 API와 별개. */}
            <header className={pageHeadingStyles.root}>{/* 역할 대기 GUEST 수 */}
                <div>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.eyebrow}>NEW USERS</span>{/* 인라인 표시. */}
                    <h1>가입 사용자</h1>{/* 제목. */}
                    <p>가입 정보를 확인하고 학원에서 사용할 역할을 부여하세요.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.pendingBadge}>{/* 레이아웃 상자. */}
                    <span aria-hidden="true" />{/* 인라인 표시. */}
                    역할 대기<strong>{users.length}</strong>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.summary}>{/* 대기 인원·부여 안내 */}
                <article className={cx(surfaceStyles.soft, styles.summaryPrimary)}>{/* 역할 대기 GUEST. 부트스트랩 API와 별개. */}
                    <div className={styles.summaryIcon} aria-hidden="true">{/* 레이아웃 상자. */}
                        {users.length}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </div>{/* div 닫기. */}
                    <div>{/* 레이아웃 상자. */}
                        <span className={typographyStyles.muted}>현재 대기 인원</span>{/* 인라인 표시. */}
                        <strong>{users.length}명</strong>{/* 강조. */}
                        <p className={typographyStyles.hint}>{/* 문장. */}
                            Google 인증과 가입 정보 입력을 완료했습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}
                </article>{/* article 닫기. */}
                <article className={cx(surfaceStyles.soft, styles.guide)}>{/* 역할 대기 GUEST. 부트스트랩 API와 별개. */}
                    <span className={typographyStyles.muted}>역할 부여 안내</span>{/* 인라인 표시. */}
                    <p className={typographyStyles.hint}>{/* 문장. */}
                        역할을 부여하면 즉시 전용 화면에 접근할 수 있습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </p>{/* p 닫기. */}
                </article>{/* article 닫기. */}
            </div>{/* div 닫기. */}

            <div className={cx(surfaceStyles.soft, styles.listPanel)}>{/* 레이아웃 상자. */}
                <div className={styles.listHeader}>{/* 레이아웃 상자. */}
                    <div>{/* 레이아웃 상자. */}
                        <h2>역할 부여 대기</h2>{/* 소제목. */}
                        <p className={typographyStyles.hint}>{/* 문장. */}
                            최근 가입한 사용자 순서로 표시됩니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}
                    <span className={typographyStyles.muted}>{users.length} USERS</span>{/* 인라인 표시. */}
                </div>{/* div 닫기. */}

                {users.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <div className={cx(emptyStateStyles.root, styles.empty)}>{/* 대기 GUEST 없음 */}
                        <div aria-hidden="true">✓</div>{/* 레이아웃 상자. */}
                        <h2>모든 역할 부여를 완료했어요</h2>{/* 소제목. */}
                        <p className={typographyStyles.muted}>{/* 문장. */}
                            새롭게 가입한 사용자가 생기면 이곳에 표시됩니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p>{/* p 닫기. */}
                    </div> // div 닫기.
                ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <ul className={styles.userList}>{/* 각 행에 RoleAssignmentForm. 이미 역할 있는 유저는 여기 없다. */}
                        {users.map((user) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <li key={user.id} className={styles.userCard}>{/* 항목. */}
                                <div className={styles.identity}>{/* 레이아웃 상자. */}
                                    <div // 레이아웃 상자.
                                        className={styles.avatar} // className 필드.
                                        aria-hidden="true" // 원장 Screen. layout requireRole DIRECTOR.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        {user.name.trim().charAt(0) || "?"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </div>{/* div 닫기. */}
                                    <div className={styles.person}>{/* 레이아웃 상자. */}
                                        <div className={styles.nameLine}>{/* 레이아웃 상자. */}
                                            <strong>{user.name}</strong>{/* 강조. */}
                                            <span>NEW</span>{/* 인라인 표시. */}
                                        </div>{/* div 닫기. */}
                                        <a href={`mailto:${user.email}`}>{/* a. 원장 Screen. layout requireRole DIRECTOR. */}
                                            {user.email}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        </a>{/* a 닫기. */}
                                        <time dateTime={user.joinedAt}>{/* time. 원장 Screen. layout requireRole DIRECTOR. */}
                                            {new Date( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                user.joinedAt, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            ).toLocaleDateString("ko-KR", { // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                year: "numeric", // year 필드.
                                                month: "long", // month 필드.
                                                day: "numeric", // day 필드.
                                            })}{" "}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                            가입{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        </time>{/* time 닫기. */}
                                    </div>{/* div 닫기. */}
                                </div>{/* div 닫기. */}

                                <dl className={styles.details}>{/* dl. 원장 Screen. layout requireRole DIRECTOR. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <dt>연락처</dt>{/* dt. 원장 Screen. layout requireRole DIRECTOR. */}
                                        <dd>{user.phone ?? "미입력"}</dd>{/* dd. 원장 Screen. layout requireRole DIRECTOR. */}
                                    </div>{/* div 닫기. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <dt>주소</dt>{/* dt. 원장 Screen. layout requireRole DIRECTOR. */}
                                        <dd>{user.address ?? "미입력"}</dd>{/* dd. 원장 Screen. layout requireRole DIRECTOR. */}
                                    </div>{/* div 닫기. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <dt>학교·학년</dt>{/* dt. 원장 Screen. layout requireRole DIRECTOR. */}
                                        <dd>{/* dd. 원장 Screen. layout requireRole DIRECTOR. */}
                                            {formatStudentSchool( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                user.schoolName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                user.grade, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            )}{/* 구문 끝. */}
                                        </dd>{/* dd 닫기. */}
                                    </div>{/* div 닫기. */}
                                </dl>{/* dl 닫기. */}

                                <RoleAssignmentForm // RoleAssignmentForm. 원장 Screen. layout requireRole DIRECTOR.
                                    userId={user.id} // userId 필드.
                                    userName={user.name} // userName 필드.
                                    students={unlinkedStudents} // students 필드.
                                    hasStudentProfile={user.hasStudentProfile} // hasStudentProfile 필드.
                                />{/* 구문 끝. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </div>{/* div 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
