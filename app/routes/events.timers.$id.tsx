import { type LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/events";

export const loader = ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id!;

  return eventStream(request.signal, (send) => {
    let intervalId: number;
    const addHandler = () => {
      let remainingSeconds = 300;
      // @ts-ignore
      intervalId = setInterval(() => {
        remainingSeconds = remainingSeconds - 1;
        if (remainingSeconds > 0) {
          send({ data: remainingSeconds.toString() });
        } else {
        }
      }, 1000);
    };

    emitter.addListener(`/timers/${id}/added`, addHandler);

    return () => {
      emitter.removeListener(`/timers/${id}/added`, addHandler);
      clearInterval(intervalId);
    };
  });
};
