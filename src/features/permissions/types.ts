import type { PermissionKey } from "@/types/roles";

export type PermissionMember = {
    id: string;
    name: string;
    email: string;
    role: "TEACHER" | "STAFF";
    permissions: Record<PermissionKey, boolean>;
};
