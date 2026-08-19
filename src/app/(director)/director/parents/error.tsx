"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * `/director/parents` 에러 바운더리 (클라이언트).
 *
 * 링크 쿼리가 실패하면 이 화면. `unstable_retry`로 데이터만 다시 가져온다.
 * 역할을 바꾸거나 링크를 쓰지 않는다.
 */

import { useEffect } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 조회 실패 안내와 다시 불러오기 버튼. */
export default function DirectorParentsError({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    error, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    unstable_retry, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    error: Error & { digest?: string }; // error 필드.
    unstable_retry: () => void; // unstable_retry 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    useEffect(() => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
        console.error("학부모 관리 페이지 조회 실패", error); // 조회 실패만. 링크를 쓰지 않는다.
    }, [error]); // 원장 Screen. layout requireRole DIRECTOR.

    return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
        <section className={cx(surfaceStyles.soft, emptyStateStyles.root, styles.errorState)}>{/* 데이터 로드 실패 안내. */}
            <div className={styles.errorIcon} aria-hidden="true">{/* 레이아웃 상자. */}
                !{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            <span className={cx(pageHeadingStyles.eyebrow, styles.errorEyebrow)}>{/* 인라인 표시. */}
                DATA LOAD ERROR{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </span>{/* span 닫기. */}
            <h1>학부모 정보를 불러오지 못했습니다</h1>{/* 제목. */}
            <p className={typographyStyles.hint}>{/* 문장. */}
                데이터베이스 연결 또는 일시적인 네트워크 문제일 수 있습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                잠시 후 다시 시도해 주세요.{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </p>{/* p 닫기. */}
            {error.digest && ( // Next digest만. 역할을 바꾸지 않는다.
                <small className={cx(typographyStyles.muted, styles.errorReference)}>{/* 보조 문장. */}
                    오류 참조: {error.digest}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </small> // small 닫기.
            )}{/* 구문 끝. */}
            <button // 데이터만 다시 가져온다. 역할을 바꾸지 않는다.
                type="button" // type 필드.
                className={cx(buttonStyles.primaryLg, styles.errorRetry)} // className 필드.
                onClick={() => unstable_retry()} // onClick 필드.
            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                다시 불러오기{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </button>{/* button 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
