import { useLoaderData, useLocation, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";

export function useLiveLoader<T>() {
  const { pathname: eventName } = useLocation();
  const data = useEventSource(`/events/${eventName}`);

  const { revalidate } = useRevalidator();

  useEffect(() => {
    revalidate();
  }, [data]);

  return useLoaderData<T>();
}
