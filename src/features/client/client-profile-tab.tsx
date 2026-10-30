import { useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { Modal } from "@/components/ui/modal"
import { signOut, useSession } from "@/data/session"
import { useClientData } from "@/data/client-store"
import { stagger, staggerItem } from "@/lib/motion"
import { requestClientAccountChanges } from "@/lib/client-api"
import { Card } from "./client-ui"

/** Profile tab: account identity, linked cemetery record, sign out. */
export function ProfileTab() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [requestedName, setRequestedName] = useState("")
  const [requestedEmail, setRequestedEmail] = useState("")
  const [requestedContact, setRequestedContact] = useState("")
  const { user } = useSession()
  const { status, summary } = useClientData()
  const client = summary?.client
  const accountName =
    client?.fullName?.trim() ||
    summary?.profile?.name?.trim() ||
    user?.name ||
    "Client"
  const accountEmail =
    client?.email || summary?.profile?.email || user?.email || ""

  const initials = accountName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  async function submitChangeRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestBusy(true)
    setRequestError(null)
    setRequestSent(false)
    try {
      await requestClientAccountChanges({
        fullName: requestedName.trim() || undefined,
        email: requestedEmail.trim() || undefined,
        contactNumber: requestedContact.trim() || undefined,
      })
      setRequestSent(true)
      setRequestedName("")
      setRequestedEmail("")
      setRequestedContact("")
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Could not send request."
      )
    } finally {
      setRequestBusy(false)
    }
  }

  return (
    <motion.div
      variants={stagger(0.06, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <Card>
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream"
          >
            {initials}
          </motion.div>
          <div className="min-w-0">
            <p className="truncate font-bold">{accountName}</p>
            <p className="truncate text-xs text-deep/60">{accountEmail}</p>
            <span className="mt-1 inline-block rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-deep">
              client
            </span>
          </div>
        </div>
      </Card>

      {status === "ready" && client && (
        <Card title="Account details">
          <dl className="space-y-2 text-sm">
            <Detail label="Full name" value={accountName} />
            <Detail label="Email" value={accountEmail || "—"} />
            <Detail label="Client ID" value={client.clientId} />
            <Detail label="Contact" value={client.contactNumber || "—"} />
            <Detail label="Type" value={client.type} />
            <Detail label="Registered" value={client.registeredAt} />
            <Detail label="Status" value={client.status} />
          </dl>
          <div className="mt-4 border-t border-deep/10 pt-3">
            <p className="text-xs text-deep/60">
              Need to update your account? Send a request to the admin for
              review.
            </p>
            <button
              type="button"
              onClick={() => {
                setRequestError(null)
                setRequestSent(false)
                setRequestOpen(true)
              }}
              className="mt-2 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-deep"
            >
              Request account update
            </button>
          </div>
        </Card>
      )}

      {client && (
        <Modal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          title="Request account update"
          description="Submit account details for admin review."
          panelClassName="bg-white"
          footer={
            <>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="rounded-lg border border-navy/30 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy/5"
              >
                Close
              </button>
              <button
                type="submit"
                form="client-account-change-request"
                disabled={requestBusy || requestSent}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestBusy
                  ? "Sending request..."
                  : requestSent
                    ? "Request sent"
                    : "Send request"}
              </button>
            </>
          }
        >
          <form
            id="client-account-change-request"
            onSubmit={(event) => void submitChangeRequest(event)}
            className="mx-auto max-w-xl space-y-4 rounded-xl bg-white p-4 sm:p-5"
          >
            <p className="rounded-lg border border-navy/20 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-navy">
              Fill in only the details you want changed. Your current account
              will stay the same until the admin reviews your request.
            </p>
            <RequestField
              label="New full name"
              placeholder={accountName}
              value={requestedName}
              onChange={setRequestedName}
            />
            <RequestField
              label="New email"
              type="email"
              placeholder={accountEmail}
              value={requestedEmail}
              onChange={setRequestedEmail}
              maxLength={254}
            />
            <RequestField
              label="New contact number"
              placeholder={client.contactNumber || "Contact number"}
              value={requestedContact}
              onChange={setRequestedContact}
              maxLength={40}
            />
            {requestError && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800"
              >
                {requestError}
              </p>
            )}
            {requestSent && (
              <p
                role="status"
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-900"
              >
                Your request was sent to the admin for review.
              </p>
            )}
          </form>
        </Modal>
      )}

      <motion.button
        variants={staggerItem}
        onClick={() => void signOut()}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="client-primary-button w-full gap-1.5 rounded-xl py-3 text-sm font-semibold"
      >
        Sign Out
      </motion.button>

      <motion.p
        variants={staggerItem}
        className="pb-2 text-center text-[11px] text-deep/40"
      >
        Aevora Cemetery Management System
      </motion.p>
    </motion.div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-deep/60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function RequestField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  maxLength = 120,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email"
  maxLength?: number
}) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={type === "email" ? 254 : maxLength}
        className="mt-1 w-full rounded-lg border border-navy/35 bg-white px-3 py-2.5 text-base font-normal text-navy transition outline-none placeholder:text-slate-500 focus:border-teal focus:ring-2 focus:ring-teal/40"
      />
    </label>
  )
}
