"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 이탈 신호 임계값 입력 폼 (클라이언트).
 *
 * 저장 클릭 시 부모 Screen의 `saveChurnThreshold`만 호출한다. 스캔 실행은 부모 몫.
 * 기준을 코드에 박지 않고 원장이 운영 중 바꿀 수 있게 한다.
 *
 * props: threshold, isPending, onSave.
 */

import { useState } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { buttonStyles, cx, fieldStyles, surfaceStyles } from "@/components/ui/shared-styles"; // 공유 UI 클래스. 로직이 아니다.
import type { ChurnThreshold } from "@/features/churn/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorChurnScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 출석·성적·연속결석·미납 숫자를 모아 onSave로 넘긴다. */
export default function ChurnThresholdForm({ threshold, isPending, onSave }: { threshold: ChurnThreshold; isPending: boolean; onSave: (threshold: ChurnThreshold) => void }) { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    const [attendanceDrop, setAttendanceDrop] = useState(String(threshold.attendanceDropPercentPoint)); // 출석 하락 %p. 코드에 기준을 안 박는다.
    const [scoreDrop, setScoreDrop] = useState(String(threshold.scoreDropPoints)); // 성적 하락 점.
    const [consecutiveAbsences, setConsecutiveAbsences] = useState(String(threshold.consecutiveAbsences)); // 연속 결석 회.
    const [unpaidDays, setUnpaidDays] = useState(String(threshold.unpaidDays)); // 미납 일수. 있어도 정산 UI는 없다.
    return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
        <div className={cx(surfaceStyles.root, fieldStyles.form, styles.thresholdForm)}>{/* 임계값 숫자. 스캔 실행은 부모 Screen. */}
            <label className={fieldStyles.root}>출석 하락 (%p)<input type="number" value={attendanceDrop} onChange={(event) => setAttendanceDrop(event.target.value)} disabled={isPending} /></label>{/* 필드 라벨. */}
            <label className={fieldStyles.root}>성적 하락 (점)<input type="number" value={scoreDrop} onChange={(event) => setScoreDrop(event.target.value)} disabled={isPending} /></label>{/* 필드 라벨. */}
            <label className={fieldStyles.root}>연속 결석 (회)<input type="number" value={consecutiveAbsences} onChange={(event) => setConsecutiveAbsences(event.target.value)} disabled={isPending} /></label>{/* 필드 라벨. */}
            <label className={fieldStyles.root}>미납 (일)<input type="number" value={unpaidDays} onChange={(event) => setUnpaidDays(event.target.value)} disabled={isPending} /></label>{/* 필드 라벨. */}
            <button type="button" className={cx(buttonStyles.primary, styles.toolbarBtn)} disabled={isPending} onClick={() => onSave({ attendanceDropPercentPoint: Number(attendanceDrop), scoreDropPoints: Number(scoreDrop), consecutiveAbsences: Number(consecutiveAbsences), unpaidDays: Number(unpaidDays) })}>{isPending ? "저장 중…" : "저장"}</button>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
