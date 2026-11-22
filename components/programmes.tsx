import { useState } from "react";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import {
  programs,
  getProgram,
  getAmbition,
  getInterest,
  getExperience,
  getProof,
  featuredCapabilityLabels,
  programCredentialLabels,
  programPromo,
  programPageExperienceIds,
  programRecognitionProofIds,
  matchmakerRules,
} from "@/content";
import type { ProgramId } from "@/content/types";
import type { Journey } from "@/lib/journey";
import { leadingProgram, matchProgrammes, type Reason, type SharedPersonalisation } from "@/lib/matchmaker";
import { paths } from "@/lib/routes";
import { Action, Chips, Frame, type Go } from "./elements";
import { icon } from "./icons";
/** "Why it fits" reason cards (existing choice-card styling). */
function Reasons({ reasons }: { reasons: Reason[] }) {
  return (
    <div className="choices">
      {reasons.map((r) => (
        <div className="choice" key={r.id}>
          <Check className="choice-symbol" />
          <div>
            <strong>{r.heading}</strong>
            <small>{r.text}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
/** Portfolio-wide experiences the visitor chose (personalisation only). */
export function SharedExperiences({ shared }: { shared: SharedPersonalisation[] }) {
  if (!shared.length) return null;
  return (
    <>
      <h3>Across your Flinders MBA</h3>
      <div className="reason-list">
        {shared.map((x) => {
          const Icon = icon(getExperience(x.experienceId).icon);
          return (
            <span key={x.experienceId}>
              <Icon style={{ flexShrink: 0 }} />
              {x.message}
            </span>
          );
        })}
      </div>
    </>
  );
}
const NOTE =
  "Your ambitions and interests carry the most weight. Experiences shared across the Flinders MBA personalise your result but do not change it. These are exploratory suggestions, not admission advice.";
export function Reveal({ p, go }: { p: Journey; go: Go }) {
  const r = matchProgrammes(p),
    recs = r.recommendations,
    single = r.classification === "clear",
    close = r.classification === "close",
    m = getProgram(leadingProgram(r)),
    // Recap of 3–4 of the visitor's real selections (interests first, then ambitions).
    recap = [...new Set([...p.interests.map((i) => getInterest(i).label), ...p.ambitions.map((a) => getAmbition(a).label)])].slice(
      0,
      Math.max(3, Math.min(4, p.interests.length)),
    );
  return (
    <>
      <section className={"reveal reveal-" + r.classification}>
        <div className="wrap">
          <div className="eyebrow">
            <i /> {single ? "YOUR STRONGEST MATCH" : close ? "YOUR STRONG MATCHES" : "YOUR MBA DIRECTIONS"}
          </div>
          {/* Storytelling order: the visitor's own choices, then where they point. */}
          <p className="micro reveal-step">BASED ON YOUR CHOICES…</p>
          <div className="chips reveal-recap">
            {recap.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <p className="micro reveal-step reveal-bridge">
            {single ? "THAT POINTS TO…" : close ? "YOUR CHOICES POINT IN TWO STRONG DIRECTIONS" : "YOUR INTERESTS CROSS SEVERAL MBA PATHWAYS"}
          </p>
          {single ? (
            <h1><span>MBA</span>{m.shortName}</h1>
          ) : close ? (
            <h1><span>YOU HAVE</span>TWO STRONG MATCHES.</h1>
          ) : (
            <h1><span>YOU’VE GOT</span>OPTIONS.</h1>
          )}
          <p className={"match-headline" + (single ? "" : " peers")}>
            {single
              ? m.headline.value
              : recs.length
                ? (close ? recs.slice(0, 2) : recs).map((x, i, all) => (
                    // Equal status: identical styling; close matches also share one timing.
                    <span key={x.programId}>
                      <span className="peer" style={close ? undefined : { animationDelay: `${0.95 + i * 0.12}s` }}>
                        {getProgram(x.programId).name}
                      </span>
                      {i < all.length - 1 && <span className="peer-join">{close ? " and " : " · "}</span>}
                    </span>
                  ))
                : "Explore the Flinders MBA portfolio."}
          </p>
          <button className="match-more" onClick={() => document.getElementById('match-fit')?.focus()}>Discover why it fits ↓</button>
        </div>
      </section>
      <section className="wrap frame">
        <h2 className="big" id="match-fit" tabIndex={-1}>{single ? "Why it fits you" : "Why they fit you"}</h2>
        {single ? (
          <>
            <p className="lead">{m.positioning.value}</p>
            <Reasons reasons={recs[0].reasons} />
          </>
        ) : (
          (close ? recs.slice(0, 2) : recs).map((x) => (
            <div key={x.programId}>
              <h3>{getProgram(x.programId).name}</h3>
              <Reasons reasons={x.reasons} />
            </div>
          ))
        )}
        <p className="note">{NOTE}</p>
        <SharedExperiences shared={r.shared} />
        <div className="actions">
          {single ? (
            <Action onClick={() => go(paths.mba(m.id))}>Explore my MBA</Action>
          ) : close ? (
            <Action onClick={() => go("compare")}>Compare my matches</Action>
          ) : (
            <Action onClick={() => go("options")}>See my options</Action>
          )}
          {!(r.classification === "broad" || r.classification === "none") && (
            <Action secondary onClick={() => go("options")}>
              See my other matches
            </Action>
          )}
          <Action secondary onClick={() => go("journey")}>
            My MBA future
          </Action>
        </div>
      </section>
    </>
  );
}
export function ProgramDetail({ id, p, go }: { id: ProgramId; p: Journey; go: Go }) {
  const m = getProgram(id),
    promo = programPromo(id),
    creds = programCredentialLabels(id);
  return (
    <Frame
      label="THE MBA DEEP DIVE"
      title={m.name}
      desc={m.positioning.value}
      back={() => go(p.complete ? "options" : "careers")}
    >
      {promo && (
        <div className="promo" style={{ borderColor: m.accent }}>
          {promo}
        </div>
      )}
      <h3>Your specialist edge</h3>
      <div className="skill-grid">
        {featuredCapabilityLabels(id).map((s, i) => (
          <div key={s}>
            <span
              className="micro"
              style={{ borderBottom: `3px solid ${m.accent}` }}
            >
              0{i + 1}
            </span>
            <strong>{s}</strong>
          </div>
        ))}
      </div>
      {creds.length > 0 && (
        <>
          <h3>Your professional edge</h3>
          <div className="reason-list">
            {creds.map((label) => (
              <span key={label}>
                <ShieldCheck />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
      <h3>Your Flinders MBA experience</h3>
      <div className="story-links">
        {programPageExperienceIds.map((eid) => {
          const x = getExperience(eid),
            Icon = icon(x.icon);
          return (
            <button key={eid} onClick={() => go(paths.experience(eid))}>
              <Icon />
              {x.label}
              <ArrowUpRight />
            </button>
          );
        })}
      </div>
      <h3>Recognition</h3>
      <Chips items={programRecognitionProofIds.map((pid) => getProof(pid).label)} />
      <div className="actions">
        <Action onClick={() => go("careers")}>
          Where could this take you?
        </Action>
        <Action secondary onClick={() => go(p.complete ? "compare" : "q1")}>
          {p.complete ? "Compare my matches" : "Find my MBA"}
        </Action>
        <Action secondary onClick={() => go("journey")}>
          My journey
        </Action>
      </div>
    </Frame>
  );
}
/** Recommendation cards; with no evidence, the whole portfolio to explore. */
function optionCards(p: Journey) {
  const r = matchProgrammes(p);
  return r.classification === "none"
    ? programs.map((m) => ({ id: m.id, label: matchmakerRules.labels.broad }))
    : r.recommendations.map((x) => ({ id: x.programId, label: x.label }));
}
export function Options({ p, go }: { p: Journey; go: Go }) {
  return (
    <Frame
      back={() => go("reveal")}
      label="YOUR MBA SHORTLIST"
      title="You’ve got options."
      desc="Different paths, each connected to the choices you made."
    >
      <div className="option-grid">
        {optionCards(p).map(({ id, label }) => {
            const m = getProgram(id),
              Icon = icon(m.icon);
            return (
              <button
                key={id}
                className="option"
                onClick={() => go(paths.mba(id))}
              >
                <span className="micro">{label}</span>
                <Icon style={{ color: m.accent }} />
                <h2>MBA {m.shortName}</h2>
                <p>{m.positioning.value}</p>
                <strong>
                  Explore MBA <ArrowUpRight size={16} />
                </strong>
              </button>
            );
          })}
      </div>
      <Action onClick={() => go("compare")}>Compare my options</Action>
    </Frame>
  );
}
export function Compare({ p, go }: { p: Journey; go: Go }) {
  const order = matchProgrammes(p).ranked.map((x) => x.programId),
    [ids, setIds] = useState<ProgramId[]>([order[0], order[1]]),
    a = getProgram(ids[0]),
    b = getProgram(ids[1]),
    skillsA = featuredCapabilityLabels(a.id),
    skillsB = featuredCapabilityLabels(b.id);
  return (
    <Frame
      back={() => go("options")}
      label="SIDE BY SIDE"
      title="Compare your MBAs."
      desc="Look at two specialisations through the capabilities they emphasise."
    >
      <div className="compare-head">
        {ids.map((v, j) => (
          <label key={j}>
            <span className="micro">MBA OPTION 0{j + 1}</span>
            <select
              value={v}
              onChange={(e) =>
                setIds(ids.map((n, k) => (k === j ? (e.target.value as ProgramId) : n)))
              }
            >
              {programs.map((m) => (
                <option disabled={ids[1 - j] === m.id} value={m.id} key={m.id}>
                  {m.shortName}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <table className="compare-table">
        <thead>
          <tr>
            <th scope="col">Capability</th>
            <th scope="col">{a.shortName}</th>
            <th scope="col">{b.shortName}</th>
          </tr>
        </thead>
        <tbody>
          {[...new Set([...skillsA, ...skillsB])].map((s) => (
            <tr key={s}>
              <th scope="row">{s}</th>
              {[skillsA, skillsB].map((skills, j) => (
                <td key={j}>
                  {skills.includes(s) ? (
                    "Strong focus"
                  ) : (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">Not a listed specialist focus</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        A dash means the capability is not a listed specialist focus in this
        prototype.
      </p>
      <div className="actions">
        <Action onClick={() => go("journey")}>See my MBA future</Action>
        <Action secondary onClick={() => go("careers")}>
          Explore careers
        </Action>
      </div>
    </Frame>
  );
}
