"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 자녀 출결 확인·결석 신청 UI (클라이언트).
 *
 * props: childList, activeChildId — parent-data.
 * 제출: `requestAbsence`. 출석 행을 만들지 않고 AbsenceRequest만 남긴다.
 * 교사가 출석 체크할 때 사유를 참고한다. 승인 워크플로는 없다.
 */

import { useActionState, useMemo } from "react"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { ParentAttendanceChild } from "@/features/attendance/parent-types"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    requestAbsence, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    type AbsenceState, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/attendance/parent-actions"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { writeParentChildCookie } from "@/features/families/parent-child-cooke"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentAttendanceScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const statusMeta = ATTENDANCE_STATUS_METADATA; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

const initialAbsence: AbsenceState = { status: "idle", message: "" }; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 예정 수업 목록과 미래 세션 결석 신청 폼을 그린다. */
export default function ParentAttendanceScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    activeChildId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList: ParentAttendanceChild[]; // childList 필드.
    activeChildId: string; // activeChildId 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const [state, formAction, pending] = useActionState( // Server Action 상태. 클라이언트에서 DB를 치지 않는다.
        requestAbsence, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        initialAbsence, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    ); // 호출/그룹 끝.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.

    const child = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList.find((item) => item.id === activeChildId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const requestableSessions = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        if (!child) return []; // 분기. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        return child.sessions.filter( // 미래 회차 + 아직 AbsenceRequest 없음. 출석 행은 만들지 않는다.
            (s) => new Date(s.startsAt) > new Date() && !s.absenceRequest, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        ); // 호출/그룹 끝.
    }, [child]); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    function selectChild(childId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        writeParentChildCookie(childId); // 쿠키 + URL. 권한 검증은 page의 resolveChild.
        router.replace(`/parent/attendance?childId=${childId}`); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    return ( // 결석 신청. 출석 행을 만들지 않는다.
        <section className={styles.page}>{/* 결석 신청. 출석 행을 만들지 않는다. */}
            <header className={styles.heading}>{/* 학부모 출결. 신청은 AbsenceRequest만. */}
                <div>{/* 레이아웃 상자. */}
                    <span>ATTENDANCE</span>{/* 인라인 표시. */}
                    <h1>출결·수업</h1>{/* 제목. */}
                    <p>자녀의 등하원 상태와 수업 일정을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            {childList.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 활성 링크 없음. GUEST로 떨어진 계정도 여기 안 온다. */}
                    <h2>연결된 자녀가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 연결을 완료하면 출결·일정이 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    {childList.length > 1 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.childSwitch}>{/* 쿠키+쿼리. 타인 원생 id는 resolveChild가 첫 자녀로. */}
                            {childList.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                    key={item.id} // key 필드.
                                    type="button" // type 필드.
                                    className={ // 객체/블록 시작.
                                        item.id === child?.id // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? styles.childActive // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : styles.childBtn // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    } // 블록 끝.
                                    onClick={() => selectChild(item.id)} // onClick 필드.
                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {item.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </button> // button 닫기.
                            ))}{/* 구문 끝. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    {child && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            <div className={styles.hero}>{/* 레이아웃 상자. */}
                                <StatusChip tone="neutral">오늘</StatusChip>{/* 출석 행이 없으면 미체크. 신청만 있어도 출결이 바뀌지 않는다. */}
                                {child.todayHighlight ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <h2>{/* 소제목. */}
                                            {child.todayHighlight.className}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </h2>{/* h2 닫기. */}
                                        <p>{/* 문장. */}
                                            {child.todayHighlight.timeLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {child.todayHighlight.classroom // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? ` · ${child.todayHighlight.classroom}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p>{/* p 닫기. */}
                                        {child.todayHighlight.status ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                tone={ // 객체/블록 시작.
                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        child.todayHighlight // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            .status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    ].tone // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                } // 블록 끝.
                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                { // 객체/블록 시작.
                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        child.todayHighlight // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            .status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    ].label // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                }{/* 블록 끝. */}
                                            </StatusChip> // StatusChip 닫기.
                                        ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <StatusChip>미체크</StatusChip> // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        )}{/* 구문 끝. */}
                                    </> // 구문 끝.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <h2>오늘 수업 없음</h2>{/* 소제목. */}
                                        <p>{/* 문장. */}
                                            {child.className // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? `${child.className} · ${child.name}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : child.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p>{/* p 닫기. */}
                                    </> // 구문 끝.
                                )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.metrics}>{/* 레이아웃 상자. */}
                                <article>{/* 결석 신청. 출석 행을 만들지 않는다. */}
                                    <span>출석</span>{/* 인라인 표시. */}
                                    <strong>{child.monthCounts.present}</strong>{/* 강조. */}
                                </article>{/* article 닫기. */}
                                <article>{/* 결석 신청. 출석 행을 만들지 않는다. */}
                                    <span>지각</span>{/* 인라인 표시. */}
                                    <strong>{child.monthCounts.late}</strong>{/* 강조. */}
                                </article>{/* article 닫기. */}
                                <article>{/* 결석 신청. 출석 행을 만들지 않는다. */}
                                    <span>결석</span>{/* 인라인 표시. */}
                                    <strong>{child.monthCounts.absent}</strong>{/* 강조. */}
                                </article>{/* article 닫기. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.grid}>{/* 레이아웃 상자. */}
                                <article className={styles.panel}>{/* 결석 신청. 출석 행을 만들지 않는다. */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>이번 주 일정</h2>{/* 소제목. */}
                                        <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {child.sessions.length}건{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                    </div>{/* div 닫기. */}
                                    {child.sessions.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p className={styles.muted}>{/* 문장. */}
                                            예정된 수업이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <ul className={styles.sessionList}>{/* 목록. */}
                                            {child.sessions.map((s) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={s.id}>{/* 항목. */}
                                                    <div>{/* 레이아웃 상자. */}
                                                        <strong>{/* 강조. */}
                                                            {s.className}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{/* 인라인 표시. */}
                                                            {s.timeLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {s.isToday // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? " · 오늘" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </span>{/* span 닫기. */}
                                                    </div>{/* div 닫기. */}
                                                    <div // 레이아웃 상자.
                                                        className={ // 객체/블록 시작.
                                                            styles.badges // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        } // 블록 끝.
                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        {s.attendanceStatus ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                tone={ // 객체/블록 시작.
                                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        s // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                            .attendanceStatus // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    ].tone // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                } // 블록 끝.
                                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                { // 객체/블록 시작.
                                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        s // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                            .attendanceStatus // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    ].label // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                }{/* 블록 끝. */}
                                                            </StatusChip> // StatusChip 닫기.
                                                        ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                예정{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            </StatusChip> // StatusChip 닫기.
                                                        )}{/* 구문 끝. */}
                                                        {s.absenceRequest && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <StatusChip tone="warning">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                결석 신청{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            </StatusChip> // StatusChip 닫기.
                                                        )}{/* 구문 끝. */}
                                                    </div>{/* div 닫기. */}
                                                </li> // li 닫기.
                                            ))}{/* 구문 끝. */}
                                        </ul> // ul 닫기.
                                    )}{/* 구문 끝. */}
                                </article>{/* article 닫기. */}

                                <article className={styles.panel}>{/* 결석 신청. 출석 행을 만들지 않는다. */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>사유 결석 신청</h2>{/* 소제목. */}
                                    </div>{/* div 닫기. */}
                                    <p className={styles.muted}>{/* AttendanceRecord를 만들지 않는다. 교사가 출결 저장 시 참고. */}
                                        신청은 알림 기록만 남기며, 출석 상태를{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        자동으로 바꾸지 않습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p>{/* p 닫기. */}

                                    {state.message && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p // 문장.
                                            className={ // 객체/블록 시작.
                                                state.status === "success" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    ? styles.success // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    : styles.error // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            } // 블록 끝.
                                            role="alert" // role 필드.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {state.message}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    )}{/* 구문 끝. */}

                                    <form // 결석 신청. 출석 행을 만들지 않는다.
                                        action={formAction} // action 필드.
                                        className={styles.form} // className 필드.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <input // 입력. 서버에서 다시 검증한다.
                                            type="hidden" // type 필드.
                                            name="studentId" // name 필드.
                                            value={child.id} // value 필드.
                                        />{/* 구문 끝. */}
                                        <label className={styles.field}>{/* 필드 라벨. */}
                                            <span>수업</span>{/* 인라인 표시. */}
                                            <select // 선택. 서버에서 다시 검증한다.
                                                name="sessionId" // name 필드.
                                                required // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                defaultValue="" // defaultValue 필드.
                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                <option value="" disabled>{/* 선택지. */}
                                                    선택{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                </option>{/* option 닫기. */}
                                                {requestableSessions.map( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    (s) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        <option // 선택지.
                                                            key={s.id} // key 필드.
                                                            value={s.id} // value 필드.
                                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {s.className} ·{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {s.timeLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </option> // option 닫기.
                                                    ), // 구문 끝.
                                                )}{/* 구문 끝. */}
                                            </select>{/* select 닫기. */}
                                        </label>{/* label 닫기. */}
                                        <label className={styles.field}>{/* 필드 라벨. */}
                                            <span>사유</span>{/* 인라인 표시. */}
                                            <textarea // 긴 입력. 서버에서 다시 검증한다.
                                                name="reason" // name 필드.
                                                rows={4} // rows 필드.
                                                required // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                maxLength={300} // maxLength 필드.
                                                placeholder="예: 병원 진료" // placeholder 필드.
                                            />{/* 구문 끝. */}
                                        </label>{/* label 닫기. */}
                                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                            type="submit" // type 필드.
                                            className={styles.primaryBtn} // className 필드.
                                            disabled={ // 객체/블록 시작.
                                                pending || // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                requestableSessions.length === 0 // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            } // 블록 끝.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {pending ? "신청 중…" : "결석 요청"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </button>{/* button 닫기. */}
                                    </form>{/* form 닫기. */}
                                </article>{/* article 닫기. */}
                            </div>{/* div 닫기. */}
                        </> // 구문 끝.
                    )}{/* 구문 끝. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
