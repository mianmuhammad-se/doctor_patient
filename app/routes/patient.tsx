import {
  type LoaderFunctionArgs,
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "../../db";
import { consultationTable, usersTable } from "db/schema";
import { getSession, commitSession } from "~/session";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import { useLiveLoader } from "~/useLiveLoader";
import { RequestTimer } from "~/components/RequestTimer";
import { TimeSpent } from "~/components/TimeSpent";

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

  const patientRequestsQuery = db
    .select({
      id: consultationTable.id,
      status: consultationTable.status,
      patientMessage: consultationTable.patientMessage,
      doctorNotes: consultationTable.doctorNotes,
      doctorName: usersTable.name,
      created: consultationTable.created,
      startTime: consultationTable.startTime,
      endTime: consultationTable.endTime,
    })
    .from(consultationTable)
    .leftJoin(usersTable, eq(consultationTable.doctorId, usersTable.id))
    .where(
      and(
        ne(consultationTable.status, "DECLINED"),
        ne(consultationTable.status, "EXPIRED"),
        eq(consultationTable.patientId, id),
        sql`${consultationTable.created} > datetime('now', '-5 minutes')`,
      ),
    )
    .orderBy(desc(consultationTable.created));

  const [user, patientRequests] = await Promise.all([
    userQuery,
    patientRequestsQuery,
  ]);

  if (!user) {
    return redirect("/");
  }

  return json({ user, patientRequests });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const email = formData.get("email");
  const role = formData.get("role");

  if (!email || typeof email !== "string") {
    session.flash("error", "Valid email is required.");

    return redirect("/", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  if (
    !role ||
    typeof role !== "string" ||
    !["DOCTOR", "PATIENT"].includes(role)
  ) {
    session.flash("error", "Valid user Type is required.");
    return redirect("/", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Patient Portal" },
    { name: "description", content: "Welcome to your patient portal!" },
  ];
};

const statusClass: Record<
  "IN_PROGRESS" | "DECLINED" | "EXPIRED" | "ACCEPTED" | "SERVED",
  string
> = {
  IN_PROGRESS: "border border-blue-300 bg-blue-300",
  DECLINED: "border border-red-500 bg-red-500",
  EXPIRED: "border border-red-500 bg-red-500",
  ACCEPTED: "border border-green-500 bg-green-500",
  SERVED: "border border-blue-500 bg-blue-500",
};
export default function Index() {
  const { user, patientRequests } = useLiveLoader<typeof loader>();
  return (
    <div className="w-screen h-screen flex flex-col items-center">
      <div className="flex items-center justify-between border shadow-sm bg-gray-50 w-1/2 p-4">
        <h1 className="font-semibold">
          Welcom to your patient portal {user.name}{" "}
        </h1>
        <Link
          to="book-consultation"
          className="bg-pink-500 rounded-sm p-2 text-white"
        >
          Book Consultation
        </Link>
      </div>
      <div className="w-full flex flex-col justify-center my-4">
        {patientRequests.map((r) => (
          <div
            className="flex flex-col justify-center border shadow-sm bg-gray-50 p-4"
            key={r.id}
          >
            <div className="border-b flex justify-between items-center py-2">
              <div className="flex items-center w-1/2">
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-white px-2 py-1 ${statusClass[r.status]}`}
                  >
                    {r.status.split("_").join(" ")}
                  </span>
                  <span className="font-semibold mr-2">Doctor:</span>
                  <span>{r.doctorName}</span>
                </div>
              </div>
              <span className="font-semibold mr-2">
                Consultation Time:{" "}
                <TimeSpent
                  start={r.startTime ? Number(r.startTime) : undefined}
                  end={r.endTime ? Number(r.endTime) : undefined}
                />
              </span>
              <span className="font-semibold">
                Timer: <RequestTimer id={r.id} />
              </span>
            </div>
            <div className="my-2">
              <span className="block font-semibold">Message:</span>
              <p className="font-normal w-full">{r.patientMessage}</p>
            </div>
            {r.doctorNotes ? (
              <div className="my-2">
                <span className="font-semibold">Doctor Notes:</span>
                <p className="w-full whitespace-normal">
                  {r.doctorNotes || ""}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
