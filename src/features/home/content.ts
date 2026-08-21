/**
 * 공개 홈의 배너·과정·학습 단계 카피와 섹션 데이터다.
 *
 * 호출: `HomeShowcase`(배너), `HomeInformationSections`(과정·여정).
 * 화면 컴포넌트와 문구를 분리해, 마케팅 카피만 여기서 고치게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 역할 대시보드 문구. 로그인 후 홈은 `(role)/dashboard`가 담당한다.
 * - CMS/DB 조회. 정적 상수만.
 *
 * 관련: `HomeScreen.tsx`.
 */

/** 히어로 순환 배너 3장. tone은 CSS 모듈 클래스(`styles.mint` 등)와 맞춘다. */
export const HOME_BANNERS = [ // 공개 마케팅 히어로. 역할 홈 카드가 아니다.
    { src: "/banners/new-semester-1080x1440.png", eyebrow: "NEW SEMESTER", title: "새 학기의 리듬을\n차근차근 만듭니다", description: "개념부터 심화까지, 학생의 속도에 맞춘 학습 설계", tone: "mint" }, // 1장. HomeShowcase가 6초 순환.
    { src: "/banners/parent-consultation-1080x1440.png", eyebrow: "PARENT CONSULTING", title: "기록을 바탕으로\n함께 나누는 성장", description: "출결과 성취 기록을 연결한 정기 학습 상담", tone: "orange" }, // 2장. CMS가 아니라 정적 파일.
    { src: "/banners/summer-intensive-1080x1440.png", eyebrow: "FOCUSED LEARNING", title: "몰입이 필요한 순간,\n빈틈 없이 깊게", description: "취약 단원을 발견하고 보완하는 집중 학습 프로그램", tone: "blue" }, // 3장. tone은 CSS 모듈 클래스명.
] as const; // 역할 홈 집계가 아니라 공개 마케팅 카피.

/** 교육 과정 카드. number는 표시용 순번이지 반 id가 아니다. */
export const ACADEMY_PROGRAMS = [ // HomeInformationSections 과정 그리드.
    { number: "01", title: "중등 수학", subtitle: "개념 · 유형 · 심화", detail: "진단 결과를 바탕으로 개념의 빈틈을 채우고 사고력을 확장합니다." }, // 표시 순번 01. Class.id가 아니다.
    { number: "02", title: "중등 영어", subtitle: "어휘 · 문법 · 독해", detail: "영역별 성취도를 기록하며 읽고 이해하는 힘을 균형 있게 기릅니다." }, // 정적 카피. 반 관리 데이터가 아니다.
    { number: "03", title: "학습 관리", subtitle: "출결 · 성적 · 상담", detail: "수업 이후의 변화까지 기록하고 학생과 학부모에게 투명하게 공유합니다." }, // 마케팅 안내. dashboard 지표가 아니다.
]; // ACADEMY_PROGRAMS 끝.

/** 학습 여정 4단계 [제목, 설명]. HomeInformationSections가 ol로 그린다. */
export const LEARNING_STEPS = [ // 공개 홈 여정. 출결 워크플로가 아니다.
    ["진단", "현재 수준과 학습 습관을 살펴봅니다."], // 1단계 카피.
    ["수업", "학생에게 필요한 목표와 수업을 설계합니다."], // 2단계 카피.
    ["기록", "출결과 성취, 학습 과정을 꾸준히 기록합니다."], // 3단계 카피.
    ["상담", "기록을 바탕으로 다음 성장을 함께 계획합니다."], // 4단계 카피.
] as const; // 역할 대시보드 카드가 아니다.
