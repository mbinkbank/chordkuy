import { useEffect, useState } from "react";
import { useRoute } from "../lib/router";

const MOBILE_SIZE = { w: 320, h: 50 };
const DESKTOP_SIZE = { w: 728, h: 90 };

export default function StickyAd() {
  const [closed, setClosed] = useState(false);
  const route = useRoute();

  useEffect(() => {
    setClosed(false);
  }, [route.pathname]);

  if (closed) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99998,
        background: "rgba(255, 255, 255, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "8px 12px",
      }}
      className="chordkuy-sticky-ad"
    >
      <button
        type="button"
        aria-label="Tutup iklan"
        onClick={() => setClosed(true)}
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          background: "rgba(248, 248, 249, 0.9)",
          border: "none",
          padding: 4,
          borderRadius: 4,
          cursor: "pointer",
          lineHeight: 0,
        }}
      >
        <svg fill="#000" height="14" width="14" viewBox="0 0 490 490" xmlns="http://www.w3.org/2000/svg"><polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337" /></svg>
      </button>
      <iframe
        data-aa={2454911}
        src="//acceptable.a-ads.com/2454911/?size=Adaptive"
        title="Sponsored"
        style={{
          border: 0,
          padding: 0,
          background: "transparent",
          overflow: "hidden",
        }}
      />
      <style>{`
        .chordkuy-sticky-ad {
          height: ${DESKTOP_SIZE.h}px;
          padding: 0;
          overflow: hidden;
        }
        .chordkuy-sticky-ad iframe {
          display: block;
          width: ${DESKTOP_SIZE.w}px;
          height: ${DESKTOP_SIZE.h}px;
        }
        @media (max-width: 480px) {
          .chordkuy-sticky-ad {
            height: ${MOBILE_SIZE.h}px;
          }
          .chordkuy-sticky-ad iframe {
            width: ${MOBILE_SIZE.w}px;
            height: ${MOBILE_SIZE.h}px;
          }
        }
        @media print {
          .chordkuy-sticky-ad { display: none !important; }
        }
      `}</style>
    </div>
  );
}
