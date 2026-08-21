"use client"; // 입력 셸. 저장 권한은 서버 actions.ts가 take:1로 다시 본다.

/**
 * 원장·직원 성적·오답 관리 화면. 학생을 고르면 해당 워크스페이스를 연다.
 *
 * 호출: `/director/grades`, `/teacher/grades`가 `getGradesManagementData` 결과를 넘긴다.
 * canManage가 아니면 입력 UI를 숨겨 권한 없는 직원이 폼을 보지 못하게 한다.
 *
 * 목록에서 고른 학생의 성적·오답만 패널에 넘긴다. 저장 권한 검사는 서버 `actions.ts`가 다시 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 뷰어 UI → 각 역할 화면.
 * - 권한 키를 클라이언트에서 해석하지 않음. canManage는 페이지가 계산한다.
 *
 * 관련: `StudentGradesWorkspace.tsx`, `data.ts`.
 */

import { useMemo, useState } from "react"; // 학생 선택·필터. 권한 키는 page가 계산.
import StatusChip from "@/components/ui/StatusChip"; // 명수 칩. 권한 칩이 아니다.
import StudentGradesWorkspace from "@/features/grades/components/StudentGradesWorkspace"; // 탭. 저장은 패널.
import type { // 입력 DTO. 뷰어 percent 없음.
    GradesGradeRow, // 고른 학생만 패널에 넘긴다.
    GradesStudentOption, // take:1 표시용 반.
    GradesWrongRow, // 입력 오답.
} from "@/features/grades/types"; // 입력 DTO. 학부모 뷰어와 나눈다.
import styles from "./GradesManagementScreen.module.css"; // 입력 셸 스타일.

type GradesManagementScreenProps = { // page가 넘긴다. 권한 키를 여기서 해석하지 않는다.
    students: GradesStudentOption[]; // 호출부 where 스코프. 여기서 넓히지 않는다.
    grades: GradesGradeRow[]; // 최근 200. 화면이 학생별로 다시 필터.
    wrongNotes: GradesWrongRow[]; // 최근 200.
    canManage: boolean; // page 계산. false면 폼을 숨긴다.
    maxAssessedDate: string; // 서버 오늘 KST. 평가일 상한.
    deniedMessage?: string; // canManage=false 안내.
};

/**
 * 성적 입력 셸. canManage=false면 폼 없이 안내만 보여 권한이 없는 직원이 입력을 시도하지 못하게 한다.
 *
 * @param maxAssessedDate 서버가 준 오늘(KST). 평가일 상한.
 */
