import { Card } from "@/components/ui/card"
import type { Activity, AppNotification } from "@/types/domain"

/** Recent system notifications feed. */
export function NotificationsCard({ notifications }: { notifications: AppNotification[] }) {
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
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id}>
                <td>{n.message}</td>
                <td>{n.dateTime}</td>
              </tr>
            ))}
          </tbody>
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
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>{a.action}</td>
                <td>{a.user}</td>
                <td>{a.dateTime}</td>
                <td>{a.record}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
