"use client";

import {
    type SyntheticEvent,
    useActionState,
    useEffect,
    useRef,
} from "react";
import {
    unlinkParentStudent,
    type ParentLinkState,
} from "@/features/families/actions";
import styles from "./page.module.css";

const initialState: ParentLinkState = {
    status: "idle",
    message: "",
};

export default function UnlinkParentStudentButton({
    linkId,
    parentName,
    studentName,
}: {
    linkId: string;
    parentName: string;
    studentName: string;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [state, formAction, pending] = useActionState(
        unlinkParentStudent,
        initialState,
    );

    useEffect(() => {
        if (state.status === "success") {
            dialogRef.current?.close();
        }
    }, [state.status]);

    function openDialog() {
        dialogRef.current?.showModal();
    }

    function closeDialog() {
        dialogRef.current?.close();
    }

    function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
        if (pending) {
            event.preventDefault();
        }
    }

    return (
        <>
            <button
                type="button"
                className={styles.unlinkTrigger}
                onClick={openDialog}
            >
                연결 해제
            </button>

            <dialog
                ref={dialogRef}
                className={styles.unlinkDialog}
                aria-labelledby={`unlink-title-${linkId}`}
                aria-describedby={`unlink-description-${linkId}`}
                onCancel={handleCancel}
            >
                <section className={styles.dialogCard}>
                    <header className={styles.dialogHeader}>
                        <div className={styles.warningIcon} aria-hidden="true">
                            !
                        </div>
                        <div className={styles.dialogHeading}>
                            <span className={styles.dangerLabel}>
                                DISCONNECT FAMILY
                            </span>
                            <h2 id={`unlink-title-${linkId}`}>
                                가족 연결을 해제할까요?
                            </h2>
                            <p id={`unlink-description-${linkId}`}>
                                연결 기록은 삭제하지 않고 해제 사유와 처리자를
                                함께 기록합니다.
                            </p>
                        </div>
                        <button
                            type="button"
                            className={styles.dialogClose}
                            onClick={closeDialog}
                            disabled={pending}
                            aria-label="연결 해제 창 닫기"
                        >
                            ×
                        </button>
                    </header>

                    <div className={styles.unlinkSummary}>
                        <div className={styles.unlinkPerson}>
                            <span>학부모</span>
                            <strong>{parentName}</strong>
                        </div>
                        <div className={styles.unlinkArrow} aria-hidden="true">
                            →
                        </div>
                        <div className={styles.unlinkPerson}>
                            <span>학생</span>
                            <strong>{studentName}</strong>
                        </div>
                    </div>

                    <div className={styles.unlinkNotice}>
                        <span aria-hidden="true">i</span>
                        <p>
                            학생의 재원 상태와 계정 역할은 유지됩니다. 학부모는
                            다른 연결된 자녀가 없을 때 게스트로 변경됩니다.
                        </p>
                    </div>

                    <form action={formAction} className={styles.unlinkForm}>
                        <input type="hidden" name="linkId" value={linkId} />
                        <label className={styles.reasonField}>
                            <span>
                                해제 사유 <small>필수</small>
                            </span>
                            <select
                                name="reason"
                                defaultValue=""
                                required
                                disabled={pending}
                            >
                                <option value="" disabled>
                                    해제 사유를 선택해 주세요
                                </option>
                                <option value="잘못된 연결">잘못된 연결</option>
                                <option value="보호자 변경">보호자 변경</option>
                                <option value="원장 수동 해제">
                                    기타 운영 사유
                                </option>
                            </select>
                        </label>

                        {state.status === "error" && (
                            <p className={styles.dialogError} role="alert">
                                <span aria-hidden="true">!</span>
                                {state.message}
                            </p>
                        )}

                        <footer className={styles.dialogActions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={closeDialog}
                                disabled={pending}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className={styles.dangerButton}
                                disabled={pending}
                            >
                                {pending && (
                                    <span
                                        className={styles.spinner}
                                        aria-hidden="true"
                                    />
                                )}
                                {pending ? "연결을 해제하는 중…" : "연결 해제"}
                            </button>
                        </footer>
                    </form>
                </section>
            </dialog>
        </>
    );
}
