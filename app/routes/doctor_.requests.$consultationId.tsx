import {
  type LoaderFunctionArgs,
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { getAge } from "~/utils";
import { Form, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { consultationTable, usersTable } from "db/schema";
import { getSession } from "~/session";
import { EVENTS } from "~/events";
import { TimeSpent } from "~/components/TimeSpent";

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
  const consultationsQ = db
    .select({
      id: consultationTable.id,
      patientMessage: consultationTable.patientMessage,
      type: consultationTable.type,
      status: consultationTable.status,
      created: consultationTable.created,
      patientName: usersTable.name,
      patientDob: usersTable.dob,
      startTime: consultationTable.startTime,
      endTime: consultationTable.endTime,
    })
    .from(consultationTable)
    .leftJoin(usersTable, eq(consultationTable.patientId, usersTable.id))
    .where(eq(consultationTable.doctorId, id))
    .limit(1);

  const [consultations] = await Promise.all([consultationsQ]);

  return json({ consultation: consultations[0] });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const id = session.get("userId");
  const role = session.get("userRole");

  if (!id || !role) {
    return redirect("/");
  }

  const formData = await request.formData();
  const { doctorNotes, consultationId } = Object.fromEntries(formData);

  if (!doctorNotes || typeof doctorNotes !== "string") {
    return json({ error: "Invalid doctor Notes" });
  }
  await db
    .update(consultationTable)
    .set({ doctorNotes, status: "SERVED" })
    .where(eq(consultationTable.id, Number(consultationId)));

  EVENTS.CONSULTATION_SERVED();

  return redirect("/doctor");
};

export const meta: MetaFunction = () => {
  return [
    { title: "Patient Message" },
    { name: "description", content: "Welcome to your portal!" },
  ];
};

export default function Index() {
  const { consultation } = useLoaderData<typeof loader>();
  return (
    <div className="flex w-screen flex-col justify-center items-center">
      <div className="my-4 border shadow p-4 w-full">
        <div className="flex items-center justify-between">
          <div className="font-semibold">
            Patient: {consultation.patientName}
          </div>
          <div>Age: {getAge(new Date(consultation.patientDob || ""))}</div>
          <div>
            {consultation.startTime ? (
              <TimeSpent
                start={
                  consultation?.startTime
                    ? Number(consultation.startTime)
                    : undefined
                }
                end={
                  consultation?.endTime
                    ? Number(consultation.endTime)
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
        <div>
          <span className="font-semibold">Patient Message</span>
          <p>{consultation.patientMessage}</p>
        </div>
        <Form method="POST" className="flex flex-col">
          <input type="hidden" name="consultationId" value={consultation.id} />
          <label htmlFor="name">Your Notes Doctor?</label>
          <textarea name="doctorNotes" className="border p-2" />
          <button type="submit" className="bg-pink-500 rounded-md p-4 mt-2">
            Save
          </button>
        </Form>
      </div>
    </div>
  );
}
