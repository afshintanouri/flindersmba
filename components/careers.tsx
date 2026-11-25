import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpRight, ArrowDown, ArrowRight, FileText } from "lucide-react";
import {
  capabilityEvidenceLabels,
  capabilityShared,
  careerClusters,
  careerDirectionsForCluster,
  careerDirectionsForOccupation,
  careerDirections,
  careerDisclaimer,
  experienceAvailability,
  getCareerCapability,
  getCareerCluster,
  getCareerDirection,
  getExperience,
  getProgram,
} from "@/content";
import { aboutExperience } from "@/content/about";
import type { CareerClusterId, CareerDirection, CareerDirectionId, CareerPresentation } from "@/content/types";
import { buildOscaSearchIndex, searchCareerDirections, searchOsca, type OscaHit } from "@/lib/careers/search";
import {
  bandLabel,
  EXPLORE_INTRO,
  firstSentence,
  limitTasks,
  mbaSectionHeading,
  occupationConnection,
} from "@/lib/careers/presentation";
import { loadOscaGroups, useLoad, useOscaDetail, useOscaIndex, type Loadable } from "@/lib/osca/client";
import type { OscaOccupationIndexEntry } from "@/lib/osca/types";
import { paths } from "@/lib/routes";
import { oscaAttribution } from "@/content/attribution";
import { Frame, Action, Chips, type Go } from "./elements";
import { icon } from "./icons";

/* ------------------------------------------------------------------ shared bits */

const PRESENTATION_LABEL: Record<CareerPresentation, string> = {
  official: "Official Australian occupation title",
  "related-official": "Connected with an official occupation",
  contemporary: "Contemporary career direction",
  "career-direction": "Career direction",
  venture: "Venture direction",
};

const TITLE_TYPE_LABEL: Record<OscaHit["matchedTitleType"], string> = {
  "principal-title": "Official occupation",
  "alternative-title": "Official alternative title of",
  specialisation: "Official specialisation of",
  "nec-included-title": "Official title included within",
};

/**
 * About this tool: what is ABS data and what is curated interpretation. Shown
 * above (and separate from) the formal ABS attribution on Career Explorer pages.
 */
export function CareerAbout() {
  return (
    <div className="career-about">
      <h2 className="micro">{aboutExperience.careerAboutHeading.toUpperCase()}</h2>
      <p className="note">{aboutExperience.careerAbout}</p>
      <p className="note">{careerDisclaimer}</p>
    </div>
  );
}

/**
 * ABS CC BY 4.0 attribution line (configured in content/attribution.ts).
 */
export function OscaSource({ code }: { code?: string }) {
  const a = oscaAttribution;
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <p className="note osca-source" data-attribution-status={a.status}>
      Source: {a.creator},{" "}
      <a href={a.sourceUrl} {...ext}>
        {a.title}
      </a>
      {code ? ` (occupation ${code})` : ""}. {a.copyright}, licensed under{" "}
      <a href={a.licenceUrl} {...ext}>
        {a.licence}
      </a>
      . {a.modified} {a.notEndorsed}{" "}
      <a href={a.disclaimerUrl} {...ext}>
        ABS copyright and disclaimer
      </a>
      .
    </p>
  );
}

function LoadError({ what, retry }: { what: string; retry?: () => void }) {
  return (
    <p className="note" role="status">
      {what} could not be loaded right now.{" "}
      {retry && (
        <button className="text-link" onClick={retry}>
          Try again
        </button>
      )}
    </p>
  );
}

function OccupationLink({ code, title, go }: { code: string; title: string; go: Go }) {
  return (
    <button onClick={() => go(paths.occupation(code))}>
      <FileText />
      <span>
        <strong>{title}</strong>
        <small>OSCA {code}</small>
      </span>
      <ArrowUpRight />
    </button>
  );
}

/* ------------------------------------------------------------------ landing + search */

const OSCA_PAGE = 12;
const SEARCH_ANNOUNCE_DELAY_MS = 700;

