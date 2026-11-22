/**
 * DEVELOPMENT ONLY. Not imported by any component; never shipped in the UI.
 * Produces a readable score table for reviewing Matchmaker behaviour.
 */
import { getProgram } from "@/content";
import { matchProgrammes, type Selections } from "./matchmaker";

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const num = (n: number) => n.toFixed(1).padStart(5);

export function diagnose(sel: Selections, title = "Matchmaker diagnostics"): string {
  const r = matchProgrammes(sel);
  const lines = [
    `== ${title}`,
    `   selections: ${[...sel.ambitions.map((a) => "A:" + a), ...sel.interests.map((i) => "I:" + i), ...sel.experiences.map((e) => "E:" + e)].join(", ") || "(none)"}`,
    `   classification: ${r.classification} | lead over second: ${r.leadOverSecond.toFixed(1)} | active: ${r.activeDimensions.join("+") || "none"}`,
    `   ${pad("programme", 30)} ambit  inter  prefs  TOTAL  matched signals`,
  ];
  for (const s of r.ranked) {
    lines.push(
      `   ${pad(getProgram(s.programId).name, 30)}${num(s.normalised.ambitions * 100)}  ${num(s.normalised.interests * 100)}  ${num(s.normalised.preferences * 100)}  ${num(s.total)}  ${s.matched
        .map((m) => `${m.signal.split(":")[1]}=${m.weight}${m.conditional ? "*" : ""}`)
        .join(" ")}`,
    );
  }
  for (const t of r.tieBreaks) lines.push(`   tie-break: ${t.winner} over ${t.loser} (${t.reason})`);
  lines.push(`   recommendations: ${r.recommendations.map((x) => `${x.label} → ${x.programId} [${x.reasons.map((y) => y.id).join(", ")}]`).join(" | ") || "(none)"}`);
  if (r.shared.length) lines.push(`   shared (0 points): ${r.shared.map((s) => s.experienceId).join(", ")}`);
  return lines.join("\n");
}
