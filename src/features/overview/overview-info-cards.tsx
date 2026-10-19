import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { rowItem, rowList } from "@/lib/motion"
import type { Activity, AppNotification } from "@/types/domain"

/** Recent system notifications feed. */
export function NotificationsCard({
  notifications,
}: {
  notifications: AppNotification[]
}) {
  return (
    <Card title="System Notifications">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Notification</th>
              <th>Date &amp; Time</th>
            </tr>
          </thead>
          <motion.tbody variants={rowList} initial="hidden" animate="show">
            {notifications.map((n) => (
              <motion.tr key={n.id} variants={rowItem}>
                <td>{n.message}</td>
                <td>{n.dateTime}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </Card>
  )
}

/** Audit-style feed of recent user actions. */
export function RecentActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <Card title="Recent Activity">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Activity</th>
              <th>User</th>
              <th>Date &amp; Time</th>
              <th>Related Record</th>
            </tr>
          </thead>
          <motion.tbody variants={rowList} initial="hidden" animate="show">
            {activities.map((a) => (
              <motion.tr key={a.id} variants={rowItem}>
                <td>{a.action}</td>
                <td>{a.user}</td>
                <td>{a.dateTime}</td>
                <td>{a.record}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </Card>
  )
}
