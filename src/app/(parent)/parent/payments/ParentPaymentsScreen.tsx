"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학부모 청구 목록 + 토스 결제 UI 초안 (클라이언트).
 *
 * `/parent/payments` page가 이 Screen을 연결하지 않는다. 준비 중 카피만 보여 준다.
 * 연결되더라도 제출은 preventDefault + "온라인 결제는 준비 중인 기능입니다."
 * Toss 승인·정산 Server Action이 없다.
 *
 * props: payable, history — billing parent-types. 현재 page 데이터 로더도 없다.
 */

import { useState } from "react"; // 의존성. 미연결 결제 Screen. page가 쓰지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 미연결 결제 Screen. page가 쓰지 않는다.
import type { ParentInvoice } from "@/features/billing/parent-types"; // features 데이터/액션. 미연결 결제 Screen. page가 쓰지 않는다.
import { // 의존성. 미연결 결제 Screen. page가 쓰지 않는다.
    formatInvoiceAmount, // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
    formatInvoiceDate, // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
    PARENT_INVOICE_STATUS_METADATA, // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
} from "@/features/billing/presentation"; // 청구/결제는 준비 중. Toss 정산 없음.
import styles from "./ParentPaymentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const statusMeta = PARENT_INVOICE_STATUS_METADATA; // 청구 상태 칩. page가 이 Screen을 연결하지 않는다.
const UNAVAILABLE_MESSAGE = "온라인 결제는 준비 중인 기능입니다."; // Toss 승인 Action이 없다.

