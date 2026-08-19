"use client"; // 작성 폼 상태. createInvoice 서버 액션은 없다.

/**
 * 청구서 작성 UI만 담당한다. createInvoice 서버 액션은 없다.
 *
 * 호출: `BillingManagementScreen`이 `onCreate={notifyUnavailable}`로 붙인다.
 * 학부모가 연결된 학생만 고를 수 있게 하고, 초안 저장·바로 발행은 콜백만 호출한다.
 *
 * 의도적으로 하지 않는 일:
 * - prisma.invoice.create / 발행 전이. 아직 액션 파일이 없다.
 * - 금액 검증·납기 KST 보정. 숫자 변환만 하고 부모에게 넘긴다.
 *
 * 관련: `types.ts`의 `BillingStudentOption`.
 */

import { useMemo, useState } from "react"; // 연결 학생 필터·폼 필드.
import { // 공통 UI 클래스.
    buttonStyles, // 초안/발행 버튼.
    cx, // 패널 클래스 결합.
    fieldStyles, // 라벨·인풋.
    panelStyles, // 패널 헤더.
    surfaceStyles, // 카드 표면.
    typographyStyles, // 빈 상태 힌트.
} from "@/components/ui/shared-styles"; // 청구 전용 스타일 아님.
import type { BillingStudentOption } from "@/features/billing/types"; // parentUserId로 필터.
import styles from "../BillingManagementScreen.module.css"; // 패널·액션 줄.

/** 작성 폼이 부모에 넘기는 값. 서버 액션 입력과 맞춰 두었지만 createInvoice는 아직 없다. */
export type NewInvoiceInput = { studentId: string; title: string; itemName: string; amount: number; dueDate: string; issueNow: boolean }; // UI 전용. prisma.invoice.create는 없다.

/** 학부모 연결 학생만 select. 버튼은 onCreate만 호출하고 DB에 쓰지 않는다. */
export default function InvoiceCreationPanel({ students, isPending, onCreate }: { students: BillingStudentOption[]; isPending: boolean; onCreate: (input: NewInvoiceInput) => void }) { // DB create 없음.
    const linkedStudents = useMemo(() => students.filter((student) => student.parentUserId), [students]); // 학부모 미연결 학생은 청구 대상을 고를 수 없다.
    const [studentId, setStudentId] = useState(linkedStudents[0]?.id ?? ""); // 연결 학생 없으면 빈 문자열.
    const [title, setTitle] = useState("수강료"); // 기본 제목. 서버 검증 없음.
    const [itemName, setItemName] = useState("월 수강료"); // 항목명. 저장 안 함.
    const [amount, setAmount] = useState("300000"); // 문자열. Number만 해서 부모에 넘긴다.
    const [dueDate, setDueDate] = useState(getDefaultDueDate); // 오늘+7일 YYYY-MM-DD.

    function create(issueNow: boolean) { // 초안/발행 모두 같은 콜백. 액션 없음.
        onCreate({ studentId, title, itemName, amount: Number(amount), dueDate, issueNow }); // createInvoice 서버 액션은 없다. 부모가 notifyUnavailable을 붙여 준비 중 안내만 띄운다.
    }

    return ( // UI only.
        <article className={cx(surfaceStyles.root, styles.panel)}> // 작성 카드.
            <div className={panelStyles.head}><h2>청구서 작성</h2></div> // prisma.invoice.create / 발행 전이가 없다 — onCreate만 호출.
            {linkedStudents.length === 0 ? <p className={typographyStyles.hint}>학부모가 연결된 학생이 없습니다. 원장 화면에서 학부모–학생을 먼저 연결하세요.</p> : <div className={fieldStyles.form}> // 미연결이면 폼을 숨긴다.
                <label className={fieldStyles.root}><span>학생</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={isPending}>{linkedStudents.map((student) => <option key={student.id} value={student.id}>{student.name}{student.parentName ? ` · 학부모 ${student.parentName}` : ""}{student.className ? ` · ${student.className}` : ""}</option>)}</select></label> // 숫자 변환만 하고 부모에게 넘긴다.
                <label className={fieldStyles.root}><span>제목</span><input value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} maxLength={120} /></label> // 서버 저장 없음.
                <label className={fieldStyles.root}><span>항목명</span><input value={itemName} onChange={(event) => setItemName(event.target.value)} disabled={isPending} maxLength={120} /></label> // 항목 배열 create 없음.
                <label className={fieldStyles.root}><span>금액 (원)</span><input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} disabled={isPending} /></label> // Number(amount)만. 검증은 부모/서버 없음.
                <label className={fieldStyles.root}><span>납기일</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={isPending} /></label> // KST 보정 없이 화면 값.
                <div className={styles.actions}><button type="button" className={buttonStyles.secondary} disabled={isPending || !studentId} onClick={() => create(false)}>{isPending ? "처리 중…" : "초안 저장"}</button><button type="button" className={buttonStyles.primary} disabled={isPending || !studentId} onClick={() => create(true)}>{isPending ? "처리 중…" : "바로 발행"}</button></div> // 둘 다 createInvoice가 없어 onCreate만 탄다.
            </div>} // 연결 학생 폼 끝.
        </article> // 작성 패널 끝.
    );
}

/** 오늘+7일을 YYYY-MM-DD. 서버 저장이 없어 화면 기본값만. */
function getDefaultDueDate() { // UTC slice. 서버 납기 파싱이 아직 없다.
    const dueDate = new Date(); // 로컬 지금.
    dueDate.setDate(dueDate.getDate() + 7); // 서버 저장이 없어 화면 기본값만.
    return dueDate.toISOString().slice(0, 10); // YYYY-MM-DD.
}
