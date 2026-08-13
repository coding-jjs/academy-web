import HomeHeader from "@/features/home/components/HomeHeader";
import HomeInformationSections from "@/features/home/components/HomeInformationSections";
import HomeShowcase from "@/features/home/components/HomeShowcase";
import type { HomeViewer } from "@/features/home/types";
import type { Notice } from "@/features/notices/types";
import styles from "./HomeScreen.module.css";

export default function HomeScreen({
    viewer,
    notices,
}: {
    viewer: HomeViewer | null;
    notices: Notice[];
}) {
    return (
        <main className={styles.page}>
            <HomeHeader viewer={viewer} />
            <HomeShowcase notices={notices} />
            <HomeInformationSections />
        </main>
    );
}
