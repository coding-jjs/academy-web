"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 자녀 성적·오답 읽기 전용 UI (클라이언트).
 *
 * props: childList, activeChildId — viewer-data.
 * child 쿠키로 자녀를 갈아타며 점수를 고치지 않는다. 입력은 교사/원장 성적 화면.
 * Server Action 없음.
 */

import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { ParentGradesChild } from "@/features/grades/types"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    formatGradeDate, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    formatGradeDelta, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/grades/formatters"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { WRONG_NOTE_STATUS_METADATA } from "@/features/grades/presentation"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentGradesScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.
import { writeParentChildCookie } from "@/features/families/parent-child-cooke"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

const wrongStatusMeta = WRONG_NOTE_STATUS_METADATA; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
const formatDate = formatGradeDate; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 활성 자녀의 하이라이트·성적·오답 목록을 그린다. */
export default function ParentGradesScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    activeChildId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList: ParentGradesChild[]; // childList 필드.
    activeChildId: string; // activeChildId 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const child = // ?childId/쿠키 자녀. 점수는 고치지 않는다.
        childList.find((item) => item.id === activeChildId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    function selectChild(childId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        writeParentChildCookie(childId); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        router.replace(`/parent/grades?childId=${childId}`); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    return ( // 자녀 성적 열람. 쓰기는 없다.
        <section className={styles.page}>{/* 자녀 성적 열람. 쓰기는 없다. */}
            <header className={styles.heading}>{/* 읽기 전용 성적·오답 */}
                <div>{/* 레이아웃 상자. */}
                    <span>LEARNING</span>{/* 인라인 표시. */}
                    <h1>성적·오답</h1>{/* 제목. */}
                    <p>자녀의 성적 변화와 복습할 오답 기록을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            {childList.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 원장 연결 전 */}
                    <h2>연결된 자녀가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 연결을 완료하면 성적·오답이 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    {childList.length > 1 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.childSwitch}>{/* 여러 자녀면 전환 */}
                            {childList.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                    key={item.id} // key 필드.
                                    type="button" // type 필드.
                                    className={ // 객체/블록 시작.
                                        item.id === child?.id // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? styles.childActive // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : styles.childBtn // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    } // 블록 끝.
                                    onClick={() => selectChild(item.id)} // onClick 필드.
                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {item.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </button> // button 닫기.
                            ))}{/* 구문 끝. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    {child && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            <div className={styles.metrics}>{/* 최근 성적·오답 수. 입력은 교사/원장. */}
                                {child.highlights.length > 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    child.highlights.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <article key={item.subject}>{/* 자녀 성적 열람. 쓰기는 없다. */}
                                            <span>최근 {item.subject}</span>{/* 인라인 표시. */}
                                            <strong>{item.score}점</strong>{/* 강조. */}
                                            <p>{/* 문장. */}
                                                {formatGradeDelta(item.delta)}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            </p>{/* p 닫기. */}
                                        </article> // article 닫기.
                                    )) // 구문 끝.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <article>{/* 자녀 성적 열람. 쓰기는 없다. */}
                                        <span>최근 성적</span>{/* 인라인 표시. */}
                                        <strong>—</strong>{/* 강조. */}
                                        <p>기록 없음</p>{/* 문장. */}
                                    </article> // article 닫기.
                                )}{/* 구문 끝. */}
                                <article>{/* 자녀 성적 열람. 쓰기는 없다. */}
                                    <span>오답 노트</span>{/* 인라인 표시. */}
                                    <strong>{child.wrongNotes.length}</strong>{/* 강조. */}
                                    <p>복습 필요 {child.openWrongCount}개</p>{/* 문장. */}
                                </article>{/* article 닫기. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.grid}>{/* 레이아웃 상자. */}
                                <article className={styles.panel}>{/* 성적 기록 */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>성적 기록</h2>{/* 소제목. */}
                                        <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {child.grades.length}건{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                    </div>{/* div 닫기. */}
                                    {child.grades.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p className={styles.muted}>{/* 문장. */}
                                            등록된 성적이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <ul className={styles.list}>{/* 목록. */}
                                            {child.grades.map((g) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={g.id}>{/* 항목. */}
                                                    <div>{/* 레이아웃 상자. */}
                                                        <strong>{/* 강조. */}
                                                            {g.title}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{/* 인라인 표시. */}
                                                            {g.subject}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {g.className // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? ` · ${g.className}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {` · ${formatDate(g.assessedAt)}`}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </span>{/* span 닫기. */}
                                                    </div>{/* div 닫기. */}
                                                    <div // 레이아웃 상자.
                                                        className={styles.score} // className 필드.
                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        <strong>{/* 강조. */}
                                                            {g.score}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            <small>{/* 보조 문장. */}
                                                                /{g.maxScore}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            </small>{/* small 닫기. */}
                                                        </strong>{/* strong 닫기. */}
                                                        {g.percent != null && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <span>{/* 인라인 표시. */}
                                                                {g.percent}%{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            </span> // span 닫기.
                                                        )}{/* 구문 끝. */}
                                                    </div>{/* div 닫기. */}
                                                </li> // li 닫기.
                                            ))}{/* 구문 끝. */}
                                        </ul> // ul 닫기.
                                    )}{/* 구문 끝. */}
                                </article>{/* article 닫기. */}

                                <article className={styles.panel}>{/* 오답 노트. 상태 변경 없음. */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>오답 노트</h2>{/* 소제목. */}
                                        <StatusChip tone="warning">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            복습 {child.openWrongCount}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                    </div>{/* div 닫기. */}
                                    {child.wrongNotes.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p className={styles.muted}>{/* 문장. */}
                                            등록된 오답이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <ul className={styles.list}>{/* 목록. */}
                                            {child.wrongNotes.map((note) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={note.id}>{/* 항목. */}
                                                    <div>{/* 레이아웃 상자. */}
                                                        <strong>{/* 강조. */}
                                                            {note.subject ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                note.className ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                "오답"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {note.questionNo // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? ` · ${note.questionNo}번` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{/* 인라인 표시. */}
                                                            {note.questionText?.slice( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                0, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                48, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ) || // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                note.gradeTitle || // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                "문제 내용 없음"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {note.questionText && // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            note.questionText // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                .length > 48 // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? "…" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </span>{/* span 닫기. */}
                                                        {note.explanation && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <small>{/* 보조 문장. */}
                                                                { // 객체/블록 시작.
                                                                    note.explanation // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                }{/* 블록 끝. */}
                                                            </small> // small 닫기.
                                                        )}{/* 구문 끝. */}
                                                    </div>{/* div 닫기. */}
                                                    <div // 레이아웃 상자.
                                                        className={ // 객체/블록 시작.
                                                            styles.badges // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        } // 블록 끝.
                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            tone={ // 객체/블록 시작.
                                                                wrongStatusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    note.status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ].tone // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            } // 블록 끝.
                                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            { // 객체/블록 시작.
                                                                wrongStatusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    note.status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ].label // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            }{/* 블록 끝. */}
                                                        </StatusChip>{/* StatusChip 닫기. */}
                                                        {note.imageCount > // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                사진{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                { // 객체/블록 시작.
                                                                    note.imageCount // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                }{/* 블록 끝. */}
                                                            </StatusChip> // StatusChip 닫기.
                                                        )}{/* 구문 끝. */}
                                                    </div>{/* div 닫기. */}
                                                </li> // li 닫기.
                                            ))}{/* 구문 끝. */}
                                        </ul> // ul 닫기.
                                    )}{/* 구문 끝. */}
                                </article>{/* article 닫기. */}
                            </div>{/* div 닫기. */}
                        </> // 구문 끝.
                    )}{/* 구문 끝. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
