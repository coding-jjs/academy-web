import type { ChurnAssigneeOption, ChurnSignalType } from "@/features/churn/types";

type EnrollmentTeacher = {
    class: {
        name: string;
        subject: string;
        teacherUserId: string | null;
        teacher: {
            id: string;
            name: string;
            role: string;
            status: string;
        } | null;
    };
};

export function buildStudentAssignees(
    enrollments: EnrollmentTeacher[],
): ChurnAssigneeOption[] {
    const byId = new Map<string, ChurnAssigneeOption>();

    for (const enrollment of enrollments) {
        const teacher = enrollment.class.teacher;
        const teacherId = enrollment.class.teacherUserId ?? teacher?.id;
        if (!teacherId || !teacher) continue;
        if (teacher.role !== "TEACHER" && teacher.role !== "STAFF") continue;
        if (teacher.status !== "ACTIVE") continue;

        const existing = byId.get(teacherId);
        if (existing) {
            if (!existing.classNames.includes(enrollment.class.name)) {
                existing.classNames.push(enrollment.class.name);
            }
            if (!existing.subjects.includes(enrollment.class.subject)) {
                existing.subjects.push(enrollment.class.subject);
            }
            continue;
        }

        byId.set(teacherId, {
            id: teacherId,
            name: teacher.name,
            role: teacher.role === "STAFF" ? "STAFF" : "TEACHER",
            classNames: [enrollment.class.name],
            subjects: [enrollment.class.subject],
        });
    }

    return [...byId.values()];
}

export function suggestAssigneeUserId(
    assignees: ChurnAssigneeOption[],
    assignedUserId: string | null,
    signals: { type: ChurnSignalType; details: unknown }[],
): string | null {
    if (assignees.length === 0) return null;

    if (
        assignedUserId &&
        assignees.some((assignee) => assignee.id === assignedUserId)
    ) {
        return assignedUserId;
    }

    const subject = getScoreDropSubject(signals);
    if (subject) {
        const match = assignees.find((assignee) =>
            assignee.subjects.some(
                (item) => item === subject || item.includes(subject),
            ),
        );
        if (match) return match.id;
    }

    return assignees[0]?.id ?? null;
}

export function formatAssigneeOption(assignee: ChurnAssigneeOption) {
    const classes = assignee.classNames.join(", ");
    const roleLabel = assignee.role === "STAFF" ? "직원" : "선생님";
    return classes
        ? `${assignee.name} · ${classes} (${roleLabel})`
        : `${assignee.name} (${roleLabel})`;
}

function getScoreDropSubject(
    signals: { type: ChurnSignalType; details: unknown }[],
): string | null {
    for (const signal of signals) {
        if (signal.type !== "SCORE_DROP") continue;
        if (
            signal.details &&
            typeof signal.details === "object" &&
            "subject" in signal.details &&
            typeof signal.details.subject === "string"
        ) {
            return signal.details.subject;
        }
    }
    return null;
}
