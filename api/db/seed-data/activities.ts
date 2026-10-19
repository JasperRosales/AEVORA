import type { Activity } from "../../../src/types/domain"

export const activities: Activity[] = [
  {
    id: "act1",
    action: "New client registered",
    user: "Admin Kyle",
    dateTime: "2026-10-06 09:12",
    record: "CL-008",
  },
  {
    id: "act2",
    action: "New reservation submitted",
    user: "Staff Ana",
    dateTime: "2026-10-06 08:45",
    record: "R-008",
  },
  {
    id: "act3",
    action: "Payment recorded",
    user: "Admin Kyle",
    dateTime: "2026-10-05 16:20",
    record: "OR-01",
  },
  {
    id: "act4",
    action: "Plot status updated",
    user: "Staff Mark",
    dateTime: "2026-10-05 14:02",
    record: "A-101",
  },
  {
    id: "act5",
    action: "Information checked",
    user: "Staff Ana",
    dateTime: "2026-10-05 11:30",
    record: "R-002",
  },
  {
    id: "act6",
    action: "Agreement created",
    user: "Admin Kyle",
    dateTime: "2026-10-05 10:15",
    record: "AG-001",
  },
  {
    id: "act7",
    action: "Report generated",
    user: "Management Lea",
    dateTime: "2026-10-04 17:40",
    record: "Plot Occupancy",
  },
]
