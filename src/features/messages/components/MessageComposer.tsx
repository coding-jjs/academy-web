"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

/**
 * 쪽지 작성 폼. 원장은 즉시 발송, 직원은 승인 요청으로 나간다.
 *
 * 호출: `MessagesScreen` 작성 탭.
 * 학부모 대상은 학생 계정이 아니라 연결된 학부모 userId만 고르고,
 * User id 해석은 `recipients.ts`에 맡긴다. 전체 선택이면 broadcast를 붙여 목록에 "전체 발송"이 뜬다.
 *
 * 의도적으로 하지 않는 일:
 * - 반 단위 선택 UI. 학생/학부모 체크만 보낸다.
 * - 수신 User id를 화면에서 계산하지 않음.
 *
 * 관련: `messages/actions.ts`, `presentation.ts`.
 */

import { useMemo, useState, useTransition } from "react"; // 파생 목록. 서버 where를 바꾸지 않는다.
import { useRouter } from "next/navigation"; // refresh. redirect 페이로드가 아니다.
import { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    directorSendMessage, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    submitMessageForApproval, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
} from "@/features/messages/actions"; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
import { MESSAGE_AUDIENCE_LABELS } from "@/features/messages/presentation"; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
import type { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    MessageParentOption, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    MessageRecipientOption, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
} from "@/features/messages/types"; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
import { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    buttonStyles, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    cx, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    fieldStyles, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    typographyStyles, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
} from "@/components/ui/shared-styles"; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
import styles from "../MessagesScreen.module.css"; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

type MessageMode = "director" | "staff"; // MessageMode 타입. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

type MessageComposerProps = { // MessageComposerProps 타입. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    mode: MessageMode; // director vs staff. 직원은 승인 버튼을 안 그린다.
    students: MessageRecipientOption[]; // students. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    onFeedback: (message: string) => void; // 부모 한 줄. 탭 전환 시 지운다.
};

/**
 * 쪽지 작곡기. mode에 따라 directorSendMessage 또는 submitMessageForApproval을 호출한다.
 */
