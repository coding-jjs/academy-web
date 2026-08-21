/**
 * 원생 상세(최근 출석·성적·학습기록) (서버 컴포넌트).
 *
 * props: student, showLearningRecordForm, writableClassIds.
 * 상태 전이는 원장만. 기록 작성은 `LearningRecordForm`(클라이언트).
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    cx, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    panelStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    surfaceStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    typographyStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/components/ui/shared-styles"; // 교사 Screen. StaffDashboard는 교사 전용.
import type { StaffStudentRow } from "@/features/students/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import LearningRecordForm from "./LearningRecordForm"; // 같은 라우트 모듈. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    formatStudentRecordDate, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    LEARNING_RECORD_TYPE_LABELS, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    STUDENT_STATUS_METADATA, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/students/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 프로필 메타와 최근 기록을 보여 주고, 허용되면 작성 폼을 연다. */
export default function StaffStudentDetail({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    student, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    showLearningRecordForm, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    writableClassIds, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    student: StaffStudentRow; // student 필드.
    showLearningRecordForm: boolean; // showLearningRecordForm 필드.
    writableClassIds: Set<string>; // writableClassIds 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    const statusMetadata = STUDENT_STATUS_METADATA[student.status]; // 교사 Screen. StaffDashboard는 교사 전용.

    return ( // 담당 원생 상세. 상태 전이는 없다.
        <div className={styles.detail}>{/* 레이아웃 상자. */}
            <article className={cx(surfaceStyles.root, styles.panel)}>{/* 읽기만. 재원/휴원 전이는 원장 DirectorStudentDetail. */}
                <div className={panelStyles.headCompact}>{/* 레이아웃 상자. */}
                    <div>{/* 레이아웃 상자. */}
                        <h2>{student.name}</h2>{/* 소제목. */}
                        <p>{/* 문장. */}
                            {student.schoolName ?? "학교 미입력"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {student.grade ? ` · ${student.grade}` : ""}학년{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}
                    <StatusChip tone={statusMetadata.tone}>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
                        {statusMetadata.label}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    </StatusChip>{/* StatusChip 닫기. */}
                </div>{/* div 닫기. */}
                <ul className={styles.metaList}>{/* 목록. */}
                    <li>{/* 항목. */}
                        <strong>반</strong>{/* 강조. */}
                        <span>{/* 인라인 표시. */}
                            {student.classes.length > 0 // 교사 Screen. StaffDashboard는 교사 전용.
                                ? student.classes // 교사 Screen. StaffDashboard는 교사 전용.
                                      .map((academyClass) => academyClass.name) // 교사 Screen. StaffDashboard는 교사 전용.
                                      .join(", ") // 교사 Screen. StaffDashboard는 교사 전용.
                                : "—"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </span>{/* span 닫기. */}
                    </li>{/* li 닫기. */}
                    <li>{/* 항목. */}
                        <strong>Google</strong>{/* 강조. */}
                        <span>{/* 인라인 표시. */}
                            {student.googleLinked // 교사 Screen. StaffDashboard는 교사 전용.
                                ? (student.email ?? "연동") // 교사 Screen. StaffDashboard는 교사 전용.
                                : "미연동"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </span>{/* span 닫기. */}
                    </li>{/* li 닫기. */}
                    <li>{/* 항목. */}
                        <strong>학부모</strong>{/* 강조. */}
                        <span>{/* 인라인 표시. */}
                            {student.parents.length > 0 // 교사 Screen. StaffDashboard는 교사 전용.
                                ? student.parents // 교사 Screen. StaffDashboard는 교사 전용.
                                      .map( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                          (parent) => // 교사 Screen. StaffDashboard는 교사 전용.
                                              `${parent.name}${parent.relationship ? `(${parent.relationship})` : ""}`, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                      ) // 호출/그룹 끝.
                                      .join(", ") // 교사 Screen. StaffDashboard는 교사 전용.
                                : "—"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </span>{/* span 닫기. */}
                    </li>{/* li 닫기. */}
                </ul>{/* ul 닫기. */}
            </article>{/* article 닫기. */}

            {showLearningRecordForm && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <LearningRecordForm // createLearningRecord. 상태 전이는 없다.
                    key={student.id} // key 필드.
                    student={student} // student 필드.
                    writableClassIds={writableClassIds} // writableClassIds 필드.
                /> // 구문 끝.
            )}{/* 구문 끝. */}

            <div className={styles.grid}>{/* 레이아웃 상자. */}
                <RecentAttendance student={student} />{/* 출석·성적 미리보기. 쓰기는 각 업무 화면. */}
                <RecentGrades student={student} />{/* RecentGrades. 교사 Screen. StaffDashboard는 교사 전용. */}
            </div>{/* div 닫기. */}
            <RecentLearningRecords student={student} />{/* RecentLearningRecords. 교사 Screen. StaffDashboard는 교사 전용. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 최근 출석 칩 목록. 수정 불가. */
function RecentAttendance({ student }: { student: StaffStudentRow }) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // 담당 원생 상세. 상태 전이는 없다.
        <article className={cx(surfaceStyles.root, styles.panel)}>{/* 담당 원생 상세. 상태 전이는 없다. */}
            <div className={panelStyles.headCompact}>{/* 레이아웃 상자. */}
                <h2>최근 출결</h2>{/* 소제목. */}
            </div>{/* div 닫기. */}
            {student.recentAttendance.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={typographyStyles.muted}>기록 없음</p> // 최근 출결 없음
            ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <ul className={styles.simpleList}>{/* 목록. */}
                    {student.recentAttendance.map((attendance, index) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        <li key={`${attendance.startsAt}-${index}`}>{/* 항목. */}
                            <strong>{/* 강조. */}
                                { // 객체/블록 시작.
                                    ATTENDANCE_STATUS_METADATA[ // 교사 Screen. StaffDashboard는 교사 전용.
                                        attendance.status // 교사 Screen. StaffDashboard는 교사 전용.
                                    ].label // 교사 Screen. StaffDashboard는 교사 전용.
                                }{/* 블록 끝. */}
                            </strong>{/* strong 닫기. */}
                            <span>{/* 인라인 표시. */}
                                {attendance.className} ·{" "}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                {formatStudentRecordDate(attendance.startsAt)}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </span>{/* span 닫기. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 최근 성적 요약. 수정은 성적 화면. */
function RecentGrades({ student }: { student: StaffStudentRow }) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // 담당 원생 상세. 상태 전이는 없다.
        <article className={cx(surfaceStyles.root, styles.panel)}>{/* 담당 원생 상세. 상태 전이는 없다. */}
            <div className={panelStyles.headCompact}>{/* 레이아웃 상자. */}
                <h2>최근 성적</h2>{/* 소제목. */}
            </div>{/* div 닫기. */}
            {student.recentGrades.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={typographyStyles.muted}>기록 없음</p> // 최근 성적 없음
            ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <ul className={styles.simpleList}>{/* 목록. */}
                    {student.recentGrades.map((grade) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        <li key={grade.id}>{/* 항목. */}
                            <strong>{/* 강조. */}
                                {grade.score}/{grade.maxScore}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </strong>{/* strong 닫기. */}
                            <span>{/* 인라인 표시. */}
                                {grade.subject} · {grade.title}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </span>{/* span 닫기. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 최근 학습 기록 목록. 작성은 LearningRecordForm. */
function RecentLearningRecords({ student }: { student: StaffStudentRow }) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // 담당 원생 상세. 상태 전이는 없다.
        <article className={cx(surfaceStyles.root, styles.panel)}>{/* 담당 원생 상세. 상태 전이는 없다. */}
            <div className={panelStyles.headCompact}>{/* 레이아웃 상자. */}
                <h2>학습 기록</h2>{/* 소제목. */}
            </div>{/* div 닫기. */}
            {student.recentRecords.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={typographyStyles.muted}>{/* 학습 기록 없음 */}
                    등록된 학습 기록이 없습니다.{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </p> // p 닫기.
            ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <ul className={styles.simpleList}>{/* 목록. */}
                    {student.recentRecords.map((record) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        <li key={record.id}>{/* 항목. */}
                            <strong>{/* 강조. */}
                                {LEARNING_RECORD_TYPE_LABELS[record.type] ?? // 교사 Screen. StaffDashboard는 교사 전용.
                                    record.type}{" "}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                · {record.title}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </strong>{/* strong 닫기. */}
                            <span>{/* 인라인 표시. */}
                                {formatStudentRecordDate(record.recordDate)} ·{" "}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                {record.authorName}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </span>{/* span 닫기. */}
                            <p>{record.content}</p>{/* 문장. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
