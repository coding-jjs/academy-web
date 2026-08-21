"use client"; // 탭 UI. 저장은 각 패널이 actions.ts를 직접 친다.

/**
 * 선택한 학생의 성적/오답 탭 컨테이너.
 *
 * 호출: `GradesManagementScreen`이 학생 한 명을 넘긴다.
 * 탭을 바꿔도 학생 선택은 유지하고, 저장 결과 메시지만 패널 간에 공유한다.
 *
 * 의도적으로 하지 않는 일:
 * - 서버 저장 → 각 패널이 `actions.ts`를 직접 호출한다.
 * - 탭 전환 시 작성 중인 폼을 강제로 비우지 않음. hidden으로 유지한다.
 *
 * 관련: `GradeRecordsPanel.tsx`, `WrongNotesPanel.tsx`.
 */

import { useState } from "react"; // 탭·피드백. 학생 선택은 부모.
import GradeRecordsPanel from "@/features/grades/components/GradeRecordsPanel"; // 성적 입력. take:1 권한은 서버.
import WrongNotesPanel from "@/features/grades/components/WrongNotesPanel"; // 오답 입력. 저장은 actions.ts.
import type { // 입력 DTO. 뷰어 percent·imageUrls는 없다.
    GradesGradeRow, // 점수/만점. percent 없음.
    GradesStudentOption, // take:1 표시용 반. 권한은 서버.
    GradesWrongRow, // 입력 오답. imageUrls 없음.
} from "@/features/grades/types"; // 입력 DTO. 학부모 뷰어와 나눈다.
import styles from "../GradesManagementScreen.module.css"; // 입력 셸 스타일.

type StudentGradesWorkspaceProps = { // 한 학생. 목록에서 고른 행만.
    student: GradesStudentOption; // 표시용 classId. 쓰기 권한은 서버 take:1.
    grades: GradesGradeRow[]; // 고른 학생 성적만. 부모가 필터한다.
    wrongNotes: GradesWrongRow[]; // 고른 학생 오답만.
    maxAssessedDate: string; // 서버가 준 오늘 KST. 평가일 상한.
};

/**
 * 한 학생의 성적·오답 탭. 저장 메시지는 부모가 받아 탭 아래에 한 줄로 보여 준다.
 */
export default function StudentGradesWorkspace({ // 저장은 패널이 actions.ts를 친다.
    student, // 고른 원생. 권한 판정은 서버.
    grades, // 고른 학생 성적.
    wrongNotes, // 고른 학생 오답.
    maxAssessedDate, // 오늘 KST. UTC 자정이 아니다.
}: StudentGradesWorkspaceProps) { // hidden으로 탭을 바꿔도 폼을 유지.
    const [activeTab, setActiveTab] = useState<"grades" | "wrongNotes">( // 기본 성적. 학생 선택은 부모.
        "grades", // 첫 탭. 오답은 hidden으로 유지.
    );
    const [feedback, setFeedback] = useState<string | null>(null); // 저장 안내. 탭을 바꾸면 지운다.

    function selectTab(tab: "grades" | "wrongNotes") { // 폼을 비우지 않는다. hidden 유지.
        setActiveTab(tab); // 탭만 바꾼다. 학생 key는 부모가 바꾼다.
        setFeedback(null); // 이전 저장 안내를 지워 다른 패널 결과로 오해하지 않게 한다.
    }

    return ( // 입력 패널. 학부모 뷰어가 아니다.
        <article className={styles.panel}> // 한 학생 워크스페이스. 저장은 패널.
            <div // 학생 이름은 유지하고 성적/오답만 갈아끼운다.
                className={styles.panelHead} // 이름+탭. 권한 배너는 부모.
            > // 헤더 열기.
                <h2>{student.name}</h2> // 출석 명단 이름.
                <div className={styles.tabs}> // 성적/오답. 저장 Action은 각 패널.
                    <button // 성적 탭. 폼을 unmount하지 않는다.
                        type="button" // 폼 submit이 아니다.
                        className={ // 활성 칩. 서버 권한 칩이 아니다.
                            activeTab === "grades" // 성적 탭이면 강조.
                                ? styles.tabActive // 활성.
                                : styles.tab // 비활성. hidden으로 폼 유지.
                        }
                        onClick={() => selectTab("grades")} // 피드백만 지운다. 입력을 잃지 않는다.
                    > // 성적 버튼 열기.
                        성적 // 입력 탭. 뷰어 하이라이트 카드가 아니다.
                    </button> // 성적 탭 끝.
                    <button // 오답 탭. 성적 폼은 hidden으로 남긴다.
                        type="button" // 폼 submit이 아니다.
                        className={ // 활성 칩.
                            activeTab === "wrongNotes" // 오답 탭이면 강조.
                                ? styles.tabActive // 활성.
                                : styles.tab // 비활성.
                        }
                        onClick={() => selectTab("wrongNotes")} // 피드백만 지운다.
                    > // 오답 버튼 열기.
                        오답 // 입력 탭. 학생 뷰어 사진 URL이 아니다.
                    </button> // 오답 탭 끝.
                </div> // 탭 끝.
            </div> // 헤더 끝.

            <div hidden={activeTab !== "grades"}> // 숨겨도 폼 state 유지. unmount하지 않는다.
                <GradeRecordsPanel // hidden으로 유지해 탭을 바꿔도 작성 중인 입력을 잃지 않는다.
                    student={student} // 표시용 classId. 권한은 서버 take:1.
                    grades={grades} // 고른 학생만.
                    maxAssessedDate={maxAssessedDate} // 오늘 KST.
                    onFeedback={setFeedback} // 저장 안내를 탭 아래에.
                /> // 성적 패널.
            </div> // 성적 래퍼 끝.
            <div hidden={activeTab !== "wrongNotes"}> // 숨겨도 오답 폼 유지.
                <WrongNotesPanel // 저장은 actions.ts. 권한은 서버 take:1.
                    student={student} // 고른 원생.
                    grades={grades} // 오답-성적 연결 선택용.
                    wrongNotes={wrongNotes} // 고른 학생 오답만.
                    onFeedback={setFeedback} // 저장 안내.
                /> // 오답 패널.
            </div> // 오답 래퍼 끝.

            {feedback && <p className={styles.feedback}>{feedback}</p>} // 저장 결과. 탭 전환 시 지운다.
        </article> // 워크스페이스 끝.
    );
}
