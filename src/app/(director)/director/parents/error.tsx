"use client";

import { useEffect } from "react";
import {
    buttonStyles,
    cx,
    emptyStateStyles,
    pageHeadingStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import styles from "./page.module.css";

export default function DirectorParentsError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error("학부모 관리 페이지 조회 실패", error);
    }, [error]);

    return (
        <section className={cx(surfaceStyles.soft, emptyStateStyles.root, styles.errorState)}>
            <div className={styles.errorIcon} aria-hidden="true">
                !
            </div>
            <span className={cx(pageHeadingStyles.eyebrow, styles.errorEyebrow)}>
                DATA LOAD ERROR
            </span>
            <h1>학부모 정보를 불러오지 못했습니다</h1>
            <p className={typographyStyles.hint}>
                데이터베이스 연결 또는 일시적인 네트워크 문제일 수 있습니다.
                잠시 후 다시 시도해 주세요.
            </p>
            {error.digest && (
                <small className={cx(typographyStyles.muted, styles.errorReference)}>
                    오류 참조: {error.digest}
                </small>
            )}
            <button
                type="button"
                className={cx(buttonStyles.primaryLg, styles.errorRetry)}
                onClick={() => unstable_retry()}
            >
                다시 불러오기
            </button>
        </section>
    );
}
