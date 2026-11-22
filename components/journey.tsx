import { useEffect, useState } from "react";
import { Download, Share2, ArrowUpRight, Route } from "lucide-react";
import {
  getAmbition,
  getCareerDirection,
  getExperience,
  getInterest,
  getProgram,
  programCourseUrl,
  programCredentialLabels,
} from "@/content";
import type { ProgramId } from "@/content/types";
import type { Journey } from "@/lib/journey";
import { leadingProgram, matchProgrammes, type MatchResult } from "@/lib/matchmaker";
import { encodeShare, shareUrl } from "@/lib/share";
import { QrHandoff } from "./qr-handoff";
import { JourneyContact } from "./contact";
import { contactCopy } from "@/content/contact";
import { Frame, Action, Chips, type Go } from "./elements";
import { icon } from "./icons";
/** Prototype "personal edition" number shown on the poster and PNG card. */
const edition = (id: ProgramId) => String(getProgram(id).legacyIndex + 1).padStart(2, "0");
async function saveCard(p: Journey) {
  await document.fonts.ready;
  const r = matchProgrammes(p),
    id = leadingProgram(r),
    canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 3200;
  const c = canvas.getContext("2d");
  if (!c) throw Error();
  c.fillStyle = "#232D4B";
  c.fillRect(0, 0, 1080, canvas.height);
  c.fillStyle = "#FFD300";
  c.strokeStyle = '#FFD300';
  c.lineWidth = 20;
  for (const radius of [90, 135, 180, 225]) {
    c.beginPath();
    c.arc(1080, 0, radius, 0, Math.PI * 2);
    c.stroke();
  }
  let y = 105;
  const text = (
    s: string,
    size: number,
    color: string,
    font = "Barlow",
    line = size * 1.18,
  ) => {
    c.fillStyle = color;
    c.font = `${font === "Display" ? "700" : "400"} ${size}px ${font}`;
    let row = "";
    for (const w of s.split(" ")) {
      if (c.measureText(row + " " + w).width > 930 && row) {
        c.fillText(row, 70, y);
        y += line;
        row = w;
      } else row += (row ? " " : "") + w;
    }
    c.fillText(row, 70, y);
    y += line;
  };
  text(`FLINDERS UNIVERSITY  /  PERSONAL EDITION ${edition(id)}`, 26, 'white');
  y += 80;
  text("MY MBA FUTURE.", 105, "#FFD300", "Display");
  y += 30;
  text(cardLabel(r), 25, "#FFD300");
  for (const name of featuredNames(r)) text(name.toUpperCase(), 77, "white", "Display");
  for (const [label, val] of sections(p)) {
    if (!val.length) continue;
    y += 25;
    text(label.toUpperCase(), 21, "#FFD300");
    text(val.join("  ·  "), 27, "white");
  }
  c.fillStyle = "#FFD300";
  const footer = Math.max(1320, y + 45);
  c.fillRect(70, footer, 940, 3);
  c.fillStyle = "white";
  c.font = "24px Barlow";
  c.fillText("FLINDERS MBA   /   BUILD YOUR MBA FUTURE", 70, footer + 55);
  const output = document.createElement("canvas");
  output.width = 1080;
  output.height = footer + 95;
  output.getContext("2d")?.drawImage(canvas, 0, 0);
  const blob = await new Promise<Blob | null>((r) =>
    output.toBlob(r, "image/png"),
  );
  if (!blob) throw Error();
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "my-flinders-mba-future.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
/** Career Directions shown on My MBA Future (most recent first, up to 8). */
const recentVisits = (p: Journey) => [...p.visits].reverse().slice(0, 8);
/** Label for the leading result on the poster and PNG card. */
function cardLabel(r: MatchResult) {
  return r.classification === "clear" ? "YOUR STRONGEST MATCH" : r.classification === "close" ? "YOUR STRONG MATCHES" : "WORTH EXPLORING";
}
/** Programme names featured on the PNG card. */
function featuredNames(r: MatchResult) {
  const n = r.classification === "clear" ? 1 : r.classification === "close" ? 2 : 3;
  const ids = r.recommendations.length ? r.recommendations.map((x) => x.programId) : [leadingProgram(r)];
  return ids.slice(0, n).map((x) => getProgram(x).name);
}
function sections(p: Journey): [string, string[]][] {
  const r = matchProgrammes(p),
    id = leadingProgram(r),
    others = r.recommendations.slice(r.classification === "close" ? 2 : 1).map((x) => getProgram(x.programId).name);
  return [
    ...(r.classification === "close"
      ? [["Your strong matches", r.recommendations.slice(0, 2).map((x) => getProgram(x.programId).name)] as [string, string[]]]
      : []),
    ...(r.classification === "broad"
      ? [["Worth exploring", r.recommendations.map((x) => getProgram(x.programId).name)] as [string, string[]]]
      : [["Also worth exploring", others] as [string, string[]]]),
    ["Your ambitions", p.ambitions.map((i) => getAmbition(i).label)],
    ["Your interests", p.interests.map((i) => getInterest(i).label)],
    ["Experiences you chose", p.experiences.map((i) => getExperience(i).label)],
    ["Professional edge", programCredentialLabels(id)],
    ["Career directions explored", recentVisits(p).map((i) => getCareerDirection(i).title)],
  ];
}
/** sessionStorage key recording that the My MBA Future finale has played. */
const FINALE_KEY = "flinders-mba-finale";
/** Larger screens (laptop, tablet landscape, display) where a QR hand-off is useful. */
const HANDOFF_QUERY = "(min-width: 1024px)";
function useLargeScreen() {
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(HANDOFF_QUERY);
    const update = () => setLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return large;
}
export function Journey({
  p,
  go,
  reset,
  kiosk = false,
}: {
  p: Journey;
  go: Go;
  reset: () => void;
  kiosk?: boolean;
}) {
  const [msg, setMsg] = useState(""),
    [link, setLink] = useState(""),
    [url, setUrl] = useState(""),
    large = useLargeScreen();
  useEffect(() => {
    if (p.complete) setUrl(shareUrl(location, p));
  }, [p]);
  const showQr = p.complete && !!url && (kiosk || large);
  // The staggered finale plays on the first arrival for a given result in this
  // session; revisits are immediate. Presentation only (no journey state).
  const [finale] = useState(() => {
    if (!p.complete) return false;
    try {
      return sessionStorage.getItem(FINALE_KEY) !== encodeShare(p);
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!p.complete) return;
    try {
      sessionStorage.setItem(FINALE_KEY, encodeShare(p));
    } catch {}
  }, [p]);
  const result = matchProgrammes(p),
    id = leadingProgram(result),
    m = getProgram(id),
    Icon = icon(m.icon);
  async function share() {
    const u = { href: shareUrl(location, p) };
    setLink("");
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My MBA Future",
          text:
            result.classification === "clear"
              ? "My MBA Future: " + m.name
              : "My MBA Future: " + featuredNames(result).join(", "),
          url: u.href,
        });
        return;
      }
      await navigator.clipboard.writeText(u.href);
      setMsg("Your personalised share link has been copied.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      // No Web Share and no clipboard: offer the link to copy by hand.
      setMsg("Copy your personalised link below.");
      setLink(u.href);
    }
  }
  return (
    <Frame
      back={() => go("home")}
      className={finale ? "journey-page finale" : "journey-page"}
      label="YOUR PERSONAL DISCOVERY"
      title={p.complete ? "My MBA future." : "My journey."}
      desc={
        p.complete
          ? "Your ambitions, your match and your next possibilities."
          : "Your selections stay on this device. Pick up where you left off."
      }
    >
      {p.complete ? (
        <>
          <div className="final-grid">
            <article className="poster">
              <div className="poster-mast micro">FLINDERS UNIVERSITY <span>PERSONAL EDITION / {edition(id)}</span></div>
              <Icon className="poster-icon" />
              <span className="micro">{cardLabel(result).replace("YOUR", "MY")}</span>
              <h2>
                MBA
                <br />
                {m.shortName}
              </h2>
              <p>{m.positioning.value}</p>
              <div className="poster-line">
                <span><b>MY MBA FUTURE</b><small>{p.interests.map(i => getInterest(i).label).join(' / ')}</small></span><ArrowUpRight />
              </div>
            </article>
            <div className="summary">
              {sections(p).map(
                ([k, items]) =>
                  items.length > 0 && (
                    <div key={k}>
                      <span className="micro">{k.toUpperCase()}</span>
                      <Chips items={items} />
                    </div>
                  ),
              )}
              {result.shared.length > 0 && (
                <div>
                  <span className="micro">ACROSS YOUR FLINDERS MBA</span>
                  <div className="reason-list">
                    {result.shared.map((x) => {
                      const SharedIcon = icon(getExperience(x.experienceId).icon);
                      return (
                        <span key={x.experienceId}>
                          <SharedIcon style={{ flexShrink: 0 }} />
                          {x.message}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {kiosk && showQr && <QrHandoff url={url} />}
          {kiosk && <p className="note kiosk-contact">{contactCopy.kiosk}</p>}
          <div className="actions">
            {!kiosk && (
            <button
              className="action"
              onClick={async () => {
                try {
                  await saveCard(p);
                  setMsg("Your personalised PNG is ready to download.");
                } catch {
                  setMsg(
                    "Image download is unavailable. You can screenshot your result instead.",
                  );
                }
              }}
            >
              <Download size={18} />
              Save my MBA future
            </button>
            )}
            {!kiosk && (
            <button className="action secondary" onClick={share}>
              <Share2 size={17} />
              Share
            </button>
            )}
            <a
              className="action secondary"
              href={programCourseUrl(id)}
              target="_blank"
              rel="noreferrer"
            >
              Explore official course page
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p role="status">{msg}</p>
          {!kiosk && showQr && <QrHandoff url={url} />}
          {!kiosk && <JourneyContact />}
          {link && (
            <label>
              Copy your personalised link
              <input
                className="share-input"
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
          <button className="text-link" onClick={() => go("options")}>
            Revisit my matches
          </button>
        </>
      ) : (
        <div className="info-panel">
          <Route />
          <h2>
            {p.ambitions.length
              ? "Your match is taking shape."
              : "Your future starts here."}
          </h2>
          <p>
            {p.ambitions.length
              ? `${p.ambitions.length} ambitions and ${p.interests.length} interests selected.`
              : "Start with what you want to do. Three short questions will connect your choices to an MBA."}
          </p>
          <div className="actions">
            <Action
              onClick={() => go(!p.ambitions.length ? "q1" : !p.interests.length ? "q2" : "q3")}
            >
              {p.ambitions.length ? "Continue matching" : "Start matching"}
            </Action>
            <Action secondary onClick={() => go("careers")}>
              Explore careers
            </Action>
          </div>
          {p.visits.length > 0 && (
            <>
              <h3>Career directions explored</h3>
              <Chips items={recentVisits(p).map((i) => getCareerDirection(i).title)} />
            </>
          )}
        </div>
      )}
      {(p.ambitions.length > 0 || p.visits.length > 0) && (
        <button className="reset" onClick={reset}>
          Start again
        </button>
      )}
    </Frame>
  );
}
