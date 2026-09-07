import Image from "next/image";
import styles from "./ingot-scene.module.css";

/**
 * Hero for /exchange: the tin belt itself, shot rather than drawn. A landscape
 * rather than a trading floor, because the argument the page is making is about
 * Nigeria's own endowment. The only motion is a slow push-in.
 */
export function IngotScene({
  caption = "Jos Plateau · Nigeria's tin belt",
}: {
  caption?: string;
}) {
  return (
    <figure className={styles.scene}>
      <Image
        src="/exchange/hero-plateau.jpg"
        alt="Aerial view of alluvial tin workings and mining ponds on the Jos Plateau at golden hour"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 45vw"
        className={styles.photo}
      />
      <div className={styles.veil} aria-hidden />
      <figcaption className={styles.caption}>
        <span className={styles.pulse} aria-hidden />
        {caption}
      </figcaption>
    </figure>
  );
}
