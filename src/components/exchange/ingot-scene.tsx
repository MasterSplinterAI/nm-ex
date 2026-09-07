import Image from "next/image";
import styles from "./ingot-scene.module.css";

/**
 * Hero for /exchange: refined tin on the pallet, shot rather than drawn. The
 * only motion is a slow push-in and a single specular pass, so it reads as a
 * photograph that happens to be alive rather than as an animation.
 */
export function IngotScene({ caption = "Refined tin · Sn 99.95 · NM-EX registered output" }: { caption?: string }) {
  return (
    <figure className={styles.scene}>
      <Image
        src="/exchange/hero-ingots.jpg"
        alt="Refined tin ingots stacked on a pallet in an NM-EX registered warehouse"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 45vw"
        className={styles.photo}
      />
      <div className={styles.sheen} aria-hidden />
      <div className={styles.veil} aria-hidden />
      <figcaption className={styles.caption}>
        <span className={styles.pulse} aria-hidden />
        {caption}
      </figcaption>
    </figure>
  );
}
