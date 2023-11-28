import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email", { mode: "text" }).unique().notNull(),
  name: text("name", { mode: "text" }).notNull(),
  dob: integer("dob", { mode: "timestamp" }).notNull(),
  role: text("role", { enum: ["DOCTOR", "PATIENT"] }).notNull(),
});

export const consultationTable = sqliteTable("consultation", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  doctorId: integer("doctor_id", { mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  patientId: integer("patient_id", { mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  patientMessage: text("patient_message", { mode: "text" }).notNull(),
  type: text("type", {
    enum: ["INITIAL", "TREATMENT", "POST_TREATMENT", "OTHER"],
  }).notNull(),
  doctorNotes: text("doctor_notes", { mode: "text" }),
  created: integer("created", { mode: "timestamp_ms" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  accepted: integer("accepted", { mode: "timestamp" }),
  startTime: integer("start_time", { mode: "timestamp" }),
  endTime: integer("end_time", { mode: "timestamp" }),
  status: text("status", {
    enum: ["IN_PROGRESS", "EXPIRED", "ACCEPTED", "DECLINED", "SERVED"],
  })
    .notNull()
    .default("IN_PROGRESS"),
});

export const patientRelations = relations(usersTable, ({ many }) => ({
  consultationReqests: many(consultationTable, {
    relationName: "consultationReqests",
  }),
}));

export const consultationRelations = relations(
  consultationTable,
  ({ one }) => ({
    patient: one(usersTable, {
      relationName: "patient",
      fields: [consultationTable.patientId],
      references: [usersTable.id],
    }),
    doctor: one(usersTable, {
      relationName: "doctor",
      fields: [consultationTable.doctorId],
      references: [usersTable.id],
    }),
  }),
);

export type User = typeof usersTable.$inferSelect;
export type Consultation = typeof consultationTable.$inferSelect;
