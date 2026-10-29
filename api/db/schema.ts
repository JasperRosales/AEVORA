import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const cemeteries = pgTable("cemeteries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
})

export const cemeteryMapPlaceholders = pgTable("cemetery_map_placeholders", {
  cemeteryId: text("cemetery_id")
    .primaryKey()
    .references(() => cemeteries.id),
  rows: integer("rows").notNull(),
  columns: integer("columns").notNull(),
  placements: text("placements").notNull(),
})

export const plots = pgTable("plots", {
  id: text("id").primaryKey(),
  plotNumber: text("plot_number").notNull(),
  cemeteryId: text("cemetery_id")
    .notNull()
    .references(() => cemeteries.id),
  section: text("section").notNull(),
  row: integer("row").notNull(),
  column: integer("column").notNull(),
  size: text("size").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull().default("Typical Block"),
  groupName: text("group_name"),
  reservedFor: text("reserved_for"),
})

export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  reservationNumber: text("reservation_number").notNull(),
  clientName: text("client_name").notNull(),
  cemeteryId: text("cemetery_id")
    .notNull()
    .references(() => cemeteries.id),
  plotNumber: text("plot_number").notNull(),
  date: text("date").notNull(),
  plotCategory: text("plot_category").notNull().default("Typical Block"),
  status: text("status").notNull(),
  verification: text("verification").notNull(),
})

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  type: text("type").notNull(),
  registeredAt: text("registered_at").notNull(),
  status: text("status").notNull(),
  reservations: integer("reservations").notNull(),
})

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull(),
  clientName: text("client_name").notNull(),
  plotNumber: text("plot_number").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(),
  method: text("method").notNull(),
  cemeteryId: text("cemetery_id")
    .notNull()
    .references(() => cemeteries.id),
})

export const agreements = pgTable("agreements", {
  id: text("id").primaryKey(),
  agreementNumber: text("agreement_number").notNull(),
  clientName: text("client_name").notNull(),
  plotNumber: text("plot_number").notNull(),
  cemeteryId: text("cemetery_id")
    .notNull()
    .references(() => cemeteries.id),
  type: text("type").notNull(),
  dateSigned: text("date_signed").notNull(),
  status: text("status").notNull(),
})

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  user: text("user").notNull(),
  dateTime: text("date_time").notNull(),
  record: text("record").notNull(),
})

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  dateTime: text("date_time").notNull(),
  read: boolean("is_read").notNull().default(false),
})

export const generatedReports = pgTable("generated_reports", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  dateGenerated: text("date_generated").notNull(),
  generatedBy: text("generated_by").notNull(),
  status: text("status").notNull(),
})

// Object Storage keys are stored here; the bytes live in the `assets` bucket
// on the same Neon branch, so rows and files branch together.
export const attachments = pgTable("attachments", {
  id: text("id").primaryKey(),
  reservationId: text("reservation_id")
    .notNull()
    .references(() => reservations.id),
  key: text("key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
