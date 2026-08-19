"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학생 수신 쪽지 화면 (클라이언트).
 *
 * props: messages, unreadCount.
 * 전체 읽음은 `markAllMessagesRead`. 개별 읽음은 `StudentMessagesPanel` →
 * `markMessageRead`. 회신 폼은 없다.
 */

import { useTransition } from "react"; // 의존성. 학생 Screen. 본인 Student.userId만.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { markAllMessagesRead } from "@/features/messages/inbox-actions"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import type { InboxMessage } from "@/features/messages/inbox-types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import StudentMessagesPanel from "./components/StudentMessagesPanel"; // 같은 라우트 모듈. 학생 Screen. 본인 Student.userId만.
import styles from "./StudentInboxScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 헤더의 모두 읽음과 메시지 패널을 묶는다. */
export default function StudentInboxScreen({ // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    messages, // 구문. 학생 Screen. 본인 Student.userId만.
    unreadCount, // 구문. 학생 Screen. 본인 Student.userId만.
}: { // 구문. 학생 Screen. 본인 Student.userId만.
    messages: InboxMessage[]; // messages 필드.
    unreadCount: number; // unreadCount 필드.
}) { // 구문. 학생 Screen. 본인 Student.userId만.
    const [isMarkingAll, startMarkingAll] = useTransition(); // 전체 읽음 pending. 발송이 아니다.

    function markAllAsRead() { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
        startMarkingAll(async () => { // 구문. 학생 Screen. 본인 Student.userId만.
            await markAllMessagesRead(); // 전체 읽음. 회신 폼은 없다.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // JSX 반환. 학생 Screen. 본인 Student.userId만.
        <section className={styles.page}>{/* 학생 수신함. 교사 MessagesScreen 작성기가 아니다. */}
            <header className={styles.heading}>{/* 미읽음 칩 + 모두 읽음. */}
                <div>{/* 레이아웃 상자. */}
                    <span>MESSAGES</span>{/* 인라인 표시. */}
                    <h1>쪽지</h1>{/* 제목. */}
                    <p>선생님이 보낸 메시지를 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.headingActions}>{/* 레이아웃 상자. */}
                    {unreadCount > 0 && ( // 미읽음만 칩. 발송 큐가 아니다.
                        <StatusChip tone="warning">미읽음 {unreadCount}</StatusChip> // StatusChip. 학생 Screen. 본인 Student.userId만.
                    )}{/* 구문 끝. */}
                    <button // 전체 읽음. 회신·작성이 아니다.
                        type="button" // type 필드.
                        className={styles.secondaryBtn} // className 필드.
                        disabled={isMarkingAll || unreadCount === 0} // disabled 필드.
                        onClick={markAllAsRead} // onClick 필드.
                    >{/* 학생 Screen. 본인 Student.userId만. */}
                        {isMarkingAll ? "처리 중…" : "모두 읽음"}{/* 학생 Screen. 본인 Student.userId만. */}
                    </button>{/* button 닫기. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}
            <StudentMessagesPanel messages={messages} />{/* 개별 읽음은 패널. 회신 없음. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
