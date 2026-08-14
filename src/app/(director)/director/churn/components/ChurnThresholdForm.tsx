"use client";

import { useState } from "react";
import { buttonStyles, cx, fieldStyles, surfaceStyles } from "@/components/ui/shared-styles";
import type { ChurnThreshold } from "@/features/churn/types";
import styles from "../DirectorChurnScreen.module.css";

export default function ChurnThresholdForm({ threshold, isPending, onSave }: { threshold: ChurnThreshold; isPending: boolean; onSave: (threshold: ChurnThreshold) => void }) {
    const [attendanceDrop, setAttendanceDrop] = useState(String(threshold.attendanceDropPercentPoint));
    const [scoreDrop, setScoreDrop] = useState(String(threshold.scoreDropPoints));
    const [consecutiveAbsences, setConsecutiveAbsences] = useState(String(threshold.consecutiveAbsences));
    const [unpaidDays, setUnpaidDays] = useState(String(threshold.unpaidDays));
    return (
        <div className={cx(surfaceStyles.root, fieldStyles.form, styles.thresholdForm)}>
            <label className={fieldStyles.root}>출석 하락 (%p)<input type="number" value={attendanceDrop} onChange={(event) => setAttendanceDrop(event.target.value)} disabled={isPending} /></label>
            <label className={fieldStyles.root}>성적 하락 (점)<input type="number" value={scoreDrop} onChange={(event) => setScoreDrop(event.target.value)} disabled={isPending} /></label>
            <label className={fieldStyles.root}>연속 결석 (회)<input type="number" value={consecutiveAbsences} onChange={(event) => setConsecutiveAbsences(event.target.value)} disabled={isPending} /></label>
            <label className={fieldStyles.root}>미납 (일)<input type="number" value={unpaidDays} onChange={(event) => setUnpaidDays(event.target.value)} disabled={isPending} /></label>
            <button type="button" className={cx(buttonStyles.primary, styles.toolbarBtn)} disabled={isPending} onClick={() => onSave({ attendanceDropPercentPoint: Number(attendanceDrop), scoreDropPoints: Number(scoreDrop), consecutiveAbsences: Number(consecutiveAbsences), unpaidDays: Number(unpaidDays) })}>{isPending ? "저장 중…" : "저장"}</button>
        </div>
    );
}
