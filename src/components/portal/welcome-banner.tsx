import Image from "next/image";
import { formatWelcomeStamp } from "@/lib/format";

export function WelcomeBanner({
  name,
  nowIso,
  lede,
}: {
  name: string;
  nowIso: string;
  lede?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      <Image
        src="/portal/welcome-jos-plateau.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1120px"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/10" />
      <div className="relative flex min-h-[8.5rem] flex-col justify-end px-5 py-5 sm:min-h-[10rem] sm:px-7 sm:py-6">
        <h1 className="font-display text-2xl tracking-tight text-white sm:text-3xl">Welcome, {name}</h1>
        <p className="mt-1 text-sm text-white/85">{formatWelcomeStamp(nowIso)}</p>
        {lede && <p className="mt-2 max-w-xl text-sm text-white/75">{lede}</p>}
      </div>
    </section>
  );
}