/** Result group: heading semantics and a list, with the approved visuals. */
function ResultGroup({ id, label, count, children }: { id: string; label: string; count: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      <div className="section-label" role="heading" aria-level={2} id={id}>
        <span className="micro">{label}</span>
        <span className="rule" />
        {count}
      </div>
      {children}
    </>
  );
}

function ResultList({ labelledBy, children }: { labelledBy: string; children: React.ReactNode[] }) {
  return (
    <div className="choices" role="list" aria-labelledby={labelledBy}>
      {children.map((c, i) => (
        <div role="listitem" className="list-item" key={i}>
          {c}
        </div>
      ))}
    </div>
  );
}

export function Careers({ go }: { go: Go }) {
  const [query, setQuery] = useState(""),
    [shown, setShown] = useState(OSCA_PAGE),
    index = useOscaIndex(),
    searchIndex = useMemo(() => (index.status === "ready" ? buildOscaSearchIndex(index.data) : null), [index]),
    q = query.trim(),
    careers = q ? searchCareerDirections(q) : [],
    official = q && searchIndex ? searchOsca(q, searchIndex) : [];
  const status = !q
    ? ""
    : `${careers.length} career direction${careers.length === 1 ? "" : "s"}` +
      (index.status === "ready" ? ` and ${official.length} official occupation${official.length === 1 ? "" : "s"}` : "") +
      ` found for “${q}”.`;
  // Announce the result count once typing pauses, not on every keystroke.
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setAnnounced(status), SEARCH_ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [status]);
  return (
    <Frame
      back={() => go("home")}
      label="CAREER EXPLORER"
      title="Where could your MBA take you?"
      desc="Explore career directions and their connections with our MBA specialisations."
    >
      <label className="search">
        <Search />
        <input
          value={query}
          type="search"
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(OSCA_PAGE);
          }}
          placeholder="Search careers or Australian occupations"
          aria-label="Search careers"
          aria-describedby="career-search-status"
        />
      </label>
      <p id="career-search-status" className="sr-only" role="status" aria-live="polite">
        {announced}
      </p>
      {!q ? (
        <>
          <div className="section-label">
            <span className="micro">CAREER AREAS</span>
            <span className="rule" />
            {careerClusters.length}
          </div>
          <div className="choices">
            {careerClusters.map((c) => {
              const Icon = icon(c.icon);
              return (
                <button className="choice" key={c.id} onClick={() => go(paths.cluster(c.id))}>
                  <Icon className="choice-symbol" />
                  <span>
                    <strong>{c.label}</strong>
                    <small>{careerDirectionsForCluster(c.id).map((d) => d.title).join(" · ")}</small>
                  </span>
                  <ArrowUpRight className="pick-sign" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <ResultGroup id="career-results" label="CAREER DIRECTIONS" count={careers.length} />
          {careers.length > 0 ? (
            <ResultList labelledBy="career-results">
              {careers.map(({ direction: d }) => (
                <CareerChoice key={d.id} d={d} go={go} />
              ))}
            </ResultList>
          ) : (
            <p className="note">No curated career directions match this search.</p>
          )}
          <ResultGroup id="osca-results" label="OFFICIAL AUSTRALIAN OCCUPATIONS" count={index.status === "ready" ? official.length : ""} />
          {index.status === "loading" && (
            <p className="note" role="status">
              Loading official occupations…
            </p>
          )}
          {index.status === "error" && <LoadError what="Official occupations" retry={index.retry} />}
          {index.status === "ready" &&
            (official.length > 0 ? (
              <>
                <ResultList labelledBy="osca-results">
                  {official.slice(0, shown).map((h) => (
                    <OscaChoice key={h.occupation.code} hit={h} go={go} />
                  ))}
                </ResultList>
                {official.length > shown && (
                  <p>
                    <button className="text-link" onClick={() => setShown(shown + OSCA_PAGE)}>
                      Show more official occupations ({official.length - shown} more)
                    </button>
                  </p>
                )}
              </>
            ) : (
              <p className="note">No official occupation titles match this search.</p>
            ))}
          {index.status === "ready" && official.length > 0 && (
            <>
              <CareerAbout />
              <OscaSource />
            </>
          )}
          {careers.length === 0 && official.length === 0 && (
            <p>
              <button className="text-link" onClick={() => setQuery("")}>
                Browse all career areas
              </button>
            </p>
          )}
        </>
      )}
    </Frame>
  );
}

function CareerChoice({ d, go }: { d: CareerDirection; go: Go }) {
  const c = getCareerCluster(d.clusterId),
    Icon = icon(c.icon);
  return (
    <button className="choice" onClick={() => go(paths.career(d.id))}>
      <Icon className="choice-symbol" />
      <span>
        <span className="micro result-kind">CAREER DIRECTION</span>
        <strong>{d.title}</strong>
        <small>{c.label}</small>
      </span>
      <ArrowUpRight className="pick-sign" />
    </button>
  );
}

function OscaChoice({ hit, go }: { hit: OscaHit; go: Go }) {
  const o = hit.occupation,
    viaOtherTitle = hit.matchedTitleType !== "principal-title";
  return (
    <button className="choice" onClick={() => go(paths.occupation(o.code))}>
      <FileText className="choice-symbol" />
      <span>
        <span className="micro result-kind">OFFICIAL OSCA OCCUPATION</span>
        <strong>{viaOtherTitle ? hit.matchedTitle : o.principalTitle}</strong>
        <small>
          {viaOtherTitle ? `${TITLE_TYPE_LABEL[hit.matchedTitleType]} ${o.principalTitle} · ` : ""}OSCA {o.code}
        </small>
      </span>
      <ArrowUpRight className="pick-sign" />
    </button>
  );
}

/* ------------------------------------------------------------------ cluster */

export function CareerCluster({ id, go }: { id: CareerClusterId; go: Go }) {
  const c = getCareerCluster(id),
    Icon = icon(c.icon),
    list = careerDirectionsForCluster(id);
  return (
    <Frame
      back={() => go("careers")}
      label="CAREER EXPLORER"
      title={c.label}
      desc="Choose a career direction to see its occupation connection, capabilities and Flinders MBA connections."
    >
      <div className="section-label">
        <span className="micro">CAREER DIRECTIONS</span>
        <span className="rule" />
        {list.length}
      </div>
      <div className="choices">
        {list.map((d) => (
          <button className="choice" key={d.id} onClick={() => go(paths.career(d.id))}>
            <Icon className="choice-symbol" />
            <span>
              <strong>{d.title}</strong>
              <small>{PRESENTATION_LABEL[d.presentation]}</small>
            </span>
            <ArrowUpRight className="pick-sign" />
          </button>
        ))}
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ career page */

export function CareerPage({ id, isBridge, go }: { id: CareerDirectionId; isBridge: boolean; go: Go }) {
  return isBridge ? <CapabilityBridge id={id} go={go} /> : <CareerProfile id={id} go={go} />;
}

function CareerProfile({ id, go }: { id: CareerDirectionId; go: Go }) {
  const d = getCareerDirection(id),
    c = getCareerCluster(d.clusterId),
    conn = occupationConnection(d),
    capabilityLabels = d.capabilityIds.map((x) => getCareerCapability(x).label);
  return (
    <Frame
      back={() => go(paths.cluster(d.clusterId))}
      className="career-profile"
      label={c.label.toUpperCase()}
      title={d.title}
      desc={`Explore how this career direction connects with Australian occupations, capabilities and Flinders MBAs.`}
    >
      <div className="micro career-tag">{conn.tag}</div>

      <section className="info-panel" aria-labelledby="occupation-connection">
        <h2 className="micro" id="occupation-connection">
          {conn.heading.toUpperCase()}
        </h2>
        {conn.lead && <p>{conn.lead}</p>}
        {conn.occupation && (
          <>
            <h3>{conn.occupation.title}</h3>
            <p className="occupation-code">OSCA {conn.occupation.code}</p>
          </>
        )}
        {conn.note && <p>{conn.note}</p>}
        {conn.occupation && (
          <button className="text-link" onClick={() => go(paths.occupation(conn.occupation!.code))}>
            View the official occupation profile
          </button>
        )}
      </section>
      {conn.relatedHeading && d.related.length > 0 && (
        <>
          <h3>{conn.relatedHeading}</h3>
          <div className="story-links">
            {d.related.map((r) => (
              <OccupationLink key={r.code} code={r.code} title={r.principalTitle} go={go} />
            ))}
          </div>
        </>
      )}

      <h3>What this career can involve</h3>
      {d.primary ? (
        <OfficialInvolvement code={d.primary.code} major={d.primary.majorGroupCode} title={d.primary.principalTitle} />
      ) : (
        <>
          <ol className="rows">
            {d.overview!.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="note">Our career-direction overview, based on the capabilities connected with this career. It is not an official ABS description.</p>
        </>
      )}

      <h3>Capabilities connected with this career</h3>
      <Chips items={capabilityLabels} />

      <MbaConnections d={d} go={go} />

      <div className="actions">
        <Action secondary onClick={() => go(paths.bridge(d.id))}>
          See how these capabilities connect
        </Action>
      </div>

      <SharedForCareer d={d} go={go} />

      <div className="actions">
        <Action onClick={() => go("journey")}>View My MBA Future</Action>
        <Action secondary onClick={() => go("careers")}>
          Explore more careers
        </Action>
      </div>
      <p className="note">This career direction is saved in My MBA Future as one you explored.</p>
      <CareerAbout />
      {(d.primary || d.related.length > 0) && <OscaSource />}
    </Frame>
  );
}

function OfficialInvolvement({ code, major, title }: { code: string; major: string; title: string }) {
  const s = useOscaDetail(code, major);
  if (s.status === "loading")
    return (
      <p className="note" role="status">
        Loading official occupation information…
      </p>
    );
  if (s.status === "error") return <LoadError what="Official occupation information" retry={s.retry} />;
  return (
    <>
      <p className="lead-statement">
        <span className="micro">{title.toUpperCase()} · OSCA {code}</span>
        {firstSentence(s.data.leadStatement)}
      </p>
      {s.data.mainTasks.length > 0 && (
        <ol className="rows">
          {limitTasks(s.data.mainTasks).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      )}
    </>
  );
}

function MbaConnections({ d, go }: { d: CareerDirection; go: Go }) {
  return (
    <>
      <h3>{mbaSectionHeading(d)}</h3>
      {d.mba.mode === "explore" && <p className="note">{EXPLORE_INTRO}</p>}
      <div className="option-grid career-mba">
        {d.mba.connections.map((x) => {
          const m = getProgram(x.programId),
            Icon = icon(m.icon);
          return (
            <article className="option" key={x.programId} aria-labelledby={`mba-${x.programId}`}>
              <span className="micro">{bandLabel(x.band)}</span>
              <Icon style={{ color: m.accent }} aria-hidden="true" />
              <h2 id={`mba-${x.programId}`}>MBA {m.shortName}</h2>
              <p>{m.positioning.value}</p>
              <ul className="chips" aria-label="Capabilities connected">
                {x.capabilityIds.map((cid) => (
                  <li key={cid}>{getCareerCapability(cid).label}</li>
                ))}
              </ul>
              {x.evidence.length > 0 && (
                <p className="card-detail">
                  <span className="micro">SPECIALIST FOCUS</span>
                  {x.evidence.join(" · ")}
                </p>
              )}
              {x.credentials.length > 0 && (
                <p className="card-detail">
                  <span className="micro">PROFESSIONAL EDGE</span>
                  {x.credentials.join(" · ")}
                </p>
              )}
              <button className="option-link" onClick={() => go(paths.mba(x.programId))}>
                Explore MBA <span className="sr-only">{m.shortName}</span>
                <ArrowUpRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function SharedForCareer({ d, go }: { d: CareerDirection; go: Go }) {
  if (!d.sharedExperiences.length) return null;
  return (
    <>
      <h3>Across your Flinders MBA</h3>
      <p className="micro">{experienceAvailability(d.sharedExperiences[0].experienceId)}</p>
      <div className="story-links shared-links">
        {d.sharedExperiences.map((s) => {
          const x = getExperience(s.experienceId),
            Icon = icon(x.icon),
            text = capabilityShared(s.capabilityId).find((c) => c.experienceId === s.experienceId)?.text;
          return (
            <button key={s.experienceId} onClick={() => go(paths.experience(s.experienceId))}>
              <Icon />
              <span>
                <strong>
                  {x.label}
                  {x.subjectCodes?.length ? ` (${x.subjectCodes.join(", ")})` : ""}
                </strong>
                {text && <small>{text.replace(/\s*\((?:BUSN\d{4}[^)]*)\)/g, "")}</small>}
              </span>
              <ArrowUpRight />
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ capability bridge */

function CapabilityBridge({ id, go }: { id: CareerDirectionId; go: Go }) {
  const d = getCareerDirection(id),
    [open, setOpen] = useState(0);
  return (
    <Frame
      back={() => go(paths.career(id))}
      className="career-bridge"
      label="THE CAPABILITY BRIDGE"
      title="From MBA to career capability."
      desc="Explore how each capability connected with this career is developed across Flinders MBAs."
    >
      <div className="bridge-heading">
        <span className="micro">CAREER</span>
        <h2>{d.title}</h2>
        <ArrowDown />
      </div>
      <div className="bridge-list">
        {d.bridge.map((b, i) => {
          const label = getCareerCapability(b.capabilityId).label,
            shared = capabilityShared(b.capabilityId),
            panel = `bridge-panel-${b.capabilityId}`;
          return (
            <div key={b.capabilityId}>
              <button
                id={`${panel}-button`}
                aria-expanded={open === i}
                aria-controls={panel}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="micro">{String(i + 1).padStart(2, "0")}</span>
                {label}
                <ArrowDown />
              </button>
              {open === i && (
                <div className="bridge-panel" id={panel} role="region" aria-labelledby={`${panel}-button`}>
                  <span className="micro">MBA LEARNING + EXPERIENCE</span>
                  {b.programmes.length > 0 ? (
                    <ul>
                      {b.programmes.map((p) => {
                        const ev = capabilityEvidenceLabels(p.programId, b.capabilityId);
                        return (
                          <li key={p.programId}>
                            <strong>MBA {getProgram(p.programId).shortName}</strong>
                            {ev.length > 0 ? `: ${ev.join(" · ")}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>No single MBA specialisation is identified as building this capability.</p>
                  )}
                  {shared.length > 0 && (
                    <>
                      <span className="micro">ACROSS YOUR FLINDERS MBA</span>
                      <ul>
                        {shared.map((s) => (
                          <li key={s.experienceId}>
                            <strong>{getExperience(s.experienceId).label}</strong>: {s.text}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <h3>{mbaSectionHeading(d)}</h3>
      <div className="story-links">
        {d.mba.connections.map((x) => (
          <button key={x.programId} onClick={() => go(paths.mba(x.programId))}>
            <span>
              <strong>MBA {getProgram(x.programId).shortName}</strong>
              <small>{getProgram(x.programId).positioning.value}</small>
            </span>
            <ArrowRight />
          </button>
        ))}
      </div>
      <div className="actions">
        <Action onClick={() => go("journey")}>My journey</Action>
        <Action secondary onClick={() => go("q1")}>
          Find my MBA
        </Action>
      </div>
      <CareerAbout />
    </Frame>
  );
}

/* ------------------------------------------------------------------ official occupation profile */

const MAX_RELATED_TITLES = 6;

export function OccupationProfile({ code, go }: { code: string; go: Go }) {
  const index = useOscaIndex(),
    entry: OscaOccupationIndexEntry | undefined = index.status === "ready" ? index.data.find((o) => o.code === code) : undefined,
    detail = useOscaDetail(entry?.code, entry?.majorGroupCode),
    groups = useLoad(entry ? "groups" : null, loadOscaGroups),
    connected = careerDirectionsForOccupation(code),
    exploring = careerDirections.filter((d) => d.related.some((r) => r.code === code));
  const missing = index.status === "ready" && !entry;
  return (
    <Frame
      back={() => go("careers")}
      label="OFFICIAL AUSTRALIAN OCCUPATION"
      title={entry ? entry.principalTitle : missing ? "Occupation not found" : `OSCA ${code}`}
    >
      {index.status === "loading" && (
        <p className="note" role="status">
          Loading official occupation…
        </p>
      )}
      {index.status === "error" && <LoadError what="The official occupation" retry={index.retry} />}
      {missing && <p>There is no OSCA occupation with the code {code}.</p>}
      {entry && (
        <>
          <section className="info-panel" aria-labelledby="official-occupation">
            <h2 className="micro" id="official-occupation">
              OSCA {entry.code}
              {entry.isNec ? " · NOT ELSEWHERE CLASSIFIED" : ""}
            </h2>
            {detail.status === "ready" && <p>{firstSentence(detail.data.leadStatement)}</p>}
            {detail.status === "loading" && <p role="status">Loading official occupation information…</p>}
            {detail.status === "error" && <LoadError what="Official occupation information" retry={detail.retry} />}
          </section>
          <OfficialTitles entry={entry} />
          {detail.status === "ready" && detail.data.mainTasks.length > 0 && (
            <>
              <h3>What this occupation can involve</h3>
              <ol className="rows">
                {limitTasks(detail.data.mainTasks).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </>
          )}
          <Hierarchy entry={entry} groups={groups} />
          <h3>MBA connections</h3>
          {connected.length + exploring.length > 0 ? (
            <>
              <p>MBA connections are shown for our curated career directions.</p>
              {[
                ["Career directions connected with this occupation", connected],
                ["Career directions that explore this occupation", exploring],
              ].map(([heading, list]) =>
                (list as CareerDirection[]).length ? (
                  <div key={heading as string}>
                    <p className="micro occupation-group">{heading as string}</p>
                    <div className="story-links">
                      {(list as CareerDirection[]).map((d) => (
                        <button key={d.id} onClick={() => go(paths.career(d.id))}>
                          <span>
                            <strong>{d.title}</strong>
                            <small>Career direction · {getCareerCluster(d.clusterId).label}</small>
                          </span>
                          <ArrowUpRight />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </>
          ) : (
            <>
              <p>Explore our curated career directions for MBA connections.</p>
              <div className="actions">
                <Action onClick={() => go("careers")}>Explore career directions</Action>
              </div>
            </>
          )}
        </>
      )}
      <CareerAbout />
      <OscaSource code={code} />
    </Frame>
  );
}

function OfficialTitles({ entry }: { entry: OscaOccupationIndexEntry }) {
  const titles = [...entry.alternativeTitles, ...entry.specialisations];
  return (
    <>
      {titles.length > 0 && (
        <>
          <h3>Related official titles</h3>
          <Chips items={titles.slice(0, MAX_RELATED_TITLES)} />
          {titles.length > MAX_RELATED_TITLES && (
            <p className="note">and {titles.length - MAX_RELATED_TITLES} more official titles.</p>
          )}
        </>
      )}
      {entry.isNec && entry.necIncludedTitles.length > 0 && (
        <>
          <h3>Titles included in this category</h3>
          <Chips items={entry.necIncludedTitles.slice(0, MAX_RELATED_TITLES)} />
          <p className="note">These titles are included within a “not elsewhere classified” category; they are not standalone occupations.</p>
        </>
      )}
    </>
  );
}

function Hierarchy({ entry, groups }: { entry: OscaOccupationIndexEntry; groups: Loadable<{ code: string; title: string }[]> }) {
  if (groups.status !== "ready") return null;
  const title = (c: string) => groups.data.find((g) => g.code === c)?.title;
  const levels: [string, string][] = [
    ["Major group", entry.majorGroupCode],
    ["Sub-major group", entry.subMajorGroupCode],
    ["Minor group", entry.minorGroupCode],
    ["Unit group", entry.unitGroupCode],
  ];
  return (
    <>
      <h3>Where it sits in OSCA</h3>
      <ol className="rows hierarchy">
        {levels.map(([label, c]) => (
          <li key={label}>
            <span className="micro">{label.toUpperCase()}</span> {title(c)} ({c})
          </li>
        ))}
      </ol>
    </>
  );
}
