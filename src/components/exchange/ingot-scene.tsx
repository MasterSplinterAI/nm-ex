import styles from "./ingot-scene.module.css";

type Metal = {
  name: string;
  label: string;
  face: string;
  side: string;
  top: string;
  glow: string;
  delay: string;
  x: string;
  y: string;
  scale: number;
};

const METALS: Metal[] = [
  { name: "tin", label: "Sn 99.95", face: "#c9d3d6", side: "#8f9ea3", top: "#eef3f4", glow: "rgba(200,212,216,0.35)", delay: "0s", x: "4%", y: "18%", scale: 1.15 },
  { name: "copper", label: "Cu 99.99", face: "#c47a4a", side: "#8a4f2c", top: "#e39a67", glow: "rgba(196,122,74,0.35)", delay: "-4s", x: "44%", y: "2%", scale: 0.95 },
  { name: "lead", label: "Pb 99.97", face: "#5e6670", side: "#3a4048", top: "#8b939c", glow: "rgba(94,102,112,0.35)", delay: "-8s", x: "62%", y: "50%", scale: 1.05 },
];

function Ingot({ m }: { m: Metal }) {
  return (
    <div
      className={styles.ingot}
      style={{ left: m.x, top: m.y, animationDelay: m.delay, ["--scale" as string]: m.scale, ["--glow" as string]: m.glow }}
    >
      <svg viewBox="0 0 240 120" className={styles.ingotSvg} aria-hidden>
        <polygon points="30,70 210,70 190,110 50,110" fill={m.face} />
        <polygon points="50,110 190,110 200,118 40,118" fill={m.side} opacity="0.9" />
        <polygon points="30,70 210,70 180,30 60,30" fill={m.top} />
        <polygon points="210,70 180,30 200,38 220,74" fill={m.side} />
        <rect x="70" y="42" width="100" height="16" fill="rgba(0,0,0,0.12)" />
        <text x="120" y="54" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="rgba(0,0,0,0.55)" letterSpacing="1.5">
          NM-EX · {m.label}
        </text>
        <polygon points="60,30 180,30 176,26 64,26" fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  );
}

/** Animated industrial scene: three floating ingots over a drift of concentrate particles. */
export function IngotScene() {
  const grains = Array.from({ length: 34 }, (_, i) => i);
  return (
    <div className={styles.scene} aria-hidden>
      <div className={styles.grid} />
      {grains.map((i) => (
        <span
          key={i}
          className={styles.grain}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${-(i * 0.7) % 14}s`,
            animationDuration: `${12 + (i % 5) * 2}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            opacity: 0.25 + ((i % 4) * 0.15),
          }}
        />
      ))}
      {METALS.map((m) => (
        <Ingot key={m.name} m={m} />
      ))}
      <div className={styles.heap}>
        <svg viewBox="0 0 400 120" className="h-full w-full">
          <defs>
            <linearGradient id="heap" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#4a4038" />
              <stop offset="1" stopColor="#1b1815" />
            </linearGradient>
          </defs>
          <path d="M0,120 C60,70 120,55 200,52 C280,49 340,80 400,120 Z" fill="url(#heap)" />
          <path d="M40,120 C90,90 150,80 200,78 C250,76 300,95 360,120 Z" fill="#2c2621" opacity="0.8" />
        </svg>
        <p className={styles.heapLabel}>Cassiterite concentrate · 70–78% Sn</p>
      </div>
    </div>
  );
}