export default function MessageComposer({ // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    mode, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    students, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    onFeedback, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
}: MessageComposerProps) { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const router = useRouter(); // router. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [isSending, startSending] = useTransition(); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [title, setTitle] = useState(""); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [content, setContent] = useState(""); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [audience, setAudience] = useState<"PARENT" | "STUDENT">("STUDENT"); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

    const parentOptions = useMemo(() => { // parentOptions. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        const byId = new Map< // byId. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            string, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            MessageParentOption & { childNames: string[] } // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        >(); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        for (const student of students) { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            for (const parent of student.parents ?? []) { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                const existing = byId.get(parent.userId); // 기존 행. 클라이언트가 studentId를 바꿔 가로채지 못하게.
                if (existing) { // 가드. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    if (!existing.childNames.includes(student.name)) { // 가드. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        existing.childNames.push(student.name); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    }
                } else { // else. 로직은 그대로.
                    byId.set(parent.userId, { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        userId: parent.userId, // PARENT User. 학생 userId는 체크 목록에 넣지 않는다.
                        name: parent.name, // name. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        childNames: [student.name], // childNames. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    });
                }
            }
        }
        return [...byId.values()].sort((a, b) => // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            a.name.localeCompare(b.name, "ko"), // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        );
    }, [students]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

    const selectableStudentIds = students.map((student) => student.id); // selectableStudentIds. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const selectableParentIds = parentOptions.map((parent) => parent.userId); // selectableParentIds. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const studentListLabel = mode === "director" ? "학생" : "담당 학생"; // studentListLabel. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const parentListLabel = "연결된 학부모"; // parentListLabel. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const emptyStudentLabel = // emptyStudentLabel. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        mode === "director" ? "학생이 없습니다." : "담당 학생이 없습니다."; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const emptyParentLabel = // emptyParentLabel. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        mode === "director" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            ? "학생과 연결된 학부모가 없습니다." // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            : "담당 학생과 연결된 학부모가 없습니다."; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const submitLabel = mode === "director" ? "즉시 발송" : "승인 요청"; // submitLabel. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

    function toggleId( // toggleId. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        id: string, // id. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        selected: string[], // selected. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        setSelected: (ids: string[]) => void, // setSelected. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    ) { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        setSelected( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            selected.includes(id) // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                ? selected.filter((item) => item !== id) // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                : [...selected, id], // 학부모는 userId, 학생은 원생 카드 id.
        );
    }

    function sendMessage() { // sendMessage. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        startSending(async () => { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            const broadcast = // 목록 요약 '전체 발송'. 수신 전원 플래그가 아니다.
                audience === "STUDENT" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    ? selectableStudentIds.length > 0 && // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                      selectedStudentIds.length === selectableStudentIds.length // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    : selectableParentIds.length > 0 && // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                      selectedParentIds.length === selectableParentIds.length; // 화면에 보이는 대상을 모두 체크했을 때만 목록 요약을 "전체 발송"으로.

            const payload = { // payload. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                title, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                content, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                audience, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                broadcast, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                ...(audience === "STUDENT" // 전개. 알 수 없는 키를 통과시키지 않는다.
                    ? { targetStudentIds: selectedStudentIds } // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    : { targetParentUserIds: selectedParentIds }), // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            } as const; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

            const result = // result. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                mode === "director" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    ? await directorSendMessage(payload) // SENT + 수신 행 즉시.
                    : await submitMessageForApproval(payload); // PENDING_APPROVAL. 수신 행 없음.

            onFeedback(result.message ?? (result.ok ? "완료" : "실패")); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            if (result.ok) { // 가드. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                setTitle(""); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                setContent(""); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                setSelectedStudentIds([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                setSelectedParentIds([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                router.refresh(); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            }
        });
    }

    const selectedCount = // selectedCount. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        audience === "STUDENT" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            ? selectedStudentIds.length // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            : selectedParentIds.length; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    const canSubmit = // canSubmit. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        title.trim() && content.trim() && selectedCount > 0 && !isSending; // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

    return ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        <div className={styles.composeSplit}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            <div // 제목·내용. 원장은 "즉시 발송", 직원은 "승인 요청".
                className={styles.composeMain} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                <label className={fieldStyles.root}> // label. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <span>제목</span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <input // input. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        value={title} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        onChange={(event) => setTitle(event.target.value)} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        maxLength={120} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        placeholder="쪽지 제목" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    /> // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                </label> // label 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                <label className={fieldStyles.root}> // label. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <span>본문</span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <textarea // textarea. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        value={content} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        onChange={(event) => setContent(event.target.value)} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        rows={12} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        placeholder="전달할 내용을 입력하세요" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    /> // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                </label> // label 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                <button // button. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    type="button" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    className={buttonStyles.primary} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    disabled={!canSubmit} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    onClick={sendMessage} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    {isSending ? "처리 중…" : submitLabel} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                </button> // button 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

            <aside // 학생 체크 또는 연결된 학부모 userId. 학생 계정은 학부모 목록에 없다.
                className={styles.composeSide} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
            > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                <label className={fieldStyles.root}> // label. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <span>수신 대상</span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <select // select. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        value={audience} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        onChange={(event) => { // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            setAudience( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                event.target.value as "PARENT" | "STUDENT", // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            );
                            setSelectedStudentIds([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            setSelectedParentIds([]); // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        }}
                    > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        <option value="STUDENT"> // option. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            {MESSAGE_AUDIENCE_LABELS.STUDENT} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        </option> // option 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        <option value="PARENT"> // option. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            {MESSAGE_AUDIENCE_LABELS.PARENT} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        </option> // option 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    </select> // select 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                </label> // label 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.

                {audience === "STUDENT" ? ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <div className={fieldStyles.root}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        <div className={styles.listHeader}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {studentListLabel} ({selectedStudentIds.length}/ // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {students.length}) // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            </span> // span 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <div className={styles.listActions}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                <button // button. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    type="button" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    className={styles.ghostBtn} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    onClick={() => // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        setSelectedStudentIds( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            selectableStudentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        )
                                    }
                                    disabled={students.length === 0} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    전체 선택 // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                </button> // button 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                <button // button. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    type="button" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    className={styles.ghostBtn} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    onClick={() => setSelectedStudentIds([])} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    disabled={selectedStudentIds.length === 0} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    전체 해제 // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                </button> // button 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        {students.length === 0 ? ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <p className={cx(typographyStyles.hint, styles.listEmpty)}>{emptyStudentLabel}</p> // p. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        ) : ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <ul className={styles.checkList}> // ul. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {students.map((student) => ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    <li key={student.id}> // li. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        <label className={styles.checkItem}> // label. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            <input // input. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                type="checkbox" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                checked={selectedStudentIds.includes( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    student.id, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                )}
                                                onChange={() => // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    toggleId( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        student.id, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        selectedStudentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        setSelectedStudentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    )
                                                }
                                            /> // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            <span>{student.name}</span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        </label> // label 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    </li> // li 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                ))}
                            </ul> // ul 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        )}
                    </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                ) : ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                    <div className={fieldStyles.root}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        <div className={styles.listHeader}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {parentListLabel} ({selectedParentIds.length}/ // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {parentOptions.length}) // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            </span> // span 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <div className={styles.listActions}> // div. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                <button // button. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    type="button" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    className={styles.ghostBtn} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    onClick={() => // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        setSelectedParentIds( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            selectableParentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        )
                                    }
                                    disabled={parentOptions.length === 0} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    전체 선택 // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                </button> // button 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                <button // button. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    type="button" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    className={styles.ghostBtn} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    onClick={() => setSelectedParentIds([])} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    disabled={selectedParentIds.length === 0} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                > // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    전체 해제 // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                </button> // button 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        {parentOptions.length === 0 ? ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <p className={cx(typographyStyles.hint, styles.listEmpty)}>{emptyParentLabel}</p> // p. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        ) : ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                            <ul className={styles.checkList}> // ul. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                {parentOptions.map((parent) => ( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    <li key={parent.userId}> // li. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        <label className={styles.checkItem}> // label. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            <input // input. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                type="checkbox" // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                checked={selectedParentIds.includes( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    parent.userId, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                )}
                                                onChange={() => // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    toggleId( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        parent.userId, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        selectedParentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        setSelectedParentIds, // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    )
                                                }
                                            /> // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            <span> // span. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                {parent.name} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                <small> // small. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    자녀:{" "} // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    {parent.childNames.join( // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                        ", ", // 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                                    )}
                                                </small> // small 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                            </span> // span 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                        </label> // label 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                    </li> // li 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                                ))}
                            </ul> // ul 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                        )}
                    </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
                )}
            </aside> // aside 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
        </div> // div 닫기. 작곡기. 원장 즉시 SENT, 직원은 승인 요청.
    );
}
