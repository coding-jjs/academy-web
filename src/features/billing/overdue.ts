import "server-only";

import { prisma } from "@/lib/db";
import { getKstDayRange } from "@/lib/date-kst";

/** 한국 날짜를 기준으로 납기가 지난 발행 청구서를 연체 상태로 맞춘다. */
export async function syncOverdueInvoices() {
    const { day } = getKstDayRange();
    const today = new Date(`${day}T00:00:00.000Z`);

    await prisma.invoice.updateMany({
        where: {
            status: "ISSUED",
            dueDate: { lt: today },
        },
        data: { status: "OVERDUE" },
    });
}
