"use client";

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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    cancelClassSession,
    createClass,
    createClassSession,
    updateClass,
} from "@/features/classes/actions";
import {
    formatClassSessionRange,
    getDefaultClassSessionRange,
} from "@/features/classes/date-time";
import type {
    ClassRow,
    ClassSessionStatus,
    TeacherOption,
} from "@/features/classes/types";
import styles from "../ClassesManagementScreen.module.css";

const CLASS_SESSION_STATUS: Record<
    ClassSessionStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    SCHEDULED: { label: "예정", tone: "warning" },
    COMPLETED: { label: "완료", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

/**
 * @param academyClass null이면 생성 모드. id가 바뀌면 부모가 key로 리마운트한다.
 * @param teachers ACTIVE TEACHER/STAFF. 빈 값은 담당 미지정.
 * @param onFeedback 서버 액션 메시지를 페이지 하단에 표시.
 * @param onClassCreated 생성 성공 시 새 반을 선택 상태로 올린다.
 */
type ClassEditorProps = {
    academyClass: ClassRow | null;
    teachers: TeacherOption[];
    onFeedback: (message: string) => void;
    onClassCreated: (classId: string) => void;
};

/**
 * 반 메타 저장과, 기존 반이면 회차 추가/취소 UI.
 *
 * @sideEffects 서버 액션 호출 후 `router.refresh()`. 로컬 state는 회차 입력값만.
 */
export default function ClassEditor({
    academyClass,
    teachers,
    onFeedback,
    onClassCreated,
}: ClassEditorProps) {
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [className, setClassName] = useState(academyClass?.name ?? "");
    const [subject, setSubject] = useState(academyClass?.subject ?? "수학");
    const [teacherUserId, setTeacherUserId] = useState(
        academyClass?.teacherUserId ?? "",
    );
    const [isActive, setIsActive] = useState(academyClass?.active ?? true);
    const [sessionRange, setSessionRange] = useState(
        getDefaultClassSessionRange,
    );
    const [classroom, setClassroom] = useState("");

    function saveClass() {
        startSaving(async () => {
            const result = academyClass
                ? await updateClass({
                      classId: academyClass.id,
                      name: className,
                      subject,
                      teacherUserId: teacherUserId || null,
                      active: isActive,
                  })
                : await createClass({
                      name: className,
                      subject,
                      teacherUserId: teacherUserId || null,
                  });

            onFeedback(result.message);
            if (result.ok) {
                if (result.id) onClassCreated(result.id);
                router.refresh();
            }
        });
    }

    function addClassSession() {
        if (!academyClass) return;

        startSaving(async () => {
            const result = await createClassSession({
                classId: academyClass.id,
                startsAt: sessionRange.startsAt,
                endsAt: sessionRange.endsAt,
                classroom,
            });

            onFeedback(result.message);
            if (result.ok) {
                setSessionRange(getDefaultClassSessionRange());
                setClassroom("");
                router.refresh();
            }
        });
    }

    function cancelSession(sessionId: string) {
        startSaving(async () => {
            const result = await cancelClassSession({ sessionId });
            onFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}>
                <h2>{academyClass ? "반 수정" : "반 만들기"}</h2>
            </div>
            <div className={styles.form}>
                <label className={styles.field}>
                    <span>반 이름</span>
                    <input
                        value={className}
                        onChange={(event) => setClassName(event.target.value)}
                        disabled={isSaving}
                        placeholder="예: 중2 수학 A"
                    />
                </label>
                <label className={styles.field}>
                    <span>과목</span>
                    <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>담당</span>
                    <select
                        value={teacherUserId}
                        onChange={(event) =>
                            setTeacherUserId(event.target.value)
                        }
                        disabled={isSaving}
                    >
                        <option value="">미지정</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.name} (
                                {teacher.role === "TEACHER" ? "선생님" : "직원"})
                            </option>
                        ))}
                    </select>
                </label>
                {academyClass && (
                    <label className={styles.check}>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                            disabled={isSaving}
                        />
                        활성 반
                    </label>
                )}
                <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={isSaving || !className.trim()}
                    onClick={saveClass}
                >
                    {isSaving
                        ? "처리 중…"
                        : academyClass
                          ? "반 저장"
                          : "반 만들기"}
                </button>
            </div>
            {academyClass && (
                <ClassSessionManager
                    academyClass={academyClass}
                    sessionRange={sessionRange}
                    classroom={classroom}
                    isSaving={isSaving}
                    onSessionRangeChange={setSessionRange}
                    onClassroomChange={setClassroom}
                    onAddSession={addClassSession}
                    onCancelSession={cancelSession}
                />
            )}
        </article>
    );
}

/** 활성 반만 수업 추가 가능. 취소는 SCHEDULED 행의 버튼만 노출. */
function ClassSessionManager({
    academyClass,
    sessionRange,
    classroom,
    isSaving,
    onSessionRangeChange,
    onClassroomChange,
    onAddSession,
    onCancelSession,
}: {
    academyClass: ClassRow;
    sessionRange: { startsAt: string; endsAt: string };
    classroom: string;
    isSaving: boolean;
    onSessionRangeChange: (range: { startsAt: string; endsAt: string }) => void;
    onClassroomChange: (classroom: string) => void;
    onAddSession: () => void;
    onCancelSession: (sessionId: string) => void;
}) {
    return (
        <>
            <div className={styles.panelHead}>
                <h2>수업 일정</h2>
                <StatusChip>{academyClass.sessions.length}건</StatusChip>
            </div>
            <div className={styles.form}>
                <label className={styles.field}>
                    <span>시작 (KST)</span>
                    <input
                        type="datetime-local"
                        value={sessionRange.startsAt}
                        onChange={(event) =>
                            onSessionRangeChange({
                                ...sessionRange,
                                startsAt: event.target.value,
                            })
                        }
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>종료 (KST)</span>
                    <input
                        type="datetime-local"
                        value={sessionRange.endsAt}
                        onChange={(event) =>
                            onSessionRangeChange({
                                ...sessionRange,
                                endsAt: event.target.value,
                            })
                        }
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>강의실 (선택)</span>
                    <input
                        value={classroom}
                        onChange={(event) =>
                            onClassroomChange(event.target.value)
                        }
                        disabled={isSaving}
                        placeholder="예: 301호"
                    />
                </label>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={isSaving || !academyClass.active}
                    onClick={onAddSession}
                >
                    {isSaving ? "처리 중…" : "수업 추가"}
                </button>
            </div>
            <ul className={styles.sessionList}>
                {academyClass.sessions.length === 0 ? (
                    <li className={styles.hint}>등록된 수업이 없습니다.</li>
                ) : (
                    academyClass.sessions.map((classSession) => {
                        const statusMetadata =
                            CLASS_SESSION_STATUS[classSession.status];

                        return (
                            <li key={classSession.id} className={styles.sessionRow}>
                                <div>
                                    <strong>
                                        {formatClassSessionRange(
                                            classSession.startsAt,
                                            classSession.endsAt,
                                        )}
                                    </strong>
                                    <small>
                                        {classSession.classroom ?? "강의실 미정"}
                                    </small>
                                </div>
                                <div className={styles.rowSide}>
                                    <StatusChip tone={statusMetadata.tone}>
                                        {statusMetadata.label}
                                    </StatusChip>
                                    {classSession.status === "SCHEDULED" && (
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            disabled={isSaving}
                                            onClick={() =>
                                                onCancelSession(classSession.id)
                                            }
                                        >
                                            취소
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </>
    );
}
