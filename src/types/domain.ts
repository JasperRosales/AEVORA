export type PlotStatus =
  | "Available"
  | "Reserved"
  | "Occupied"
  | "Waiting for Checking"
  | "Unavailable"

export type BurialType = "Private" | "Vertical" | "Public"

export type VerificationStatus =
  | "Waiting for Checking"
  | "Under Review"
  | "Verified"
  | "Requires Action"

export type ReservationStatus =
  | "Pending"
  | "Under Verification"
  | "Confirmed"
  | "Cancelled"

export type PaymentStatus = "Paid" | "Pending" | "Overdue"

export type AgreementStatus = "Pending" | "Active" | "Completed" | "Cancelled"

export interface Cemetery {
  id: string
  name: string
  location: string
}

export interface Plot {
  id: string
  plotNumber: string
  cemeteryId: string
  section: string
  row: number
  column: number
  type: BurialType
  size: string
  price: number
  status: PlotStatus
  reservedFor?: string
}

export interface Reservation {
  id: string
  reservationNumber: string
  clientName: string
  cemeteryId: string
  plotNumber: string
  date: string
  burialType: BurialType
  status: ReservationStatus
  verification: VerificationStatus
}

export interface Client {
  id: string
  clientId: string
  fullName: string
  contactNumber: string
  email: string
  type: "Individual" | "Corporate"
  registeredAt: string
  status: "Active" | "Inactive" | "Pending"
  reservations: number
}

export interface Payment {
  id: string
  receiptNumber: string
  clientName: string
  plotNumber: string
  type: "Reservation Fee" | "Down Payment" | "Installment" | "Full Payment"
  amount: number
  date: string
  status: PaymentStatus
  method: "Cash" | "Bank Transfer" | "Card" | "Online"
  cemeteryId: string
}

export interface Agreement {
  id: string
  agreementNumber: string
  clientName: string
  plotNumber: string
  cemeteryId: string
  type: "Reservation Agreement" | "Deed of Sale" | "Maintenance Agreement"
  dateSigned: string
  status: AgreementStatus
}

export interface Activity {
  id: string
  action: string
  user: string
  dateTime: string
  record: string
}

export interface AppNotification {
  id: string
  message: string
  type: "reservation" | "verification" | "payment" | "agreement" | "plot"
  dateTime: string
}

export interface GeneratedReport {
  id: string
  name: string
  type: string
  dateGenerated: string
  generatedBy: string
  status: "Ready" | "Processing"
}
