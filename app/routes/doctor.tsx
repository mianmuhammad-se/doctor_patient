import {
  type LoaderFunctionArgs,
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { getAge } from "~/utils";
import { Form } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "../../db";
import { and, eq, sql } from "drizzle-orm";
import { consultationTable, usersTable } from "db/schema";
import { getSession } from "~/session";
import { useLiveLoader } from "~/useLiveLoader";
import { EVENTS } from "~/events";
import { RequestTimer } from "~/components/RequestTimer";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get session information
  const session = await getSession(request.headers.get("Cookie"));
  // If user is logged in,
  const id = session.get("userId");
  const role = session.get("userRole");
  if (!id) {
    return redirect("/");
  }

  if (role == "PATIENT") {
    return redirect("/patient");
  }
  const userQ = db.query.usersTable.findFirst({
    where: eq(usersTable.id, id),
  });

  const consultationsQ = db
    .select({
      id: consultationTable.id,
      patientMessage: consultationTable.patientMessage,
      type: consultationTable.type,
      status: consultationTable.status,
      created: consultationTable.created,
      patientName: usersTable.name,
      patientDob: usersTable.dob,
    })
    .from(consultationTable)
    .leftJoin(usersTable, eq(consultationTable.patientId, usersTable.id))
    .where(
      and(
        eq(consultationTable.status, "IN_PROGRESS"),
        eq(consultationTable.doctorId, id),
        sql`${consultationTable.created} > datetime('now', '-5 minutes')`,
      ),
    );

  const [user, consultations] = await Promise.all([userQ, consultationsQ]);

  if (!user) {
    return redirect("/");
  }

  return json({ user, consultations });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const id = session.get("userId");
  const role = session.get("userRole");

  if (!id || !role) {
    return redirect("/");
  }

  const formData = await request.formData();
  const { _action, consultationId } = Object.fromEntries(formData);
  let status: "ACCEPTED" | "DECLINED";
  if (_action == "accept") {
    status = "ACCEPTED";
  } else {
    status = "DECLINED";
  }

  await db
    .update(consultationTable)
    .set({
      status: status,
      ...(_action === "accept" ? { startTime: new Date() } : {}),
    })
    .where(eq(consultationTable.id, Number(consultationId)));

  if (_action == "accept") {
    EVENTS.CONSULTATION_ACCEPTED(Number(consultationId));
    return redirect(`/doctor/requests/${consultationId}`);
  } else {
    EVENTS.CONSULTATION_DECLINED(Number(consultationId));
    return redirect("/doctor");
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Doctor Portal" },
    { name: "description", content: "Welcome to your portal!" },
  ];
};

export default function Index() {
  const { user, consultations } = useLiveLoader<typeof loader>();
  return (
    <div className="flex w-screen flex-col justify-center items-center">
      <div className="font-semibold my-4">Welcome Dr. {user.name}</div>
      <table className="table-auto border-collapse border border-slate-400">
        <thead className="">
          <tr className="p-4">
            <th className="p-4 border border-slate-300">Status</th>
            <th className="p-4 border border-slate-300">Patient Name</th>
            <th className="p-4 border border-slate-300">Age</th>
            <th className="p-4 border border-slate-300">Consultation Type</th>
            <th className="p-4 border border-slate-300">Time Remaining</th>
            <th className="p-4 border border-slate-300">Actions</th>
          </tr>
        </thead>
        {consultations.map((c) => (
          <tr key={c.id}>
            <td className="p-4 border border-slate-300">{c.status}</td>
            <td className="p-4 border border-slate-300">{c.patientName}</td>
            <td className="p-4 border border-slate-300">
              {getAge(new Date(c.patientDob || ""))}
            </td>
            <td className="p-4 border border-slate-300">{c.type}</td>
            <td className="p-4 border border-slate-300">
              <RequestTimer id={c.id} />
            </td>
            <td className="p-4 border border-slate-300 space-x-1">
              <Form method="POST">
                <input type="hidden" value={c.id} name="consultationId" />
                <button
                  className="bg-pink-500 p-2 border rounded-md text-white"
                  name="_action"
                  value="accept"
                  type="submit"
                >
                  Accept
                </button>
                <button
                  className="bg-red-500 p-2 border rounded-md text-white"
                  name="_action"
                  type="submit"
                  value="decline"
                >
                  Decline
                </button>
              </Form>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
