export { default as screenStyles } from "./screen.module.css";
export { default as pageHeadingStyles } from "./pageHeading.module.css";
export { default as buttonStyles } from "./button.module.css";
export { default as fieldStyles } from "./field.module.css";
export { default as surfaceStyles } from "./surface.module.css";
export { default as typographyStyles } from "./typography.module.css";
export { default as emptyStateStyles } from "./emptyState.module.css";
export { default as panelStyles } from "./panel.module.css";
export { default as dialogStyles } from "./dialog.module.css";
export { default as skeletonStyles } from "./skeleton.module.css";
export { default as a11yStyles } from "./a11y.module.css";
export { default as spinnerStyles } from "./spinner.module.css";

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}
