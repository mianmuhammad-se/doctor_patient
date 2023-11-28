import {
  type LoaderFunctionArgs,
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "../../db";
import { usersTable } from "db/schema";
import { and, eq } from "drizzle-orm";
import { getSession, commitSession } from "~/session";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get session information
  const session = await getSession(request.headers.get("Cookie"));
  let role = session.get("userRole");
  // If user is logged in,
  if (session.has("userId")) {
    const path = role === "DOCTOR" ? "/doctor" : "/patient";
    return redirect(path);
  }
  const data = { error: session.get("error") };

  return json(data, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
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
  const user = await db.query.usersTable.findFirst({
    where: and(eq(usersTable.email, email)),
  });

  if (!user) {
    session.flash("error", "No user found.");
    return redirect("/", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  // Make proper changes to session
  session.set("userId", user.id);
  session.set("userRole", user.role);

  // Now we have the user so set the cookie and redirect to /dashboard
  //
  if (user.role == "DOCTOR") {
    return redirect("/doctor", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    return redirect("/patient", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex items-center justify-center">
      <Form method="post" className="flex flex-col justify-center p-4 border">
        <div className="p-2">
          <label htmlFor="email" className="block">
            Email
          </label>
          <input
            type="email"
            placeholder="email"
            name="email"
            className="p-2"
          />
        </div>
        <div className="flex w-full space-x-2">
          <button
            type="submit"
            name="role"
            value="DOCTOR"
            className="px-4 py-2 bg-sky-500 rounded-sm text-white"
          >
            Login As Doctor
          </button>
          <button
            type="submit"
            name="role"
            value="PATIENT"
            className="px-4 py-2 bg-sky-500 rounded-sm text-white"
          >
            Login As Patient
          </button>
        </div>
      </Form>
    </div>
  );
}
