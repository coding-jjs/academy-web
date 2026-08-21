"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

/**
 * /notices 공개 공지 목록 UI. 검색·무한 스크롤·상세를 담당한다.
 *
 * 호출: `app/notices/page.tsx`. 원장 세션이면 canWrite=true로 작성·수정·삭제를 연다.
 * 이미지 파일은 jpeg/png/webp만 accept하고, 용량·MIME 최종 검사는 서버 업로드(버킷 notices, 5MB)가 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 피드 뉴스 UI → `news/NewsScreen.tsx`.
 * - 로그인 없이 쓰기를 열지 않음. canWrite는 페이지가 DIRECTOR일 때만 true.
 *
 * 관련: `actions.ts`, `types.ts`.
 */

import Link from "next/link"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
import { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    useCallback, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    useEffect, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    useMemo, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    useRef, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    useState, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    type FormEvent, // FormEvent 타입. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    type MouseEvent, // MouseEvent 타입. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
} from "react"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
import { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    createNotice, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    deleteNotice, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    updateNotice, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
} from "@/features/notices/actions"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
import { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    NOTICE_PAGE_SIZE, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    filterNoticesByTitle, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    type Notice, // Notice 타입. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
} from "@/features/notices/types"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
import { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    a11yStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    buttonStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    cx, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    dialogStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    emptyStateStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    fieldStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    pageHeadingStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    screenStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    surfaceStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    typographyStyles, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
} from "@/components/ui/shared-styles"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
import styles from "./NoticesScreen.module.css"; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

const URL_REGEX = // URL_REGEX. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]\}])/gi; // 본문 URL. javascript: 는 isSafeExternalUrl이 거절.

function isSafeExternalUrl(url: string) { // isSafeExternalUrl. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    try { // 실패 시 범용 메시지. 스키마를 노출하지 않는다.
        const parsed = new URL(url); // parsed. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        return parsed.protocol === "https:" || parsed.protocol === "http:"; // javascript: 등은 거절.
    } catch { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        return false; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }
}

function toHref(raw: string) { // toHref. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const trimmed = raw.trim(); // trimmed. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    if (/^www\./i.test(trimmed)) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        return `https://${trimmed}`; // www. 로 시작하면 https:// 를 붙인다.
    }
    return trimmed; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
}

function renderTextWithLinks(text: string) { // renderTextWithLinks. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const parts = text.split(URL_REGEX); // parts. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    return parts.map((part, index) => { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        const href = toHref(part); // href. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        const looksLikeUrl = // looksLikeUrl. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            /^(https?:\/\/|www\.)/i.test(part) && isSafeExternalUrl(href); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        if (looksLikeUrl) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                <a // a. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    key={`link-${index}`} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    href={href} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    target="_blank" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    rel="noopener noreferrer" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    className={styles.inlineLink} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    {part} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                </a> // a 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            );
        }

        return <span key={`text-${index}`}>{part}</span>; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    });
}

/**
 * 공개 공지 목록. canWrite면 원장 작성/수정/삭제 다이얼로그를 연다.
 *
 * @param initialNotices 서버가 준 게시 목록. 바뀌면 로컬 state를 덮어 쓴다.
 */
