import * as React from "react";
import { useEventSource } from "remix-utils/sse/react";

export const RequestTimer: React.FC<{
  id: number;
}> = ({ id, type }) => {
  const data = useEventSource(`/decrement/${id}`);

  return <span className="font-semibold font-mono">{data || "??:??"}</span>;
};
