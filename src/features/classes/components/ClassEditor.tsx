"use client"; // UI만. 쓰기는 classes/actions. 권한은 layout.

/**
 * 반 생성/수정과 회차 추가·취소 폼.
 *
 * 호출: `ClassesManagementScreen`이 선택 반 또는 생성 모드(null)로 렌더한다.
 * 저장은 `classes/actions` 서버 액션에 위임하고, 회차 입력은 KST datetime-local을 쓴다.
 * 서버가 `+09:00`으로 해석하므로 브라우저 타임존과 무관하게 학원 시각을 보낸다.
 *
 * 의도적으로 하지 않는 일:
 * - 수강생을 여기서 넣지 않는다 → 원장 원생 상세의 수강 추가.
 * - CANCELLED 회차를 목록에서 숨기지 않는다. 취소 버튼만 SCHEDULED에 둔다.
 *
 * 관련: `features/classes/actions.ts`, `date-time.ts`, `ClassList.tsx`.
 */

import { useState, useTransition } from "react"; // 폼 로컬 state. Prisma는 서버 액션.
import { useRouter } from "next/navigation"; // 성공 시 refresh. 클라이언트에서 목록을 안 고친다.
import StatusChip from "@/components/ui/StatusChip"; // 회차 상태·건수. 권한 칩이 아니다.
import { // DIRECTOR 쓰기. 이 컴포넌트는 권한을 다시 보지 않는다.
    cancelClassSession, // 행 삭제가 아니라 CANCELLED.
    createClass, // schedule Json은 서버가 빈 객체.
    createClassSession, // datetime-local → +09:00.
    updateClass, // 회차는 건드리지 않음.
} from "@/features/classes/actions"; // 원장 액션.
import { // 표시·기본값. DB Date를 파싱하지 않는다.
    formatClassSessionRange, // 목록 라벨 Asia/Seoul.
    getDefaultClassSessionRange, // 다음 정시~+1시간 KST 문자열.
} from "@/features/classes/date-time"; // 서버 parseKstDateTime과 짝.
import type { // props. data가 채운 행.
    ClassRow, // null이면 생성 모드.
    ClassSessionStatus, // SCHEDULED만 취소 버튼.
    TeacherOption, // DIRECTOR 없음.
} from "@/features/classes/types"; // 페이지가 넘긴 teachers.
import styles from "../ClassesManagementScreen.module.css"; // 패널·폼. ClassList와 공유.

const CLASS_SESSION_STATUS: Record< // 목록 칩. CANCELLED 행을 숨기지 않는다.
    ClassSessionStatus, // SCHEDULED/COMPLETED/CANCELLED.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip.
> = { // 취소 버튼은 SCHEDULED만.
    SCHEDULED: { label: "예정", tone: "warning" }, // 이 상태만 취소 버튼.
    COMPLETED: { label: "완료", tone: "success" }, // 취소 버튼 없음. 서버는 COMPLETED도 취소 가능.
    CANCELLED: { label: "취소", tone: "neutral" }, // 행을 숨기지 않는다. 삭제된 회차가 아님.
};

/**
 * @param academyClass null이면 생성 모드. id가 바뀌면 부모가 key로 리마운트한다.
 * @param teachers ACTIVE TEACHER/STAFF. 빈 값은 담당 미지정.
 * @param onFeedback 서버 액션 메시지를 페이지 하단에 표시.
 * @param onClassCreated 생성 성공 시 새 반을 선택 상태로 올린다.
 */
type ClassEditorProps = { // 수강생 추가는 원장 원생 상세.
    academyClass: ClassRow | null; // null이면 createClass.
    teachers: TeacherOption[]; // 담당 select.
    onFeedback: (message: string) => void; // 하단 p.
    onClassCreated: (classId: string) => void; // 생성 직후 회차 폼을 열게.
};

/**
 * 반 메타 저장과, 기존 반이면 회차 추가/취소 UI.
 *
 * @sideEffects 서버 액션 호출 후 `router.refresh()`. 로컬 state는 회차 입력값만.
 */
