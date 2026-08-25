/**
 * 헤더·푸터 학원 마크.
 * 흰 원 안에 캐릭터(`public/brand-mark.png`)를 넣어 예전 검정 원+A를 대체한다.
 *
 * 호출: 홈 헤더/푸터, 로그인·가입, 공지, AdminShell / MemberShell.
 * 장식만 — 링크 텍스트는 부모 `aria-label` / 학원 이름이 담당한다.
 */

import { cx } from "@/components/ui/shared-styles";
import styles from "./BrandMark.module.css";

export default function BrandMark({ className }: { className?: string }) {
    return (
        <span className={cx(styles.mark, className)} aria-hidden="true">
            <img src="/brand-mark.png" alt="" width={32} height={32} />
        </span>
    );
}
