import HomeHeader from "@/features/home/components/HomeHeader";
import HomeInformationSections from "@/features/home/components/HomeInformationSections";
import HomeShowcase from "@/features/home/components/HomeShowcase";
import type { HomeViewer } from "@/features/home/types";
import styles from "./HomeScreen.module.css";

export default function HomeScreen({ viewer }: { viewer: HomeViewer | null }) {
    return (
        <main className={styles.page}>
            <HomeHeader viewer={viewer} />
            <HomeShowcase />
            <HomeInformationSections />
        </main>
    );
}