export default function ClassEditor({ // UI. 권한은 layout. 쓰기는 액션.
    academyClass, // 부모가 key로 리마운트.
    teachers, // DIRECTOR 옵션 없음.
    onFeedback, // 성공/실패 문장.
    onClassCreated, // createClass id.
}: ClassEditorProps) { // 수강 명단은 그리지 않는다.
    const router = useRouter(); // refresh로 서버 목록을 다시 읽는다.
    const [isSaving, startSaving] = useTransition(); // 저장 중 입력 비활성.
    const [className, setClassName] = useState(academyClass?.name ?? ""); // 생성 모드면 빈 이름.
    const [subject, setSubject] = useState(academyClass?.subject ?? "수학"); // 기본 과목. 서버가 1~60자 검사.
    const [teacherUserId, setTeacherUserId] = useState( // 빈 문자열은 담당 미지정.
        academyClass?.teacherUserId ?? "", // 빈 문자열은 담당 미지정. DIRECTOR는 옵션에 없다.
    );
    const [isActive, setIsActive] = useState(academyClass?.active ?? true); // 생성 시 활성. 비활성이면 회차 추가 거절.
    const [sessionRange, setSessionRange] = useState( // datetime-local 문자열. Date가 아니다.
        getDefaultClassSessionRange, // 다음 정시~+1시간 KST datetime-local.
    );
    const [classroom, setClassroom] = useState(""); // 선택. 빈 값은 서버가 null.

    function saveClass() { // create 또는 update. 회차는 건드리지 않는다.
        startSaving(async () => { // transition. 저장 중 버튼 비활성.
            const result = academyClass // null이면 생성.
                ? await updateClass({ // 기존 반 메타만. 회차는 그대로.
                      classId: academyClass.id, // 편집 중인 반.
                      name: className, // 서버가 1~80자.
                      subject, // 서버가 1~60자.
                      teacherUserId: teacherUserId || null, // 빈 값은 미지정.
                      active: isActive, // 비활성이면 이후 회차 생성이 거절된다.
                  })
                : await createClass({ // schedule Json은 서버가 빈 객체로 둔다.
                      name: className, // 1~80자.
                      subject, // 1~60자.
                      teacherUserId: teacherUserId || null, // schedule Json은 서버가 빈 객체로 둔다.
                  });

            onFeedback(result.message); // 하단 배너. redirect 없음.
            if (result.ok) { // 실패면 refresh하지 않는다.
                if (result.id) onClassCreated(result.id); // 생성 직후 그 반을 열어 일정을 넣게.
                router.refresh(); // data를 다시 읽어 목록·회차를 맞춘다.
            }
        });
    }

    function addClassSession() { // 생성 모드에서는 반을 먼저 만든다.
        if (!academyClass) return; // 생성 직후에는 반을 만든 뒤 일정을 넣는다.

        startSaving(async () => { // 서버가 +09:00 Instant로 저장.
            const result = await createClassSession({ // unique(반+시작) 충돌은 메시지.
                classId: academyClass.id, // 활성 반만 서버가 통과.
                startsAt: sessionRange.startsAt, // datetime-local 문자열. 서버가 +09:00으로 해석.
                endsAt: sessionRange.endsAt, // datetime-local.
                classroom, // 빈 값은 서버가 null.
            });

            onFeedback(result.message); // 하단 배너.
            if (result.ok) { // 실패면 입력값을 유지.
                setSessionRange(getDefaultClassSessionRange()); // 다음 정시로 리셋.
                setClassroom(""); // 강의실 입력 리셋.
                router.refresh(); // 회차 목록 30건을 다시 읽는다.
            }
        });
    }

    function cancelSession(sessionId: string) { // SCHEDULED 버튼만 노출.
        startSaving(async () => { // 행 삭제가 아니라 CANCELLED.
            const result = await cancelClassSession({ sessionId }); // 행 삭제가 아니라 CANCELLED. 출석·시간표 이력 보존.
            onFeedback(result.message); // 하단 배너.
            if (result.ok) router.refresh(); // 목록에 취소 칩이 남는다.
        });
    }

    return ( // 수강생 폼 없음. 원장 원생 상세에서 넣는다.
        <article className={styles.panel}> // 오른쪽 패널. 권한 검사 없음.
            <div className={styles.panelHead}> // 생성/수정 제목.
                <h2>{academyClass ? "반 수정" : "반 만들기"}</h2> // null이면 생성 모드.
            </div> // panelHead 끝.

            <div className={styles.form}> // 반 메타. 회차는 아래 ClassSessionManager.
                <label className={styles.field}> // 반 이름. 서버 1~80자.
                    <span>반 이름</span> // 필드 라벨.
                    <input // 저장 중 비활성.
                        value={className} // 로컬 state.
                        onChange={(event) => setClassName(event.target.value)} // 서버 검증은 저장 시.
                        disabled={isSaving} // transition 중.
                        placeholder="예: 중2 수학 A" // 안내.
                    /> // 이름 input 끝.
                </label> // 이름 필드 끝.
                <label className={styles.field}> // 과목. 서버 1~60자.
                    <span>과목</span> // 필드 라벨.
                    <input // 기본 "수학".
                        value={subject} // 로컬 state.
                        onChange={(event) => setSubject(event.target.value)} // 저장 시 서버 검사.
                        disabled={isSaving} // transition 중.
                    /> // 과목 input 끝.
                </label> // 과목 필드 끝.
                <label className={styles.field}> // 담당. DIRECTOR는 옵션에 없다.
                    <span>담당</span> // 출결 own/other 판정.
                    <select // 빈 값은 미지정.
                        value={teacherUserId} // ""면 서버 null.
                        onChange={(event) => // 옵션 id.
                            setTeacherUserId(event.target.value) // 빈 값 허용.
                        }
                        disabled={isSaving} // transition 중.
                    > // TEACHER/STAFF만.
                        <option value="">미지정</option> // teacherUserId null.
                        {teachers.map((teacher) => ( // data가 ACTIVE만 채움.
                            <option key={teacher.id} value={teacher.id}> // User.id.
                                {teacher.name} ( // 동명이인 구분.
                                {teacher.role === "TEACHER" ? "선생님" : "직원"}) // STAFF도 담당 가능.
                            </option> // 담당 옵션 끝.
                        ))}
                    </select> // 담당 select 끝.
                </label> // 담당 필드 끝.
                {academyClass && ( // 생성 모드에는 활성 체크가 없다. 서버가 active:true.
                    <label className={styles.check}> // 비활성이면 이후 회차 생성이 거절.
                        <input // 기존 회차는 남긴다.
                            type="checkbox" // active 플래그.
                            checked={isActive} // 로컬. 저장 시 updateClass.
                            onChange={(event) => setIsActive(event.target.checked)} // boolean.
                            disabled={isSaving} // transition 중.
                        /> // 활성 체크 끝.
                        활성 반 // false면 createClassSession 거절.
                    </label> // 활성 필드 끝.
                )}
                <button // 이름 없으면 저장 안 함.
                    type="button" // form submit이 아니다.
                    className={styles.primaryBtn} // 저장.
                    disabled={isSaving || !className.trim()} // 빈 이름은 서버도 거절.
                    onClick={saveClass} // create 또는 update.
                > // 생성/수정 라벨.
                    {isSaving // transition 중 문구.
                        ? "처리 중…" // 저장 중.
                        : academyClass // 기존 반이면 저장.
                          ? "반 저장" // updateClass.
                          : "반 만들기"} // createClass.
                </button> // 저장 버튼 끝.
            </div> // 메타 폼 끝.

            {academyClass && ( // 생성 직후에는 반을 만든 뒤 일정을 넣는다.
                <ClassSessionManager // 기존 반만. 수강생은 원장 원생 상세에서 넣는다.
                    academyClass={academyClass} // 기존 반만. 수강생은 원장 원생 상세에서 넣는다.
                    sessionRange={sessionRange} // KST datetime-local.
                    classroom={classroom} // 선택.
                    isSaving={isSaving} // 입력 비활성.
                    onSessionRangeChange={setSessionRange} // 시작/종료.
                    onClassroomChange={setClassroom} // 강의실.
                    onAddSession={addClassSession} // 비활성 반은 버튼 disabled.
                    onCancelSession={cancelSession} // SCHEDULED만 버튼.
                /> // ClassSessionManager 끝.
            )}
        </article> // panel 끝.
    );
}

