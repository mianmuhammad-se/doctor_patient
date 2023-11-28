import { EventEmitter } from "node:events";
import { getMinSecs } from "./utils";
import { db } from "../db";
import { consultationTable } from "db/schema";
import { eq } from "drizzle-orm";

export const emitter = new EventEmitter();

export const EVENTS = {
  CONSULTATION_ADDED: (id: number) => {
    addToQueue(id);
    emitter.emit("/doctor");
    emitter.emit(`/timers/added/${id}`);
  },
  CONSULTATION_DECLINED: (id: number) => {
    const value = QUEUE.find((v) => v.id == id);
    if (value) {
      clearInterval(value.intervalId);
      QUEUE = QUEUE.filter((v) => v.id !== id);
    }
    emitter.emit("/doctor");
    emitter.emit("/patient");
  },
  CONSULTATION_ACCEPTED: (id: number) => {
    const value = QUEUE.find((v) => v.id == id);
    if (value) {
      clearInterval(value.intervalId);
      QUEUE = QUEUE.filter((v) => v.id !== id);
    }
    emitter.emit("/doctor");
    emitter.emit("/patient");
  },
  CONSULTATION_SERVED: () => {
    emitter.emit("/doctor");
    emitter.emit("/patient");
  },
};

// On add event start decrementing the counter
//
let QUEUE: Array<{ id: number; intervalId: NodeJS.Timeout }> = [];

export const addToQueue = (id: number) => {
  let remaining = 300;
  let intervalId = setInterval(() => {
    if (remaining > 0) {
      remaining = remaining - 1;
      emitter.emit(`/decrement/${id}`, getMinSecs(remaining));
    } else {
      emitter.emit("EXPIRED", id, intervalId);
    }
  }, 1000);

  QUEUE.push({ id, intervalId });
};

emitter.on("EXPIRED", async (requestId, intervalId, ...args) => {
  clearInterval(intervalId);
  QUEUE = QUEUE.filter((v) => v.id !== requestId);
  await db
    .update(consultationTable)
    .set({ status: "EXPIRED" })
    .where(eq(consultationTable.id, Number(requestId)));
});
