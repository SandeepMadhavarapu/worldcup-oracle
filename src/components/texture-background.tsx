import Image from "next/image";

import bracketTexture from "../../public/images/texture-bracket.webp";
import meshTexture from "../../public/images/texture-mesh.webp";

const textures = {
  mesh: meshTexture,
  bracket: bracketTexture,
} as const;

/**
 * A fixed, full-viewport decorative texture rendered at ~8% opacity behind all
 * page content. It sits above the dark body canvas (`-z-10`) but below the
 * page's content layer, and is lazy-loaded via `next/image`.
 */
export function TextureBackground({
  variant,
}: {
  variant: keyof typeof textures;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Image
        src={textures[variant]}
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        className="object-cover opacity-[0.08]"
      />
    </div>
  );
}
