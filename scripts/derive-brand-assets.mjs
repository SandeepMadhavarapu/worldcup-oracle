// Derive all brand assets (PWA icons, OG card, WebP variants) from the
// downloaded master PNGs in public/images. Idempotent and re-runnable:
//
//   npm run derive:assets
//
// Inputs (untracked masters — assets-src/ is gitignored, not needed to build):
//   assets-src/stadium-oracle-hero.png   (the hero / source of truth)
//   assets-src/texture-mesh.png
//   assets-src/texture-bracket.png
//
// Outputs (committed build inputs, safe to delete and regenerate):
//   public/icons/icon-192.png
//   public/icons/icon-512.png
//   public/icons/icon-512-maskable.png
//   public/og-card.png
//   public/images/stadium-oracle-hero.webp
//   public/images/texture-mesh.webp
//   public/images/texture-bracket.webp

import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsSrcDir = join(root, "assets-src");
const imagesDir = join(root, "public", "images");
const iconsDir = join(root, "public", "icons");

const srcImage = (name) => join(assetsSrcDir, name);
const outImage = (name) => join(imagesDir, name);
const outPublic = (...parts) => join(root, "public", ...parts);

const HERO = srcImage("stadium-oracle-hero.png");
const MESH = srcImage("texture-mesh.png");
const BRACKET = srcImage("texture-bracket.png");

// Navy used for the maskable safe-zone backdrop and text scrim.
const NAVY = "#040a19";

// Focal point of the glowing football orb at center pitch, expressed as a
// fraction of the hero dimensions. The orb is dead-center horizontally and
// sits a little below the vertical midpoint.
const ORB = { fx: 0.5, fy: 0.57 };

/**
 * Compute a square crop centered on a focal point, clamped to image bounds.
 */
function squareCrop(width, height, side, fx, fy) {
  const size = Math.min(side, width, height);
  const left = Math.max(0, Math.min(Math.round(fx * width - size / 2), width - size));
  const top = Math.max(0, Math.min(Math.round(fy * height - size / 2), height - size));
  return { left, top, width: size, height: size };
}

/**
 * Compute a crop of a given aspect ratio centered on a focal point.
 */
function aspectCrop(width, height, aspect, fx, fy) {
  let cw = Math.round(height * aspect);
  let ch = height;
  if (cw > width) {
    cw = width;
    ch = Math.round(width / aspect);
  }
  const left = Math.max(0, Math.min(Math.round(fx * width - cw / 2), width - cw));
  const top = Math.max(0, Math.min(Math.round(fy * height - ch / 2), height - ch));
  return { left, top, width: cw, height: ch };
}

async function assertExists(path) {
  try {
    await stat(path);
  } catch {
    throw new Error(`Missing required master image: ${path}`);
  }
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) =>
    char === "<"
      ? "&lt;"
      : char === ">"
        ? "&gt;"
        : char === "&"
          ? "&amp;"
          : char === "'"
            ? "&apos;"
            : "&quot;",
  );
}

async function deriveIcons() {
  const { width, height } = await sharp(HERO).metadata();
  // A square framing the orb plus its surrounding particle swirl.
  const crop = squareCrop(width, height, 1500, ORB.fx, ORB.fy);
  const orb = sharp(HERO).extract(crop);

  await orb.clone().resize(512, 512).png().toFile(join(iconsDir, "icon-512.png"));
  await orb.clone().resize(192, 192).png().toFile(join(iconsDir, "icon-192.png"));

  // Maskable icon: content lives inside the central 80% safe zone, padded
  // with the navy theme color so platform masks never clip the orb.
  const safe = Math.round(512 * 0.8); // 410px
  const inner = await orb.clone().resize(safe, safe).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: NAVY },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(join(iconsDir, "icon-512-maskable.png"));

  return crop;
}

async function deriveOgCard() {
  const { width, height } = await sharp(HERO).metadata();
  const crop = aspectCrop(width, height, 1200 / 630, ORB.fx, ORB.fy);
  const base = await sharp(HERO)
    .extract(crop)
    .resize(1200, 630)
    .toBuffer();

  const title = escapeXml("WorldCup Oracle");
  const subtitle = escapeXml("Monte Carlo predictions that explain themselves");
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${NAVY}" stop-opacity="0.15" />
          <stop offset="0.5" stop-color="${NAVY}" stop-opacity="0.55" />
          <stop offset="1" stop-color="${NAVY}" stop-opacity="0.96" />
        </linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${NAVY}" stop-opacity="0.75" />
          <stop offset="0.6" stop-color="${NAVY}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#scrim)" />
      <rect width="1200" height="630" fill="url(#side)" />
      <text x="80" y="486" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="700" fill="#ffffff" letter-spacing="-1">${title}</text>
      <text x="82" y="548" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="500" fill="#cbd5e1">${subtitle}</text>
    </svg>`,
  );

  await sharp(base)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(outPublic("og-card.png"));
}

async function deriveWebp() {
  // Web-optimized WebP variants alongside the PNG masters. next/image
  // re-optimizes per viewport at request time; these are the static sources.
  await sharp(HERO)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outImage("stadium-oracle-hero.webp"));
  await sharp(MESH)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outImage("texture-mesh.webp"));
  await sharp(BRACKET)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outImage("texture-bracket.webp"));
}

async function main() {
  await Promise.all([assertExists(HERO), assertExists(MESH), assertExists(BRACKET)]);
  await mkdir(iconsDir, { recursive: true });

  await deriveIcons();
  await deriveOgCard();
  await deriveWebp();

  console.log("Brand assets derived:");
  console.log("  public/icons/icon-192.png");
  console.log("  public/icons/icon-512.png");
  console.log("  public/icons/icon-512-maskable.png");
  console.log("  public/og-card.png");
  console.log("  public/images/stadium-oracle-hero.webp");
  console.log("  public/images/texture-mesh.webp");
  console.log("  public/images/texture-bracket.webp");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
