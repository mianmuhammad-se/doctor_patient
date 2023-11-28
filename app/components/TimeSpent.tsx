import React, { useEffect, useState } from "react";

export const TimeSpent: React.FC<{ start?: number; end?: number }> = ({
  start,
  end,
}) => {
  let [time, setTime] = useState("00:00");
  let now = Date.now();
  let [endTime, setEndTime] = useState<number>(now);

  useEffect(() => {
    if (start && !end) {
      const id = setInterval(() => {
        setEndTime(Date.now());
      }, 1000);

      return clearInterval(id);
    }
  }, [end]);

  console.log({ start, end });

  useEffect(() => {
    let diff = ((start || now) - endTime) / 1000;
    let minutes = Math.floor(diff / 60);
    diff -= diff - minutes * 60;
    let seconds = diff % 60;
    setTime(`${minutes}:${seconds}`);
  }, [start, end]);

  return <span className="font-semibold">{time}</span>;
};