/** 활성 반만 수업 추가 가능. 취소는 SCHEDULED 행의 버튼만 노출. */
function ClassSessionManager({ // 수강 추가 UI가 아니다. 회차만.
    academyClass, // sessions는 CANCELLED 포함.
    sessionRange, // datetime-local. 서버가 +09:00.
    classroom, // 선택.
    isSaving, // transition.
    onSessionRangeChange, // 시작/종료 각각.
    onClassroomChange, // 강의실.
    onAddSession, // createClassSession.
    onCancelSession, // cancelClassSession.
}: { // 부모 ClassEditor state.
    academyClass: ClassRow; // 비활성이면 추가 버튼 disabled.
    sessionRange: { startsAt: string; endsAt: string }; // KST 문자열.
    classroom: string; // 빈 값은 서버 null.
    isSaving: boolean; // 저장 중.
    onSessionRangeChange: (range: { startsAt: string; endsAt: string }) => void; // 구간.
    onClassroomChange: (classroom: string) => void; // 강의실.
    onAddSession: () => void; // 활성 반만.
    onCancelSession: (sessionId: string) => void; // SCHEDULED만 호출.
}) { // 그리드는 ClassSession. schedule Json이 아니다.
    return ( // 조각. 패널 헤더는 부모가 이미 열었다.
        <> // 일정 폼 + 목록.
            <div className={styles.panelHead}> // 회차 섹션 제목.
                <h2>수업 일정</h2> // ClassSession. 반복 슬롯이 아니다.
                <StatusChip>{academyClass.sessions.length}건</StatusChip> // CANCELLED 포함 30건 상한.
            </div> // panelHead 끝.
            <div className={styles.form}> // 새 회차. 비활성 반은 버튼만 막는다.
                <label className={styles.field}> // 시작. 브라우저 TZ가 아니라 학원 시각.
                    <span>시작 (KST)</span> // 서버 parseKstDateTime이 +09:00을 붙인다.
                    <input // datetime-local. Date 객체가 아니다.
                        type="datetime-local" // YYYY-MM-DDTHH:mm.
                        value={sessionRange.startsAt} // 서버 parseKstDateTime이 +09:00을 붙인다.
                        onChange={(event) => // 종료는 그대로.
                            onSessionRangeChange({ // 구간 객체.
                                ...sessionRange, // 종료 유지.
                                startsAt: event.target.value, // KST 문자열.
                            })
                        }
                        disabled={isSaving} // transition 중.
                    /> // 시작 input 끝.
                </label> // 시작 필드 끝.
                <label className={styles.field}> // 종료. 서버가 startsAt보다 늦은지 본다.
                    <span>종료 (KST)</span> // +09:00 Instant.
                    <input // datetime-local.
                        type="datetime-local" // YYYY-MM-DDTHH:mm.
                        value={sessionRange.endsAt} // KST 문자열.
                        onChange={(event) => // 시작은 그대로.
                            onSessionRangeChange({ // 구간 객체.
                                ...sessionRange, // 시작 유지.
                                endsAt: event.target.value, // KST 문자열.
                            })
                        }
                        disabled={isSaving} // transition 중.
                    /> // 종료 input 끝.
                </label> // 종료 필드 끝.
                <label className={styles.field}> // 선택. 빈 값은 null.
                    <span>강의실 (선택)</span> // classroom.
                    <input // 텍스트.
                        value={classroom} // 로컬.
                        onChange={(event) => // 빈 문자열 허용.
                            onClassroomChange(event.target.value) // 서버가 trim||null.
                        }
                        disabled={isSaving} // transition 중.
                        placeholder="예: 301호" // 안내.
                    /> // 강의실 input 끝.
                </label> // 강의실 필드 끝.
                <button // 비활성 반은 서버도 거절.
                    type="button" // submit 아님.
                    className={styles.primaryBtn} // 수업 추가.
                    disabled={isSaving || !academyClass.active} // 비활성 반은 서버도 거절.
                    onClick={onAddSession} // createClassSession.
                > // 저장 중 문구.
                    {isSaving ? "처리 중…" : "수업 추가"} // SCHEDULED 회차.
                </button> // 추가 버튼 끝.
            </div> // 회차 폼 끝.

            <ul className={styles.sessionList}> // CANCELLED를 숨기지 않는다.
                {academyClass.sessions.length === 0 ? ( // 빈 반.
                    <li className={styles.hint}>등록된 수업이 없습니다.</li> // 생성 직후.
                ) : ( // 최신 30건. data take.
                    academyClass.sessions.map((classSession) => { // CANCELLED도 칩만.
                        const statusMetadata = // 라벨·톤.
                            CLASS_SESSION_STATUS[classSession.status]; // SCHEDULED만 버튼.

                        return ( // 한 회차 행.
                            <li key={classSession.id} className={styles.sessionRow}> // 삭제 행이 아님.
                                <div> // 시각·강의실.
                                    <strong> // Asia/Seoul 구간.
                                        {formatClassSessionRange( // UTC ISO → 서울 라벨.
                                            classSession.startsAt, // ISO.
                                            classSession.endsAt, // 목록은 Asia/Seoul 구간 문자열.
                                        )}
                                    </strong> // 시각 끝.
                                    <small> // 강의실.
                                        {classSession.classroom ?? "강의실 미정"} // null이면 미정.
                                    </small> // 강의실 끝.
                                </div> // 왼쪽 끝.
                                <div className={styles.rowSide}> // 칩과 취소.
                                    <StatusChip tone={statusMetadata.tone}> // 예정/완료/취소.
                                        {statusMetadata.label} // CANCELLED도 보여 준다.
                                    </StatusChip> // 상태 칩 끝.
                                    {classSession.status === "SCHEDULED" && ( // COMPLETED는 버튼 없음. 서버는 가능.
                                        <button // 행을 지우지 않는다.
                                            type="button" // submit 아님.
                                            className={styles.secondaryBtn} // 취소.
                                            disabled={isSaving} // transition 중.
                                            onClick={() => // sessionId만.
                                                onCancelSession(classSession.id) // CANCELLED이며 행을 지우지 않는다.
                                            }
                                        > // 라벨.
                                            취소 // 시간표 data는 이후 이 회차를 안 가져온다.
                                        </button> // 취소 버튼 끝.
                                    )}
                                </div> // rowSide 끝.
                            </li> // sessionRow 끝.
                        );
                    })
                )}
            </ul> // sessionList 끝.
        </> // fragment 끝.
    );
}
