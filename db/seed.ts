import { db } from "./index";
import { usersTable } from "./schema";

// Add some docots
await db.insert(usersTable).values([
  {
    name: "Barry Allan",
    dob: new Date(1994, 3, 8),
    role: "DOCTOR",
    email: "barry@flash.com",
  },
  {
    name: "Clark Kent",
    dob: new Date(1987, 5, 1),
    role: "DOCTOR",
    email: "clark@superman.com",
  },
  {
    name: "Diana Prince",
    dob: new Date(1947, 6, 12),
    role: "DOCTOR",
    email: "diana@wonderwoman.com",
  },
  {
    name: "Bruce Wayne",
    dob: new Date(1988, 10, 13),
    role: "DOCTOR",
    email: "batman@sucks.com",
  },
]);

// Insert Patients
await db.insert(usersTable).values([
  {
    name: "Lex Luther",
    dob: new Date(1979, 3, 18),
    role: "PATIENT",
    email: "genius@earth.com",
  },
  {
    name: "General Zod",
    dob: new Date(1967, 5, 21),
    role: "PATIENT",
    email: "general@krypton.com",
  },
  {
    name: "Dark Sied",
    dob: new Date(1927, 6, 12),
    role: "PATIENT",
    email: "lord@apokolips.com",
  },
]);
