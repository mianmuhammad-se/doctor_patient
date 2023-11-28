import {
  type LoaderFunctionArgs,
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "../../db";
import { consultationTable, usersTable } from "db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSession } from "~/session";
import { CONSULTATION_OPTIONS, ConsultationType } from "~/constants";
import { EVENTS } from "~/events";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get session information
  const session = await getSession(request.headers.get("Cookie"));
  // If user is logged in,
  const id = session.get("userId");
  const role = session.get("userRole");

  if (!id || !role) {
    return redirect("/");
  }

  if (role === "DOCTOR") {
    return redirect("/doctor");
  }

  const userQuery = db.query.usersTable.findFirst({
    where: eq(usersTable.id, id),
  });

  const doctorsQuery = db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "DOCTOR"));

  const patientRequestsQuery = db
    .select()
    .from(consultationTable)
    .where(
      and(
        eq(consultationTable.patientId, id),
        sql`${consultationTable.created} > datetime('now', '-5 minutes')`,
      ),
    )
    .orderBy(desc(consultationTable.created));

  const [user, doctors, patientRequests] = await Promise.all([
    userQuery,
    doctorsQuery,
    patientRequestsQuery,
  ]);

  if (!user) {
    return redirect("/");
  }

  return json({ user, doctors, patientRequests });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));

  const id = session.get("userId");

  if (!id) {
    return redirect("/");
  }

  const formData = await request.formData();
  const doctorId = formData.get("doctorId");
  const consultationType = formData.get("type");
  const message = formData.get("message");

  if (!doctorId || typeof doctorId !== "string") {
    return json({ error: "Invalid doctor selected." });
  }

  if (!message || typeof message !== "string") {
    return json({ error: "Please enter a proper message for the doctor." });
  }

  if (
    !consultationType ||
    typeof consultationType !== "string" ||
    !["INITIAL", "TREATMENT", "POST_TREATMENT", "OTHER"].includes(
      consultationType,
    )
  ) {
    return json({ error: "Invalid consultation type selected." });
  }

  try {
    let result = await db
      .insert(consultationTable)
      .values({
        doctorId: Number(doctorId),
        patientId: id,
        type: consultationType as ConsultationType,
        patientMessage: message,
      })
      .returning({ id: consultationTable.id });

    EVENTS.CONSULTATION_ADDED(Number(result[0].id));
    return redirect("/patient");
  } catch (error) {
    return json({ error });
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Book Consultation" },
    { name: "description", content: "Book a new consultation for yourself." },
  ];
};

export default function Index() {
  const { user, doctors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <div className="w-screen h-screen">
      <div className="flex flex-col justify-center items-center">
        <h1 className="font-bold text-center block">Welcome {user.name}</h1>
        <Form
          className="flex flex-col border p-4 w-1/3 mt-4 shadow-md"
          method="POST"
        >
          <h2 className="self-center font-semibold">Book a consultation</h2>
          <div className="my-2">
            <label className="block" htmlFor="doctorId">
              Select a Doctor
            </label>
            <select className="w-full p-2" name="doctorId">
              {doctors.map((d) => (
                <option value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="my-2">
            <label className="block" htmlFor="type">
              Consultation Type
            </label>
            <select className="w-full p-2" name="type">
              {CONSULTATION_OPTIONS.map((c) => (
                <option value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="my-2">
            <label htmlFor="message" className="block">
              Message
            </label>
            <textarea name="message" className="p-2 border w-full" />
          </div>
          {actionData?.error ? (
            <div className="w-full text-red-500 my-2">
              {String(actionData?.error)}
            </div>
          ) : null}
          <div className="w-full flex items-center space-x-1">
            <button
              className="p-2 shadow-sm bg-pink-500 text-white w-1/2"
              type="submit"
            >
              Book consultation
            </button>
            <Link
              className="p-2 shadow-sm bg-red-500 text-white w-1/2 text-center"
              to="/patient"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
