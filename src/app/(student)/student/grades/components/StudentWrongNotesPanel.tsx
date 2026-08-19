"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 본인 오답 노트 목록 (클라이언트).
 *
 * props: wrongNotes — 읽기 전용. 상태 변경·삭제 Action 없음.
 * 이미지는 http(s) 또는 상대경로만 렌더해 javascript: URL을 막는다.
 */

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react"; // 의존성. 학생 Screen. 본인 Student.userId만.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { formatGradeDate } from "@/features/grades/formatters"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import { WRONG_NOTE_STATUS_METADATA } from "@/features/grades/presentation"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import type { StudentGradesData, WrongNoteStatus } from "@/features/grades/types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import styles from "../StudentGradesScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const FILTERS = [["ALL", "전체"], ["OPEN", "복습 필요"], ["REVIEWED", "복습함"], ["MASTERED", "완료"]] as const; // 학생 Screen. 본인 Student.userId만.

/** 상태 필터와 선택한 오답 상세를 그린다. */
export default function StudentWrongNotesPanel({ wrongNotes }: { wrongNotes: StudentGradesData["wrongNotes"] }) { // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    const [filter, setFilter] = useState<"ALL" | WrongNoteStatus>("ALL"); // 본인 오답 열람. 상태 변경 Action 없음.
    const [activeWrongNoteId, setActiveWrongNoteId] = useState(wrongNotes[0]?.id ?? ""); // 본인 오답 열람. 상태 변경 Action 없음.
    const filteredWrongNotes = useMemo(() => filter === "ALL" ? wrongNotes : wrongNotes.filter((note) => note.status === filter), [filter, wrongNotes]); // 파생 값. 조회 범위를 넓히지 않는다.
    const activeWrongNote = filteredWrongNotes.find((note) => note.id === activeWrongNoteId) ?? filteredWrongNotes[0] ?? null; // 학생 Screen. 본인 Student.userId만.

    function selectFilter(nextFilter: "ALL" | WrongNoteStatus) { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
        setFilter(nextFilter); // 학생 Screen. 본인 Student.userId만.
        setActiveWrongNoteId(""); // 학생 Screen. 본인 Student.userId만.
    } // 블록 끝.

    return ( // 본인 오답 열람. 상태 변경 Action 없음.
        <>{/* 요소. 학생 Screen. 본인 Student.userId만. */}
            <div className={styles.filters}>{FILTERS.map(([id, label]) => <button key={id} type="button" className={filter === id ? styles.filterActive : styles.filterBtn} onClick={() => selectFilter(id)}>{label}</button>)}</div>{/* 복습 상태 */}
            {filteredWrongNotes.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                <div className={styles.empty}><h2>오답이 없습니다</h2><p>선택한 조건의 오답 노트가 없습니다.</p></div> // 조건에 맞는 오답 없음
            ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <aside className={styles.listPanel}><ul className={styles.list}>{filteredWrongNotes.map((note) => { const metadata = WRONG_NOTE_STATUS_METADATA[note.status]; return <li key={note.id}><button type="button" className={note.id === activeWrongNote?.id ? styles.itemActive : styles.item} onClick={() => setActiveWrongNoteId(note.id)}><div className={styles.itemTop}><strong>{note.subject ?? note.className ?? "오답"}{note.questionNo ? ` · ${note.questionNo}번` : ""}</strong><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip></div><span>{getWrongNotePreview(note.questionText, note.gradeTitle)}</span></button></li>; })}</ul></aside>{/* 오답 미리보기 */}
                    {activeWrongNote && ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <WrongNoteDetail wrongNote={activeWrongNote} /> // 문제·답·해설. 상태 변경 없음.
                    )}{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </> // 구문 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 문제·내 답·정답·해설·안전 URL 이미지만 보여 준다. */
function WrongNoteDetail({ wrongNote }: { wrongNote: StudentGradesData["wrongNotes"][number] }) { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
    const metadata = WRONG_NOTE_STATUS_METADATA[wrongNote.status]; // 학생 Screen. 본인 Student.userId만.
    return ( // 본인 오답 열람. 상태 변경 Action 없음.
        <article className={styles.detail}>{/* 본인 오답 열람. 상태 변경 Action 없음. */}
            <div className={styles.detailHead}><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip><h2>{wrongNote.subject ?? "오답"}{wrongNote.questionNo ? ` · ${wrongNote.questionNo}번` : ""}</h2><p>{formatGradeDate(wrongNote.createdAt)}{wrongNote.className ? ` · ${wrongNote.className}` : ""}</p></div>{/* javascript: URL 이미지는 isSafeImageUrl이 막는다. */}
            <div className={styles.qa}><div><span>문제</span><p>{wrongNote.questionText || "문제 텍스트 없음"}</p></div><div><span>내 답</span><p>{wrongNote.studentAnswer || "—"}</p></div><div><span>정답</span><p>{wrongNote.correctAnswer || "—"}</p></div>{wrongNote.explanation && <div><span>해설</span><p>{wrongNote.explanation}</p></div>}</div>{/* 레이아웃 상자. */}
            {wrongNote.imageUrls.length > 0 && <div className={styles.images}>{wrongNote.imageUrls.filter(isSafeImageUrl).map((url) => <img key={url} src={url} alt="오답 사진" />)}</div>}{/* 학생 Screen. 본인 Student.userId만. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 목록 미리보기. 본문이 없으면 성적 제목으로 대체. */
function getWrongNotePreview(questionText: string | null, gradeTitle: string | null) { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
    if (!questionText) return gradeTitle || "문제 내용 없음"; // 본문이 없으면 성적 제목으로.
    return questionText.length > 40 ? `${questionText.slice(0, 40)}…` : questionText; // 반환. 학생 Screen. 본인 Student.userId만.
} // 블록 끝.

/** http(s) 또는 사이트 상대경로만 허용. */
function isSafeImageUrl(url: string) { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
    try { // http(s) 또는 상대경로만. javascript: 차단.
        const parsed = new URL(url); // 학생 Screen. 본인 Student.userId만.
        return parsed.protocol === "https:" || parsed.protocol === "http:"; // 반환. 학생 Screen. 본인 Student.userId만.
    } catch { // 에러 UI. 내부 스택을 노출하지 않는다.
        return url.startsWith("/"); // 반환. 학생 Screen. 본인 Student.userId만.
    } // 블록 끝.
} // 블록 끝.
