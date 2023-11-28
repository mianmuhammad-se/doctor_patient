import { type LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/events";

export const loader = ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id;
  console.log({ id });

  return eventStream(request.signal, (send) => {
    const handler = (timeRemaining: number | string) => {
      send({ data: `${timeRemaining}` });
    };

    const eventName = `/decrement/${id}`;

    emitter.addListener(eventName, handler);

    return () => {
      emitter.removeListener(eventName, handler);
    };
  });
};
