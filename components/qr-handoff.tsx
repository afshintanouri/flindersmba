import { useMemo } from "react";
import { encode } from "uqr";

/** Builds one SVG path for the dark modules (no external QR service, no innerHTML). */
function qrPath(text: string): { d: string; size: number } {
  const qr = encode(text, { ecc: "M", border: 4 });
  let d = "";
  qr.data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return { d, size: qr.size };
}

/**
 * "Take your MBA future with you": a client-side QR code of the existing v2
 * share URL (no personal data, no backend, no account).
 */
export function QrHandoff({ url }: { url: string }) {
  const qr = useMemo(() => {
    try {
      return qrPath(url);
    } catch {
      return null;
    }
  }, [url]);
  return (
    <section className="handoff" aria-labelledby="handoff-heading">
      <div>
        <h2 className="micro" id="handoff-heading">
          TAKE YOUR MBA FUTURE WITH YOU
        </h2>
        <p>Scan to continue on your phone.</p>
        <p className="note">The code opens your result in your phone’s browser. It contains your choices only, never personal details.</p>
      </div>
      {qr ? (
        <svg
          className="qr"
          role="img"
          aria-label="QR code that opens your MBA future on your phone"
          viewBox={`0 0 ${qr.size} ${qr.size}`}
          shapeRendering="crispEdges"
          data-url={url}
        >
          <rect width={qr.size} height={qr.size} fill="#fff" />
          <path d={qr.d} fill="#182138" />
        </svg>
      ) : (
        <p className="note" role="status">
          The QR code could not be created on this screen. Use Share or Save instead.
        </p>
      )}
    </section>
  );
}
