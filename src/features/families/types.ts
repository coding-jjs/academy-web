export type LinkableParent = {
    id: string;
    name: string;
    email: string;
};

export type LinkableStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
};

export type ActiveFamilyLink = {
    id: string;
    relationship: string | null;
    linkedAt: string;
    parent: {
        name: string;
        email: string;
        phone: string | null;
    };
    student: {
        name: string;
        schoolName: string | null;
        grade: string | null;
        email: string | null;
    };
};