export default function NoticesScreen({ // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    initialNotices, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    canWrite = false, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
}: { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    initialNotices: Notice[]; // initialNotices. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    canWrite?: boolean; // 원장만 true. 로그인 없이 쓰기를 열지 않는다.
}) { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const detailDialogRef = useRef<HTMLDialogElement>(null); // detailDialogRef. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const composeDialogRef = useRef<HTMLDialogElement>(null); // composeDialogRef. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const loadMoreRef = useRef<HTMLDivElement>(null); // loadMoreRef. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    const [notices, setNotices] = useState<Notice[]>(initialNotices); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [prevInitialNotices, setPrevInitialNotices] = // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        useState(initialNotices); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [selected, setSelected] = useState<Notice | null>(null); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [isEditing, setIsEditing] = useState(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [searchQuery, setSearchQuery] = useState(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [visibleCount, setVisibleCount] = useState(NOTICE_PAGE_SIZE); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [isLoadingMore, setIsLoadingMore] = useState(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [isSubmitting, setIsSubmitting] = useState(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    const [draftTitle, setDraftTitle] = useState(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [draftBody, setDraftBody] = useState(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [draftImage, setDraftImage] = useState<File | null>(null); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [removeExistingImage, setRemoveExistingImage] = useState(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [composeError, setComposeError] = useState(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const [detailError, setDetailError] = useState(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    if (initialNotices !== prevInitialNotices) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setPrevInitialNotices(initialNotices); // render 중 setState. 서버 목록이 새로 오면 로컬 추가/수정을 덮어 맞춘다.
        setNotices(initialNotices); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    const filteredNotices = useMemo( // filteredNotices. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        () => filterNoticesByTitle(notices, searchQuery), // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        [notices, searchQuery], // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    );

    const visibleNotices = filteredNotices.slice(0, visibleCount); // visibleNotices. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    const hasMore = visibleCount < filteredNotices.length; // hasMore. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    function handleSearchChange(value: string) { // handleSearchChange. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setSearchQuery(value); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setVisibleCount(NOTICE_PAGE_SIZE); // 1페이지부터. 이전 스크롤 오프셋을 유지하면 빈 화면이 된다.
    }

    const loadMore = useCallback(() => { // loadMore. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!hasMore || isLoadingMore) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        setIsLoadingMore(true); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        window.setTimeout(() => { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setVisibleCount((current) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                Math.min(current + NOTICE_PAGE_SIZE, filteredNotices.length), // 서버를 다시 치지 않는다. 이미 받은 공개 목록을 자른다.
            );
            setIsLoadingMore(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }, 280); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }, [filteredNotices.length, hasMore, isLoadingMore]); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    useEffect(() => { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        const target = loadMoreRef.current; // target. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!target || !hasMore) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const observer = new IntersectionObserver( // observer. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            (entries) => { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                if (entries[0]?.isIntersecting) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    loadMore(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                }
            },
            { rootMargin: "160px 0px" }, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        );

        observer.observe(target); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        return () => observer.disconnect(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }, [hasMore, loadMore, visibleNotices.length]); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

    function resetComposeForm() { // resetComposeForm. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftTitle(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftBody(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setComposeError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 미리보기 URL도 해제한다. 서버 파일은 건드리지 않는다.
        setRemoveExistingImage(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function resetDetailState() { // resetDetailState. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setSelected(null); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsEditing(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setRemoveExistingImage(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function openNotice(notice: Notice) { // openNotice. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setSelected(notice); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsEditing(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        detailDialogRef.current?.showModal(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function closeNotice() { // closeNotice. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        detailDialogRef.current?.close(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function startEditing() { // startEditing. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!selected) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftTitle(selected.title); // 기존 제목·본문을 폼에 채운다. 이미지는 새로 고를 때까지 유지.
        setDraftBody(selected.body); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setRemoveExistingImage(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsEditing(true); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function cancelEditing() { // cancelEditing. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsEditing(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setRemoveExistingImage(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function openCompose() { // openCompose. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        resetComposeForm(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        composeDialogRef.current?.showModal(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function closeCompose() { // closeCompose. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        composeDialogRef.current?.close(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) { // handleDialogClick. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (isSubmitting) return; // 제출 중이면 실수로 닫지 않는다.
        if (event.target === event.currentTarget) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            event.currentTarget.close(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }
    }

    function clearDraftImage() { // clearDraftImage. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftImage(null); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftPreviewUrl((current) => { // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            if (current) URL.revokeObjectURL(current); // createObjectURL 누수 방지. 미리보기만 지워도 서버 파일은 그대로다.
            return null; // 거절. 부분 저장하지 않는다.
        });
    }

    function handleImageChange(file: File | null) { // handleImageChange. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!file) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftImage(file); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDraftPreviewUrl(URL.createObjectURL(file)); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setRemoveExistingImage(false); // 새 파일을 고르면 기존 삭제 플래그를 끈다. MIME/5MB는 서버 버킷 notices.
    }

    async function handleComposeSubmit(event: FormEvent<HTMLFormElement>) { // handleComposeSubmit. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        event.preventDefault(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const title = draftTitle.trim(); // 제목. 서버가 길이를 다시 본다.
        const body = draftBody.trim(); // 본문. 공개 목록 공백 문구와 작성 DTO를 나눈다.

        if (!title) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setComposeError("제목을 입력해 주세요."); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }
        if (!body) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setComposeError("본문을 입력해 주세요."); // 용량·MIME은 서버 uploadNoticeImage(5MB jpeg/png/webp).
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }

        setIsSubmitting(true); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setComposeError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const result = await createNotice({ title, body, image: draftImage }); // 원장만. 이미지는 버킷 notices.
        if (!result.ok) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setComposeError(result.message); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }

        setNotices((current) => [result.notice, ...current]); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setVisibleCount((current) => Math.max(current, NOTICE_PAGE_SIZE)); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        closeCompose(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) { // handleUpdateSubmit. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        event.preventDefault(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!selected) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const title = draftTitle.trim(); // 제목. 서버가 길이를 다시 본다.
        const body = draftBody.trim(); // 본문. 공개 목록 공백 문구와 작성 DTO를 나눈다.

        if (!title) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setDetailError("제목을 입력해 주세요."); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }
        if (!body) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setDetailError("본문을 입력해 주세요."); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }

        setIsSubmitting(true); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const result = await updateNotice({ // result. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            id: selected.id, // id. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            title, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            body, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            image: draftImage, // 새 파일이 있으면 교체만. 삭제 플래그와 파일이 동시에 가면 서버는 업로드를 탄다.
            removeImage: removeExistingImage && !draftImage, // removeImage. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        });

        if (!result.ok) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setDetailError(result.message); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }

        setNotices((current) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            current.map((notice) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                notice.id === result.notice.id ? result.notice : notice, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            ),
        );
        setSelected(result.notice); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsEditing(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        clearDraftImage(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setRemoveExistingImage(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    async function handleDelete() { // handleDelete. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        if (!selected) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const confirmed = window.confirm( // confirmed. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            `"${selected.title}" 공지를 삭제할까요?`, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        );
        if (!confirmed) return; // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        setIsSubmitting(true); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        setDetailError(""); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

        const result = await deleteNotice({ id: selected.id }); // DB 행 후 notices 버킷 파일. 스토리지 실패여도 목록에서는 뺀다.
        if (!result.ok) { // 가드. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setDetailError(result.message); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            setIsSubmitting(false); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            return; // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        }

        setNotices((current) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            current.filter((notice) => notice.id !== selected.id), // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        );
        closeNotice(); // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    }

    return ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        <main className={cx(styles.page, screenStyles.animatedPage)}> // main. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            <header // 홈 링크. 로그인 없이 공개 목록 /notices.
                className={styles.topBar} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                <Link href="/" className={styles.brand} aria-label="A학원 홈"> // Link. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <span className={styles.brandMark}>A</span> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <strong>A학원</strong> // strong. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                </Link> // Link 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                <Link href="/" className={styles.backLink}> // Link. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    메인으로 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                </Link> // Link 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            </header> // header 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

            <section // 검색·작성(원장)·카드·무한 스크롤.
                className={styles.content} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                <header className={cx(pageHeadingStyles.root, styles.heading)}> // header. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <div> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <span className={pageHeadingStyles.eyebrow}>NOTICE</span> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <h1>공지사항</h1> // h1. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <p>학원의 주요 안내와 일정을 확인합니다.</p> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <div className={styles.headingActions}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <label className={cx(fieldStyles.root, styles.searchField)}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <span className={a11yStyles.srOnly}> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                제목 검색 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </span> // span 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <input // input. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                className={cx(fieldStyles.control, styles.searchInput)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                type="search" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                value={searchQuery} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    handleSearchChange(event.target.value) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                }
                                placeholder="공지 제목 검색" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                aria-label="공지 제목 검색" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        {canWrite ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                className={cx(buttonStyles.primary, styles.writeBtn)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                onClick={openCompose} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                작성 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                </header> // header 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                {notices.length === 0 ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <div className={cx(surfaceStyles.root, emptyStateStyles.root, styles.empty)}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <h2>등록된 공지가 없습니다</h2> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <p> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            {canWrite // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ? "작성 버튼으로 첫 공지를 등록해 보세요." // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                : "새로운 공지가 등록되면 이곳에 표시됩니다."} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                ) : filteredNotices.length === 0 ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <div className={cx(surfaceStyles.root, emptyStateStyles.root, styles.empty)}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <h2>검색 결과가 없습니다</h2> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <p>다른 제목으로 다시 검색해 주세요.</p> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                ) : ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <> // JSX. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <ul className={styles.list}> // ul. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            {visibleNotices.map((notice) => ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <li key={notice.id}> // li. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={cx(surfaceStyles.root, styles.card)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        onClick={() => openNotice(notice)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <div className={styles.cardTop}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            <span className={styles.audience}> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                {notice.audience} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            </span> // span 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            <time className={typographyStyles.muted}> // time. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                {notice.date} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            </time> // time 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <h2>{notice.title}</h2> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </li> // li 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            ))}
                        </ul> // ul 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                        <div // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            ref={loadMoreRef} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            className={styles.loadMore} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            aria-live="polite" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            {hasMore ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <p className={typographyStyles.muted}> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {isLoadingMore // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        ? "공지를 불러오는 중…" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        : "아래로 스크롤하면 더 불러옵니다"} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            ) : ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <p className={typographyStyles.muted}> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    전체 {filteredNotices.length}건을 모두 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    확인했습니다 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            )}
                        </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </> // 태그 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                )}
            </section> // section 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

            <dialog // 읽기 / 수정 폼. 이미지는 jpeg/png/webp, 5MB는 서버 버킷 notices.
                ref={detailDialogRef} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                className={dialogStyles.overlayWide} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                aria-labelledby="notice-dialog-title" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                onClose={resetDetailState} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                onClick={handleDialogClick} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                {selected ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <section className={dialogStyles.card}> // section. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <header className={dialogStyles.headerSimple}> // header. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <div className={styles.dialogHeading}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <div className={styles.dialogMeta}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <span className={styles.audience}> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {selected.audience} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </span> // span 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <time className={typographyStyles.muted}> // time. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {selected.date} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </time> // time 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                {!isEditing ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <h2 id="notice-dialog-title"> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {selected.title} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </h2> // h2 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <h2 id="notice-dialog-title">공지 수정</h2> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                )}
                            </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                className={dialogStyles.close} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                onClick={closeNotice} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                aria-label="공지 닫기" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                × // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        </header> // header 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                        {isEditing ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <form // form. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                className={cx(fieldStyles.form, styles.composeForm)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                onSubmit={handleUpdateSubmit} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <label className={fieldStyles.root}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    제목 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <input // input. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="text" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        value={draftTitle} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            setDraftTitle(event.target.value) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        }
                                        placeholder="공지 제목을 입력하세요" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        maxLength={80} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                <label className={fieldStyles.root}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    본문 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <textarea // textarea. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        value={draftBody} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            setDraftBody(event.target.value) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        }
                                        placeholder="공지 내용을 입력하세요" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        rows={8} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                <label className={cx(fieldStyles.root, styles.fileField)}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    이미지 (선택) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <input // input. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="file" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        accept="image/jpeg,image/png,image/webp" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            handleImageChange( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                event.target.files?.[0] ?? null, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            )
                                        }
                                    /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {draftPreviewUrl ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <div className={styles.imagePreview}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {/* eslint-disable-next-line @next/next/no-img-element */} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <img // img. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            src={draftPreviewUrl} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            alt="선택한 이미지 미리보기" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            className={cx( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                buttonStyles.cancelMuted, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                styles.imagePreviewAction, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            )}
                                            onClick={clearDraftImage} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            선택 취소 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {!draftPreviewUrl && // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                selected.imageUrl && // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                !removeExistingImage ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <div className={styles.imagePreview}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {/* eslint-disable-next-line @next/next/no-img-element */} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <img // img. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            src={selected.imageUrl} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            alt="현재 공지 이미지" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            className={cx( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                buttonStyles.cancelMuted, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                styles.imagePreviewAction, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            )}
                                            onClick={() => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                setRemoveExistingImage(true) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            }
                                            disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            기존 이미지 삭제 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {removeExistingImage && !draftPreviewUrl ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <p className={typographyStyles.hint}> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        저장 시 기존 이미지가 삭제됩니다. // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {detailError ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <p // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={typographyStyles.error} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        role="alert" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {detailError} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                <footer className={styles.composeActions}> // footer. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={buttonStyles.cancelMuted} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        onClick={cancelEditing} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        취소 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="submit" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={buttonStyles.primary} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {isSubmitting ? "저장 중…" : "저장"} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </footer> // footer 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </form> // form 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        ) : ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <> // JSX. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <div className={styles.dialogBody}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {selected.imageUrl ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img // img. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            className={styles.detailImage} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            src={selected.imageUrl} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            alt="" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {selected.body // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        .split("\n") // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        .map((line, index) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            line ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                <p // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                    key={`${selected.id}-${index}`} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                    {renderTextWithLinks(line)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            ) : ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                <br // br. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                    key={`${selected.id}-${index}`} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                                /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            ),
                                        )}
                                </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {detailError ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <p // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={cx(typographyStyles.error, styles.detailError)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        role="alert" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        {detailError} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                                {canWrite ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <footer className={styles.detailActions}> // footer. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            className={cx(buttonStyles.danger, styles.deleteBtn)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            onClick={handleDelete} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            삭제 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            className={buttonStyles.primary} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            onClick={startEditing} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            수정 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </footer> // footer 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </> // 태그 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        )}
                    </section> // section 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            </dialog> // dialog 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

            {canWrite ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                <dialog // 원장만. accept는 jpeg/png/webp, 용량은 서버 버킷 notices.
                    ref={composeDialogRef} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    className={dialogStyles.overlayWide} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    aria-labelledby="notice-compose-title" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    onClose={resetComposeForm} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    onClick={handleDialogClick} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    <section className={dialogStyles.card}> // section. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        <header className={dialogStyles.headerSimple}> // header. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <div className={styles.dialogHeading}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <span className={pageHeadingStyles.eyebrow}> // span. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    WRITE NOTICE // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </span> // span 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <h2 id="notice-compose-title">공지 작성</h2> // h2. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                className={dialogStyles.close} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                onClick={closeCompose} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                aria-label="작성 창 닫기" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                × // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        </header> // header 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                        <form // form. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            className={cx(fieldStyles.form, styles.composeForm)} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            onSubmit={handleComposeSubmit} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            <label className={fieldStyles.root}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                제목 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <input // input. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    type="text" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    value={draftTitle} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        setDraftTitle(event.target.value) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    }
                                    placeholder="공지 제목을 입력하세요" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    maxLength={80} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                            <label className={fieldStyles.root}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                본문 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <textarea // textarea. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    value={draftBody} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        setDraftBody(event.target.value) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    }
                                    placeholder="공지 내용을 입력하세요" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    rows={8} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                            <label className={cx(fieldStyles.root, styles.fileField)}> // label. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                이미지 (선택) // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <input // input. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    type="file" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    accept="image/jpeg,image/png,image/webp" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    onChange={(event) => // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        handleImageChange( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            event.target.files?.[0] ?? null, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        )
                                    }
                                /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </label> // label 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                            {draftPreviewUrl ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <div className={styles.imagePreview}> // div. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {/* eslint-disable-next-line @next/next/no-img-element */} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <img // img. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        src={draftPreviewUrl} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        alt="선택한 이미지 미리보기" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    /> // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        className={cx( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            buttonStyles.cancelMuted, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                            styles.imagePreviewAction, // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        )}
                                        onClick={clearDraftImage} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                        이미지 제거 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </div> // div 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                            {composeError ? ( // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <p className={typographyStyles.error} role="alert"> // p. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {composeError} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </p> // p 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.

                            <footer className={styles.composeActions}> // footer. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    type="button" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    className={buttonStyles.cancelMuted} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    onClick={closeCompose} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    취소 // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                <button // button. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    type="submit" // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    className={buttonStyles.primary} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    disabled={isSubmitting} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                > // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                    {isSubmitting ? "등록 중…" : "등록"} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                                </button> // button 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                            </footer> // footer 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                        </form> // form 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                    </section> // section 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
                </dialog> // dialog 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
            ) : null} // 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
        </main> // main 닫기. 공개 /notices UI. 원장만 작성. 이미지 5MB jpeg/png/webp.
    );
}
