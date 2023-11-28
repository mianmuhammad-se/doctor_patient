import { type LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/events";

export const loader = ({ request, params }: LoaderFunctionArgs) => {
  const path = `${params["*"]}`;

  console.log(path);

  return eventStream(request.signal, (send) => {
    const handler = () => {
      send({ data: Date.now().toString() });
    };

    emitter.addListener(path, handler);

    return () => {
      emitter.removeListener(path, handler);
    };
  });
};
