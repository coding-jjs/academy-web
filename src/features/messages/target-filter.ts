/**
 * Message.targetFilter Json을 안전한 객체로 파싱한다.
 *
 * 호출: 승인 시 `actions.ts`가 저장된 필터를 다시 읽고, `data.ts`가 목록 요약을 만든다.
 * 잘못된 형태는 null로 버려 승인 시 전원 발송이 되지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - DB에 쓰지 않음. 파싱만 한다.
 * - 알 수 없는 키를 통과시키지 않음. studentIds / parentUserIds / broadcast만.
 *
 * 관련: `types.ts`의 MessageTargetFilter.
 */

import type { MessageTargetFilter } from "@/features/messages/types"; // 파싱만. 수신 User id 해석은 recipients.ts.

/**
 * Prisma Json 값을 대상 필터로 바꾼다.
 * 배열이 비고 broadcast도 아니면 null — 빈 객체로 전원 발송하는 길을 막는다.
 */
export function parseTargetFilter(value: unknown): MessageTargetFilter | null { // 승인 때 다시 펼친다. 수신 행을 여기서 만들지 않는다.
    if (!value || typeof value !== "object" || Array.isArray(value)) return null; // 배열·문자열로 전원 발송하는 길을 막는다.
    const record = value as Record<string, unknown>; // 알 수 없는 키는 아래에서 버린다.
    const studentIds = Array.isArray(record.studentIds) // 학생 audience 체크 목록. 원생 카드 id.
        ? record.studentIds.filter( // 빈 문자열·숫자가 섞이면 버린다.
              (id): id is string => typeof id === "string" && id.trim().length > 0, // 원생 카드 id. User id가 아니다.
          )
        : undefined; // 키 없음. 빈 배열로 전원 발송하지 않는다.
    const parentUserIds = Array.isArray(record.parentUserIds) // 학부모 User id. 학생 계정이 아니다.
        ? record.parentUserIds.filter( // 학생 계정 id가 섞이면 승인 때 recipients가 거절.
              (id): id is string => // 문자열만. 원생 카드 id를 넣지 않는다.
                  typeof id === "string" && id.trim().length > 0, // 학부모 User id. 학생 계정 id가 섞이면 승인 때 recipients가 거절.
          )
        : undefined; // 키 없음.
    const broadcast = record.broadcast === true; // 목록 요약 "전체 발송"용. 수신 행을 전원에게 만드는 플래그가 아니다.

    if (!studentIds?.length && !parentUserIds?.length && !broadcast) { // 빈 객체로 전원 발송하지 않는다.
        return null; // 빈 객체로 전원 발송하지 않는다.
    }

    return { // 허용 키만. 알 수 없는 키는 버린다.
        ...(studentIds?.length ? { studentIds } : {}), // 학생 체크 목록. 승인 때 작성자 스코프로 다시 펼친다.
        ...(parentUserIds?.length ? { parentUserIds } : {}), // 학부모 User. 학생 계정은 recipients가 거절.
        ...(broadcast ? { broadcast: true } : {}), // 목록 요약만. 수신 create 플래그가 아니다.
    };
}

/** 목록 요약용 이름 나열. 비어 있으면 "대상 없음". */
export function formatTargetNames(names: string[]) { // 승인 큐·내 요청 한 줄. 수신 User id 목록이 아니다.
    if (names.length === 0) return "대상 없음"; // 체크가 비었을 때. 전원 발송으로 바꾸지 않는다.
    return names.join(", "); // 승인 큐·내 요청 목록 한 줄.
}
