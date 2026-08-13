"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type MouseEvent,
} from "react";
import {
    createNotice,
    deleteNotice,
    updateNotice,
} from "@/features/notices/actions";
import {
    NOTICE_PAGE_SIZE,
    filterNoticesByTitle,
    type Notice,
} from "@/features/notices/types";
import styles from "./NoticesScreen.module.css";

export default function NoticesScreen({
    initialNotices,
    canWrite = false,
}: {
    initialNotices: Notice[];
    canWrite?: boolean;
}) {
    const detailDialogRef = useRef<HTMLDialogElement>(null);
    const composeDialogRef = useRef<HTMLDialogElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [selected, setSelected] = useState<Notice | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(NOTICE_PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [draftTitle, setDraftTitle] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [composeError, setComposeError] = useState("");
    const [detailError, setDetailError] = useState("");

    useEffect(() => {
        setNotices(initialNotices);
    }, [initialNotices]);

    const filteredNotices = useMemo(
        () => filterNoticesByTitle(notices, searchQuery),
        [notices, searchQuery],
    );

    const visibleNotices = filteredNotices.slice(0, visibleCount);
    const hasMore = visibleCount < filteredNotices.length;

    useEffect(() => {
        setVisibleCount(NOTICE_PAGE_SIZE);
    }, [searchQuery]);

    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore) return;

        setIsLoadingMore(true);
        window.setTimeout(() => {
            setVisibleCount((current) =>
                Math.min(current + NOTICE_PAGE_SIZE, filteredNotices.length),
            );
            setIsLoadingMore(false);
        }, 280);
    }, [filteredNotices.length, hasMore, isLoadingMore]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: "160px 0px" },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, loadMore, visibleNotices.length]);

    function resetComposeForm() {
        setDraftTitle("");
        setDraftBody("");
        setComposeError("");
        setIsSubmitting(false);
    }

    function resetDetailState() {
        setSelected(null);
        setIsEditing(false);
        setDetailError("");
        setIsSubmitting(false);
    }

    function openNotice(notice: Notice) {
        setSelected(notice);
        setIsEditing(false);
        setDetailError("");
        detailDialogRef.current?.showModal();
    }

    function closeNotice() {
        detailDialogRef.current?.close();
    }

    function startEditing() {
        if (!selected) return;
        setDraftTitle(selected.title);
        setDraftBody(selected.body);
        setDetailError("");
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
        setDetailError("");
        setIsSubmitting(false);
    }

    function openCompose() {
        resetComposeForm();
        composeDialogRef.current?.showModal();
    }

    function closeCompose() {
        composeDialogRef.current?.close();
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (isSubmitting) return;
        if (event.target === event.currentTarget) {
            event.currentTarget.close();
        }
    }

    async function handleComposeSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const title = draftTitle.trim();
        const body = draftBody.trim();

        if (!title) {
            setComposeError("제목을 입력해 주세요.");
            return;
        }
        if (!body) {
            setComposeError("본문을 입력해 주세요.");
            return;
        }

        setIsSubmitting(true);
        setComposeError("");

        const result = await createNotice({ title, body });
        if (!result.ok) {
            setComposeError(result.message);
            setIsSubmitting(false);
            return;
        }

        setNotices((current) => [result.notice, ...current]);
        setVisibleCount((current) => Math.max(current, NOTICE_PAGE_SIZE));
        closeCompose();
    }

    async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected) return;

        const title = draftTitle.trim();
        const body = draftBody.trim();

        if (!title) {
            setDetailError("제목을 입력해 주세요.");
            return;
        }
        if (!body) {
            setDetailError("본문을 입력해 주세요.");
            return;
        }

        setIsSubmitting(true);
        setDetailError("");

        const result = await updateNotice({
            id: selected.id,
            title,
            body,
        });

        if (!result.ok) {
            setDetailError(result.message);
            setIsSubmitting(false);
            return;
        }

        setNotices((current) =>
            current.map((notice) =>
                notice.id === result.notice.id ? result.notice : notice,
            ),
        );
        setSelected(result.notice);
        setIsEditing(false);
        setIsSubmitting(false);
    }

    async function handleDelete() {
        if (!selected) return;

        const confirmed = window.confirm(
            `"${selected.title}" 공지를 삭제할까요?`,
        );
        if (!confirmed) return;

        setIsSubmitting(true);
        setDetailError("");

        const result = await deleteNotice({ id: selected.id });
        if (!result.ok) {
            setDetailError(result.message);
            setIsSubmitting(false);
            return;
        }

        setNotices((current) =>
            current.filter((notice) => notice.id !== selected.id),
        );
        closeNotice();
    }

    return (
        <main className={styles.page}>
            <header className={styles.topBar}>
                <Link href="/" className={styles.brand} aria-label="A학원 홈">
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </Link>
                <Link href="/" className={styles.backLink}>
                    메인으로
                </Link>
            </header>

            <section className={styles.content}>
                <header className={styles.heading}>
                    <div>
                        <span>NOTICE</span>
                        <h1>공지사항</h1>
                        <p>학원의 주요 안내와 일정을 확인합니다.</p>
                    </div>
                    <div className={styles.headingActions}>
                        <label className={styles.searchField}>
                            <span className={styles.searchLabel}>제목 검색</span>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="공지 제목 검색"
                                aria-label="공지 제목 검색"
                            />
                        </label>
                        {canWrite ? (
                            <button
                                type="button"
                                className={styles.writeBtn}
                                onClick={openCompose}
                            >
                                작성
                            </button>
                        ) : null}
                    </div>
                </header>

                {notices.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>등록된 공지가 없습니다</h2>
                        <p>
                            {canWrite
                                ? "작성 버튼으로 첫 공지를 등록해 보세요."
                                : "새로운 공지가 등록되면 이곳에 표시됩니다."}
                        </p>
                    </div>
                ) : filteredNotices.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>검색 결과가 없습니다</h2>
                        <p>다른 제목으로 다시 검색해 주세요.</p>
                    </div>
                ) : (
                    <>
                        <ul className={styles.list}>
                            {visibleNotices.map((notice) => (
                                <li key={notice.id}>
                                    <button
                                        type="button"
                                        className={styles.card}
                                        onClick={() => openNotice(notice)}
                                    >
                                        <div className={styles.cardTop}>
                                            <span className={styles.audience}>
                                                {notice.audience}
                                            </span>
                                            <time>{notice.date}</time>
                                        </div>
                                        <h2>{notice.title}</h2>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div
                            ref={loadMoreRef}
                            className={styles.loadMore}
                            aria-live="polite"
                        >
                            {hasMore ? (
                                <p>
                                    {isLoadingMore
                                        ? "공지를 불러오는 중…"
                                        : "아래로 스크롤하면 더 불러옵니다"}
                                </p>
                            ) : (
                                <p>
                                    전체 {filteredNotices.length}건을 모두
                                    확인했습니다
                                </p>
                            )}
                        </div>
                    </>
                )}
            </section>

            <dialog
                ref={detailDialogRef}
                className={styles.dialog}
                aria-labelledby="notice-dialog-title"
                onClose={resetDetailState}
                onClick={handleDialogClick}
            >
                {selected ? (
                    <section className={styles.dialogCard}>
                        <header className={styles.dialogHeader}>
                            <div className={styles.dialogHeading}>
                                <div className={styles.dialogMeta}>
                                    <span className={styles.audience}>
                                        {selected.audience}
                                    </span>
                                    <time>{selected.date}</time>
                                </div>
                                {!isEditing ? (
                                    <h2 id="notice-dialog-title">
                                        {selected.title}
                                    </h2>
                                ) : (
                                    <h2 id="notice-dialog-title">공지 수정</h2>
                                )}
                            </div>
                            <button
                                type="button"
                                className={styles.dialogClose}
                                onClick={closeNotice}
                                disabled={isSubmitting}
                                aria-label="공지 닫기"
                            >
                                ×
                            </button>
                        </header>

                        {isEditing ? (
                            <form
                                className={styles.composeForm}
                                onSubmit={handleUpdateSubmit}
                            >
                                <label className={styles.composeField}>
                                    제목
                                    <input
                                        type="text"
                                        value={draftTitle}
                                        onChange={(event) =>
                                            setDraftTitle(event.target.value)
                                        }
                                        placeholder="공지 제목을 입력하세요"
                                        maxLength={80}
                                        disabled={isSubmitting}
                                    />
                                </label>

                                <label className={styles.composeField}>
                                    본문
                                    <textarea
                                        value={draftBody}
                                        onChange={(event) =>
                                            setDraftBody(event.target.value)
                                        }
                                        placeholder="공지 내용을 입력하세요"
                                        rows={8}
                                        disabled={isSubmitting}
                                    />
                                </label>

                                {detailError ? (
                                    <p
                                        className={styles.composeError}
                                        role="alert"
                                    >
                                        {detailError}
                                    </p>
                                ) : null}

                                <footer className={styles.composeActions}>
                                    <button
                                        type="button"
                                        className={styles.composeCancel}
                                        onClick={cancelEditing}
                                        disabled={isSubmitting}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.composeSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "저장 중…" : "저장"}
                                    </button>
                                </footer>
                            </form>
                        ) : (
                            <>
                                <div className={styles.dialogBody}>
                                    {selected.body
                                        .split("\n")
                                        .map((line, index) =>
                                            line ? (
                                                <p
                                                    key={`${selected.id}-${index}`}
                                                >
                                                    {line}
                                                </p>
                                            ) : (
                                                <br
                                                    key={`${selected.id}-${index}`}
                                                />
                                            ),
                                        )}
                                </div>

                                {detailError ? (
                                    <p
                                        className={styles.detailError}
                                        role="alert"
                                    >
                                        {detailError}
                                    </p>
                                ) : null}

                                {canWrite ? (
                                    <footer className={styles.detailActions}>
                                        <button
                                            type="button"
                                            className={styles.deleteBtn}
                                            onClick={handleDelete}
                                            disabled={isSubmitting}
                                        >
                                            삭제
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.editBtn}
                                            onClick={startEditing}
                                            disabled={isSubmitting}
                                        >
                                            수정
                                        </button>
                                    </footer>
                                ) : null}
                            </>
                        )}
                    </section>
                ) : null}
            </dialog>

            {canWrite ? (
                <dialog
                    ref={composeDialogRef}
                    className={styles.dialog}
                    aria-labelledby="notice-compose-title"
                    onClose={resetComposeForm}
                    onClick={handleDialogClick}
                >
                    <section className={styles.dialogCard}>
                        <header className={styles.dialogHeader}>
                            <div className={styles.dialogHeading}>
                                <span className={styles.composeEyebrow}>
                                    WRITE NOTICE
                                </span>
                                <h2 id="notice-compose-title">공지 작성</h2>
                            </div>
                            <button
                                type="button"
                                className={styles.dialogClose}
                                onClick={closeCompose}
                                disabled={isSubmitting}
                                aria-label="작성 창 닫기"
                            >
                                ×
                            </button>
                        </header>

                        <form
                            className={styles.composeForm}
                            onSubmit={handleComposeSubmit}
                        >
                            <label className={styles.composeField}>
                                제목
                                <input
                                    type="text"
                                    value={draftTitle}
                                    onChange={(event) =>
                                        setDraftTitle(event.target.value)
                                    }
                                    placeholder="공지 제목을 입력하세요"
                                    maxLength={80}
                                    disabled={isSubmitting}
                                />
                            </label>

                            <label className={styles.composeField}>
                                본문
                                <textarea
                                    value={draftBody}
                                    onChange={(event) =>
                                        setDraftBody(event.target.value)
                                    }
                                    placeholder="공지 내용을 입력하세요"
                                    rows={8}
                                    disabled={isSubmitting}
                                />
                            </label>

                            {composeError ? (
                                <p className={styles.composeError} role="alert">
                                    {composeError}
                                </p>
                            ) : null}

                            <footer className={styles.composeActions}>
                                <button
                                    type="button"
                                    className={styles.composeCancel}
                                    onClick={closeCompose}
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className={styles.composeSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "등록 중…" : "등록"}
                                </button>
                            </footer>
                        </form>
                    </section>
                </dialog>
            ) : null}
        </main>
    );
}
