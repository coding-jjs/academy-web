/**
 * 교사/직원 원생 리스트 (서버 컴포넌트).
 *
 * props: students, selectedStudentId, onSelect.
 * 직원 URL도 `StaffStudentsScreen` 경유로 재사용한다. 선택만 하고 저장하지 않는다.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { cx, surfaceStyles, typographyStyles } from "@/components/ui/shared-styles"; // 공유 UI 클래스. 로직이 아니다.
import type { StaffStudentRow } from "@/features/students/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 검색된 원생을 눌러 상세를 연다. */
export default function StaffStudentList({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    students, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    selectedStudentId, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    onSelect, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    students: StaffStudentRow[]; // students 필드.
    selectedStudentId: string | null; // selectedStudentId 필드.
    onSelect: (studentId: string) => void; // onSelect 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // JSX 반환. 교사 Screen. StaffDashboard는 교사 전용.
        <aside className={cx(surfaceStyles.root, styles.listPanel)}>{/* 교사·직원 공용 목록. 상태 전이는 원장만. */}
            {students.length === 0 ? ( // 스코프·검색 결과 없음. 저장 없음.
                <p className={typographyStyles.muted}>검색 결과가 없습니다.</p> // 문장.
            ) : ( // 눌러 상세. 교사·직원 공용. 상태 전이는 없다.
                <ul className={styles.list}>{/* 목록. */}
                    {students.map((student) => ( // 선택만. StaffStudentDetail이 연다.
                        <li key={student.id}>{/* 항목. */}
                            <button // 상세 열기. 원장 DirectorStudentTable이 아니다.
                                type="button" // type 필드.
                                className={ // 객체/블록 시작.
                                    student.id === selectedStudentId // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? styles.itemActive // 교사 Screen. StaffDashboard는 교사 전용.
                                        : styles.item // 교사 Screen. StaffDashboard는 교사 전용.
                                } // 블록 끝.
                                onClick={() => onSelect(student.id)} // onClick 필드.
                            >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                <strong>{student.name}</strong>{/* 강조. */}
                                <div className={styles.classChips}>{/* 레이아웃 상자. */}
                                    {student.classes.length > 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                        student.classes.map((academyClass) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                            <span key={academyClass.id}>{/* 인라인 표시. */}
                                                {academyClass.name}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                            </span> // span 닫기.
                                        )) // 구문 끝.
                                    ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                        <span>반 없음</span> // 인라인 표시.
                                    )}{/* 구문 끝. */}
                                </div>{/* div 닫기. */}
                                <div className={styles.itemMeta}>{/* 레이아웃 상자. */}
                                    <StatusChip // Google 연동 여부. 여기서 역할을 부여하지 않는다.
                                        tone={ // 객체/블록 시작.
                                            student.googleLinked // 교사 Screen. StaffDashboard는 교사 전용.
                                                ? "success" // 교사 Screen. StaffDashboard는 교사 전용.
                                                : "neutral" // 교사 Screen. StaffDashboard는 교사 전용.
                                        } // 블록 끝.
                                    >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        {student.googleLinked // 교사 Screen. StaffDashboard는 교사 전용.
                                            ? "연동" // 교사 Screen. StaffDashboard는 교사 전용.
                                            : "미연동"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                    <StatusChip>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
                                        학부모 {student.parents.length}명{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                            </button>{/* button 닫기. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </aside> // aside 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
