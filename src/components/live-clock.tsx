"use client";

import { useEffect, useState } from "react";

const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type Props = {
  className?: string;
};

export function LiveClock({ className = "" }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      dateTime={now?.toISOString()}
      title="West Africa Time · Lagos"
      className={`tabular-nums ${className}`.trim()}
    >
      {now ? `${time.format(now)} WAT` : "—:—:— WAT"}
    </time>
  );
}