export default function GradesManagementScreen({ // 학부모 뷰어가 아니다.
    students, // 스코프 안 목록.
    grades, // 전체 묶음. 고른 학생만 아래로.
    wrongNotes, // 전체 묶음.
    canManage, // page 계산. 클라이언트에서 권한 키를 해석하지 않는다.
    maxAssessedDate, // 오늘 KST.
    deniedMessage, // 권한 없음 문구.
}: GradesManagementScreenProps) { // 저장 권한은 서버가 take:1로 다시 본다.
    const [selectedStudentId, setSelectedStudentId] = useState( // 첫 학생 기본. 목록이 비면 "".
        students[0]?.id ?? "", // 첫 학생을 기본 선택. 목록이 비면 빈 문자열.
    );
    const selectedStudent = // 목록에서 고른 행. 저장 권한은 서버.
        students.find((student) => student.id === selectedStudentId) ?? // id 일치.
        students[0] ?? // id가 빠지면 첫 학생.
        null; // 목록 없음.

    const selectedStudentGrades = useMemo( // 고른 학생만. 전 원생 성적을 패널에 안 넘긴다.
        () => // 필터. 권한 검사가 아니다.
            grades.filter( // 고른 학생만.
                (grade) => grade.studentId === selectedStudent?.id, // 고른 학생만. 저장 권한은 서버가 다시 본다.
            ),
        [grades, selectedStudent?.id], // 선택 변경 시.
    );
    const selectedStudentWrongNotes = useMemo( // 고른 학생 오답만.
        () => // 필터.
            wrongNotes.filter( // 고른 학생만.
                (wrongNote) => wrongNote.studentId === selectedStudent?.id, // 저장 권한은 서버 take:1.
            ),
        [wrongNotes, selectedStudent?.id], // 선택 변경 시.
    );

    if (!canManage) { // 입력 UI 없이 안내만. canManage는 page가 계산한다.
        return ( // 폼을 숨긴다. 권한 없는 직원이 입력을 시도하지 못하게.
            <section // 입력 UI 없이 안내만. canManage는 page가 계산한다.
                className={styles.page} // 권한 없음 레이아웃.
            > // 권한 없음 페이지.
                <header className={styles.heading}> // 제목만. 학생 목록 없음.
                    <div> // 카피.
                        <span>GRADES</span> // 영문 라벨.
                        <h1>성적·오답</h1> // 화면 제목.
                        <p>{deniedMessage ?? "성적 입력 권한이 없습니다."}</p> // page 안내.
                    </div> // 카피 끝.
                </header> // 헤더 끝.
            </section> // 권한 없음 끝.
        );
    }

    return ( // 권한 있는 직원·원장만. 저장은 서버가 다시 본다.
        <section className={styles.page}> // 입력 셸. 학부모 뷰어가 아니다.
            <header // 제목. 권한 있는 직원·원장만 여기 온다.
                className={styles.heading} // 헤더.
            > // 헤더 열기.
                <div> // 카피.
                    <span>GRADES</span> // 영문 라벨.
                    <h1>성적·오답</h1> // 화면 제목.
                    <p>학생 성적을 기록하고 오답 노트를 관리합니다.</p> // 입력 안내. 뷰어 카피가 아니다.
                </div> // 카피 끝.
            </header> // 헤더 끝.

            {!selectedStudent ? ( // 스코프 안 학생이 없음.
                <p className={styles.hint}>표시할 학생이 없습니다.</p> // 빈 스코프. 타 반을 채우지 않는다.
            ) : ( // 학생 목록 + 워크스페이스.
                <div className={styles.layout}> // 목록|패널.
                    <article // 클릭하면 워크스페이스 key가 바뀌어 폼이 리셋된다.
                        className={styles.panel} // 학생 목록.
                    > // 목록 패널.
                        <div className={styles.panelHead}> // 제목+명수.
                            <h2>학생</h2> // 선택 목록.
                            <StatusChip>{students.length}명</StatusChip> // 스코프 안 수.
                        </div> // 목록 헤더 끝.
                        <ul className={styles.studentList}> // 클릭하면 폼 key 리셋.
                            {students.map((student) => ( // 스코프 안만.
                                <li key={student.id}> // 원생 카드.
                                    <button // 선택. 저장 권한은 서버 take:1.
                                        type="button" // 폼 submit이 아니다.
                                        className={ // 활성 행.
                                            student.id === selectedStudent.id // 고른 학생.
                                                ? styles.studentActive // 활성.
                                                : styles.studentBtn // 비활성.
                                        }
                                        onClick={() => // 워크스페이스 key가 바뀐다.
                                            setSelectedStudentId(student.id) // 폼 state를 버리기 위해 언마운트.
                                        }
                                    > // 학생 버튼.
                                        <strong>{student.name}</strong> // 출석 명단 이름.
                                        <small> // take:1 표시용 반. 권한 판정이 아니다.
                                            {student.className ?? "미배정"} // 활성 수강 없으면 미배정.
                                        </small> // 반 이름.
                                    </button> // 학생 버튼 끝.
                                </li> // 목록 행 끝.
                            ))}
                        </ul> // 목록 끝.
                    </article> // 목록 패널 끝.

                    <StudentGradesWorkspace // 고른 학생만. 저장은 패널이 actions.ts.
                        key={selectedStudent.id} // 학생을 바꾸면 폼 state를 버리기 위해 언마운트한다.
                        student={selectedStudent} // 표시용 classId. 권한은 서버.
                        grades={selectedStudentGrades} // 고른 학생 성적만.
                        wrongNotes={selectedStudentWrongNotes} // 고른 학생 오답만.
                        maxAssessedDate={maxAssessedDate} // 오늘 KST.
                    /> // 워크스페이스.
                </div> // 레이아웃 끝.
            )}
        </section> // 페이지 끝.
    );
}
