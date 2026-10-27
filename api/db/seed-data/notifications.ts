import type { AppNotification } from "../../../src/types/domain"

export const notifications: AppNotification[] = [
  {
    id: "n1",
    message: "New reservation submitted by Miguel Torres",
    type: "reservation",
    dateTime: "2026-10-06 08:45",
    read: false,
  },
  {
    id: "n2",
    message: "ID of Ana Reyes awaiting verification",
    type: "verification",
    dateTime: "2026-10-05 15:10",
    read: false,
  },
  {
    id: "n3",
    message: "Payment OR-04 is overdue",
    type: "payment",
    dateTime: "2026-10-05 09:00",
    read: true,
  },
  {
    id: "n4",
    message: "Agreement AG-002 requires action",
    type: "agreement",
    dateTime: "2026-10-04 13:25",
    read: true,
  },
  {
    id: "n5",
    message: "Plot D-326 information requires checking",
    type: "plot",
    dateTime: "2026-10-04 10:05",
    read: false,
  },
]