/** 청구 선택·가짜 토스 버튼·이력을 그린다. 실제 결제는 막혀 있다. */
export default function ParentPaymentsScreen({ // 이 파일의 화면. 미연결 결제 Screen. page가 쓰지 않는다.
    payable, // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
    history, // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
}: { // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
    payable: ParentInvoice[]; // payable 필드.
    history: ParentInvoice[]; // history 필드.
}) { // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
    const [selectedId, setSelectedId] = useState(payable[0]?.id ?? ""); // 미납 첫 건. page가 이 Screen을 연결하지 않아 실사용은 없다.
    const [message, setMessage] = useState(""); // preventDefault 안내. 정산 웹훅이 아니다.

    const selected = // 선택 청구. 실제 결제 대상이 아니다.
        payable.find((inv) => inv.id === selectedId) ?? payable[0] ?? null; // 미연결 결제 Screen. page가 쓰지 않는다.

    return ( // JSX 반환. 미연결 결제 Screen. page가 쓰지 않는다.
        <section className={styles.page}>{/* 결제 UI 초안. /parent/payments page가 연결하지 않는다. */}
            <header className={styles.heading}>{/* 결제 UI 초안. Toss 승인 Action이 없다. */}
                <div>{/* 레이아웃 상자. */}
                    <span>PAYMENTS</span>{/* 인라인 표시. */}
                    <h1>결제</h1>{/* 제목. */}
                    <p>수강료와 교재비 청구 내역을 확인하고 결제합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            {selected ? ( // 선택 청구. 제출은 preventDefault — Toss가 아니다.
                <div className={styles.hero}>{/* 레이아웃 상자. */}
                    <StatusChip tone={statusMeta[selected.status].tone}>{/* StatusChip. 미연결 결제 Screen. page가 쓰지 않는다. */}
                        {statusMeta[selected.status].label}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                    </StatusChip>{/* StatusChip 닫기. */}
                    <h2>{selected.title}</h2>{/* 소제목. */}
                    <p className={styles.amount}>{/* 문장. */}
                        {formatInvoiceAmount(selected.totalAmount)}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                    </p>{/* p 닫기. */}
                    <p>{/* 문장. */}
                        {selected.studentName} · 납기{" "}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                        {formatInvoiceDate(selected.dueDate)}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                    </p>{/* p 닫기. */}

                    <form // 가짜 토스. 온라인 결제는 준비 중.
                        className={styles.payForm} // className 필드.
                        onSubmit={(event) => { // onSubmit 필드.
                            event.preventDefault(); // 미연결 결제 Screen. page가 쓰지 않는다.
                            setMessage(UNAVAILABLE_MESSAGE); // 미연결 결제 Screen. page가 쓰지 않는다.
                        }} // 구문 끝.
                    >{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                        <button type="submit" className={styles.primaryBtn}>{/* 가짜 토스 버튼. 승인 Server Action이 없다. */}
                            토스로 결제하기{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                        </button>{/* button 닫기. */}
                    </form>{/* form 닫기. */}

                    {message ? ( // 준비 중 안내. 실패 콜백이 아니다.
                        <p className={styles.error} role="alert">{/* 문장. */}
                            {message}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                        </p> // p 닫기.
                    ) : null}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                </div> // div 닫기.
            ) : ( // 미납 청구 없음. page는 이 Screen을 안 붙인다.
                <div className={styles.empty}>{/* 레이아웃 상자. */}
                    <h2>결제할 청구서가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 청구서를 발행하면 이곳에 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}

            {payable.length > 1 && ( // 결제 대기. 선택만, 실제 결제는 막혀 있다.
                <article className={styles.panel}>{/* article. 미연결 결제 Screen. page가 쓰지 않는다. */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>결제 대기</h2>{/* 소제목. */}
                        <StatusChip tone="warning">{/* StatusChip. 미연결 결제 Screen. page가 쓰지 않는다. */}
                            {payable.length}건{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                        </StatusChip>{/* StatusChip 닫기. */}
                    </div>{/* div 닫기. */}
                    <ul className={styles.list}>{/* 목록. */}
                        {payable.map((inv) => ( // 선택만. Toss 위젯이 아니다.
                            <li key={inv.id}>{/* 항목. */}
                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                    type="button" // type 필드.
                                    className={ // 객체/블록 시작.
                                        inv.id === selected?.id // 미연결 결제 Screen. page가 쓰지 않는다.
                                            ? styles.rowActive // 미연결 결제 Screen. page가 쓰지 않는다.
                                            : styles.row // 미연결 결제 Screen. page가 쓰지 않는다.
                                    } // 블록 끝.
                                    onClick={() => setSelectedId(inv.id)} // onClick 필드.
                                >{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <strong>{inv.title}</strong>{/* 강조. */}
                                        <span>{/* 인라인 표시. */}
                                            {inv.studentName} · 납기{" "}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                            {formatInvoiceDate(inv.dueDate)}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                        </span>{/* span 닫기. */}
                                    </div>{/* div 닫기. */}
                                    <div className={styles.rowRight}>{/* 레이아웃 상자. */}
                                        <strong>{/* 강조. */}
                                            {formatInvoiceAmount(inv.totalAmount)}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                        </strong>{/* strong 닫기. */}
                                        <StatusChip // StatusChip. 미연결 결제 Screen. page가 쓰지 않는다.
                                            tone={statusMeta[inv.status].tone} // tone 필드.
                                        >{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                            {statusMeta[inv.status].label}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                    </div>{/* div 닫기. */}
                                </button>{/* button 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul>{/* ul 닫기. */}
                </article> // article 닫기.
            )}{/* 구문 끝. */}

            <article className={styles.panel}>{/* 납부 내역. 정산 웹훅이 아니라 초안 목록. */}
                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                    <h2>납부 내역</h2>{/* 소제목. */}
                    <StatusChip>{history.length}건</StatusChip>{/* StatusChip. 미연결 결제 Screen. page가 쓰지 않는다. */}
                </div>{/* div 닫기. */}
                {history.length === 0 ? ( // 납부 내역 없음.
                    <p className={styles.muted}>납부 내역이 없습니다.</p> // 문장.
                ) : ( // 구문. 미연결 결제 Screen. page가 쓰지 않는다.
                    <ul className={styles.list}>{/* 목록. */}
                        {history.map((inv) => ( // 읽기만. 환불·정산 없음.
                            <li key={inv.id} className={styles.historyItem}>{/* 항목. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{inv.title}</strong>{/* 강조. */}
                                    <span>{/* 인라인 표시. */}
                                        {inv.studentName}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                        {inv.paidAt // 미연결 결제 Screen. page가 쓰지 않는다.
                                            ? ` · ${formatInvoiceDate(inv.paidAt)}` // 미연결 결제 Screen. page가 쓰지 않는다.
                                            : ""}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                    </span>{/* span 닫기. */}
                                </div>{/* div 닫기. */}
                                <div className={styles.rowRight}>{/* 레이아웃 상자. */}
                                    <strong>{/* 강조. */}
                                        {formatInvoiceAmount(inv.totalAmount)}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                    </strong>{/* strong 닫기. */}
                                    <StatusChip // StatusChip. 미연결 결제 Screen. page가 쓰지 않는다.
                                        tone={statusMeta[inv.status].tone} // tone 필드.
                                    >{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                        {statusMeta[inv.status].label}{/* 미연결 결제 Screen. page가 쓰지 않는다. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
