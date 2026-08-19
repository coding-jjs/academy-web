import "server-only"; // 조회만. 감지는 lib/churn-detect.

/**
 * 재원 학생별 최신 이탈 케이스와 임계값 설정을 원장 화면에 넘긴다.
 *
 * 호출: `(director)/director/churn/page.tsx`.
 * `status: ENROLLED`만 스캔한다. 케이스 없는 학생도 목록에 남겨 신호 없음까지 한 화면에서 본다.
 *
 * 의도적으로 하지 않는 일:
 * - 신호 4종 계산 → `runChurnDetection` → `@/lib/churn-detect`.
 * - 상태 전이·쪽지 → `actions.ts`.
 *
 * 관련: `types.ts`, `presentation.ts`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma.
import { CHURN_SIGNAL_LABELS } from "@/features/churn/presentation"; // 신호 4종 한글.
import type { // 화면 DTO.
    ChurnSignalType, // 4신호.
    ChurnThreshold, // id=1 설정.
    DirectorChurnCase, // 명단 행.
} from "@/features/churn/types"; // ENROLLED 스캔.

/** summary가 있으면 그걸, 없으면 최근 신호 3건을 라벨·값으로 이어 붙인다. */
function describeChurnSignals( // 계산식이 아니라 표시 문장.
    signals: { type: ChurnSignalType; value: { toString(): string } | null }[], // 최근 3건.
    summary: string | null, // 감지기 문장.
) { // reason 문자열.
    if (summary?.trim()) return summary; // 감지기가 남긴 문장이 있으면 그걸 우선한다.
    if (signals.length === 0) return "신호 없음"; // 케이스만 있고 신호 행이 없을 때.

    return signals // 라벨 · 값.
        .map((signal) => { // 4신호 한글.
            const label = CHURN_SIGNAL_LABELS[signal.type]; // 출석 하락·성적 하락·연속 결석·미납.
            return signal.value == null ? label : `${label} (${signal.value})`; // 값 없으면 라벨만.
        })
        .join(" · "); // reason 한 줄.
}

/**
 * ENROLLED 학생 + 최신 churnCase 1건 + 임계값(id=1, 없으면 기본값).
 */
export async function getDirectorChurnData(): Promise<{ // 감지 실행이 아니다.
    cases: DirectorChurnCase[]; // 재원 전원.
    threshold: ChurnThreshold; // 설정 폼.
}> { // 조회.
    const [studentRecords, thresholdRecord] = await Promise.all([ // 신호 4종 계산은 이 파일이 아니다.
        prisma.student.findMany({ // 재원만. 퇴원생은 이탈 큐에 올리지 않는다. 감지기(`churn-detect`)도 ENROLLED.
            where: { status: "ENROLLED" }, // 퇴원 WITHDRAWN 학생은 명단에 안 넣는다.
            select: { // 최신 케이스 1건.
                id: true, // Student PK.
                name: true, // 표시 이름.
                schoolName: true, // 온보딩 학교.
                grade: true, // 1~12.
                enrollments: { // 활성 반.
                    where: { status: "ACTIVE", endedAt: null }, // 취소 수강 제외.
                    take: 1, // 반·담임.
                    select: { // 반.
                        class: { // 담당 교사.
                            select: { // 이름.
                                name: true, // 반 이름.
                                teacher: { select: { name: true } }, // 담임. assignee가 있으면 그걸로 덮음.
                            },
                        },
                    },
                },
                churnCases: { // 최신 1건.
                    orderBy: { detectedAt: "desc" }, // 최신 감지.
                    take: 1, // 최신 케이스만. 이력 전체는 이 화면이 아니다.
                    select: { // 상태·요약·신호.
                        id: true, // ChurnCase PK.
                        status: true, // DETECTED 등.
                        summary: true, // 감지기 문장.
                        detectedAt: true, // 최초 감지.
                        assignee: { select: { name: true } }, // 담당. 없으면 담임.
                        signals: { // 최근 3건.
                            orderBy: { detectedAt: "desc" }, // 최신 신호.
                            take: 3, // 최근 신호 3건을 reason에 이어 붙인다.
                            select: { type: true, value: true }, // 4신호 타입·값.
                        },
                    },
                },
            },
            orderBy: { name: "asc" }, // 이름순.
        }),
        prisma.churnThresholdConfig.findUnique({ where: { id: 1 } }), // 싱글톤. 없으면 아래 15%p / 10점 / 2회 / 3일.
    ]);

    const cases = studentRecords.map((student) => { // 케이스 없는 재원생도 목록에 남겨 "이탈 신호 없음"까지 한 화면에서 본다.
        const enrollment = student.enrollments[0]; // 활성 반.
        const churnCase = student.churnCases[0] ?? null; // 없으면 빈 행.

        return { // DirectorChurnCase.
            id: student.id, // Student PK. 케이스 없어도 행을 남긴다.
            churnCaseId: churnCase?.id ?? null, // 없으면 다음 버튼 "—".
            studentId: student.id, // 같은 PK.
            studentName: student.name, // 이름.
            schoolName: student.schoolName, // 학교.
            grade: student.grade, // 학년.
            className: enrollment?.class.name ?? null, // 반.
            teacherName: // assignee 우선.
                churnCase?.assignee?.name ?? // 배정 담당.
                enrollment?.class.teacher?.name ?? // 담임.
                null, // 없으면 빈 칸.
            reason: churnCase // 케이스 있으면 신호 문장.
                ? describeChurnSignals(churnCase.signals, churnCase.summary) // 4신호 라벨.
                : "이탈 신호 없음", // 빈 칸이 아니라 명단에 남긴다.
            status: churnCase?.status ?? null, // null이면 다음 버튼이 "—".
            detectedAt: churnCase?.detectedAt.toISOString() ?? null, // ISO.
        };
    });

    return { // 화면 props.
        cases, // ENROLLED 전원.
        threshold: { // id=1 없으면 기본값.
            attendanceDropPercentPoint: Number( // Decimal → number.
                thresholdRecord?.attendanceDropPercentPoint ?? 15, // 기본 15%p.
            ),
            scoreDropPoints: Number(thresholdRecord?.scoreDropPoints ?? 10), // 기본 10점.
            consecutiveAbsences: thresholdRecord?.consecutiveAbsences ?? 2, // 기본 2회.
            unpaidDays: thresholdRecord?.unpaidDays ?? 3, // 기본 3일.
        },
    };
}
