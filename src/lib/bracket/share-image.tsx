// Renders a 1200x630 share card for a bracket using next/og (Satori).
// Satori supports only flexbox and a subset of CSS, so every multi-child
// container sets display:flex and spacing uses margins (not grid/gap). No
// custom font is supplied — next/og's built-in default font is used.

import { ImageResponse } from "next/og";

import type { BracketShareModel } from "@/lib/bracket/share-model";
import type { VerdictTone } from "@/lib/bracket/verdict";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const SHARE_IMAGE_ALT = "WorldCup Oracle bracket share card";
export const SHARE_IMAGE_CONTENT_TYPE = "image/png";

const NAVY_BACKGROUND =
  "linear-gradient(135deg, #04101f 0%, #07140f 58%, #03140d 100%)";

const pillPalette: Record<
  VerdictTone,
  { text: string; background: string; border: string }
> = {
  chalk: {
    text: "#6ee7b7",
    background: "rgba(52,211,153,0.14)",
    border: "rgba(52,211,153,0.5)",
  },
  balanced: {
    text: "#67e8f9",
    background: "rgba(103,232,249,0.14)",
    border: "rgba(103,232,249,0.5)",
  },
  bold: {
    text: "#fcd34d",
    background: "rgba(252,211,77,0.16)",
    border: "rgba(252,211,77,0.55)",
  },
  longshot: {
    text: "#fda4af",
    background: "rgba(253,164,175,0.16)",
    border: "rgba(253,164,175,0.55)",
  },
};

function BrandHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "9999px",
            backgroundColor: "#34d399",
            marginRight: "14px",
          }}
        />
        <div
          style={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "6px",
            color: "#6ee7b7",
          }}
        >
          WORLDCUP ORACLE
        </div>
      </div>
      <div style={{ fontSize: "22px", letterSpacing: "3px", color: "#94a3b8" }}>
        BRACKET
      </div>
    </div>
  );
}

function fallbackCard() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          color: "#ffffff",
          backgroundColor: "#06101d",
          backgroundImage: NAVY_BACKGROUND,
        }}
      >
        <BrandHeader />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "64px", fontWeight: 800, color: "#ffffff" }}>
            Bracket not found
          </div>
          <div style={{ fontSize: "28px", color: "#94a3b8", marginTop: "12px" }}>
            This shared bracket is no longer available.
          </div>
        </div>
        <div style={{ fontSize: "18px", color: "#64748b", display: "flex" }}>
          Educational model · not betting advice
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE },
  );
}

export function renderBracketShareImage(
  model: BracketShareModel | null,
): ImageResponse {
  if (!model) {
    return fallbackCard();
  }

  const pill = pillPalette[model.verdict.tone];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          color: "#ffffff",
          backgroundColor: "#06101d",
          backgroundImage: NAVY_BACKGROUND,
        }}
      >
        <BrandHeader />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "24px",
              letterSpacing: "5px",
              color: "#64748b",
              marginBottom: "12px",
            }}
          >
            CHAMPION PICK
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "60px",
                borderRadius: "6px",
                backgroundColor: model.championAccent,
                marginRight: "22px",
              }}
            />
            <div style={{ fontSize: "78px", fontWeight: 800, color: "#ffffff" }}>
              {model.championName}
            </div>
          </div>
          <div style={{ fontSize: "30px", color: "#cbd5e1", marginBottom: "20px" }}>
            {`Finalist: ${model.finalistName ?? "Open pick"}`}
          </div>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "9999px",
                padding: "12px 24px",
                fontSize: "30px",
                fontWeight: 700,
                color: pill.text,
                backgroundColor: pill.background,
                border: `2px solid ${pill.border}`,
              }}
            >
              {model.verdict.tag}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: "8px",
              }}
            >
              {`${model.name}'s bracket`}
            </div>
            <div style={{ fontSize: "24px", color: "#94a3b8" }}>
              {`Model gives ${model.championCode} ${model.championOdds} to win it all`}
            </div>
          </div>
          <div style={{ fontSize: "18px", color: "#64748b", display: "flex" }}>
            Educational model · not betting advice
          </div>
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE },
  );
}
