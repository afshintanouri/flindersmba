/**
 * Typed hash routes.
 *
 * Canonical (semantic) forms:
 *   #home  #q1 #q2 #q3  #matching #reveal #options #compare  #careers
 *   #experiences  #journey
 *   #mba/mba-ai                      programme detail
 *   #experience/industry-placement   experience story
 *   #careers/strategy-consulting     career cluster (its four Career Directions)
 *   #career/management-consultant    Career Direction profile
 *   #career/management-consultant/bridge   capability bridge
 *   #occupation/223432               official OSCA occupation profile
 *
 * Legacy prototype forms (#mba-0, #story-3, #career-2, #bridge-2) are still
 * accepted and resolved through each record's `legacyIndex`. Prototype career
 * profile IDs (#career/marketing-strategist …) open their replacement direction.
 */
import { CAREER_CLUSTER_IDS, CAREER_DIRECTION_IDS, EXPERIENCE_IDS, PROGRAM_IDS } from "@/content/ids";
import type { CareerClusterId, CareerDirectionId, ExperienceId, ProgramId } from "@/content/types";
import { legacyCareerDirection, legacyProfileDirection, legacyExperience, legacyProgram } from "./legacy";

export type Route =
  | { name: "home" }
  | { name: "q"; step: 1 | 2 | 3 }
  | { name: "matching" }
  | { name: "reveal" }
  | { name: "options" }
  | { name: "compare" }
  | { name: "careers" }
  | { name: "cluster"; id: CareerClusterId }
  | { name: "experiences" }
  | { name: "journey" }
  | { name: "mba"; id: ProgramId }
  | { name: "experience"; id: ExperienceId }
  | { name: "career"; id: CareerDirectionId }
  | { name: "bridge"; id: CareerDirectionId }
  | { name: "occupation"; code: string };

const SIMPLE = ["home", "matching", "reveal", "options", "compare", "careers", "experiences", "journey"] as const;

const is = <T extends string>(list: readonly T[], v: string | undefined): v is T =>
  v !== undefined && (list as readonly string[]).includes(v);

/** Hash paths for navigation (without the leading "#"). */
export const paths = {
  mba: (id: ProgramId) => `mba/${id}`,
  experience: (id: ExperienceId) => `experience/${id}`,
  cluster: (id: CareerClusterId) => `careers/${id}`,
  career: (id: CareerDirectionId) => `career/${id}`,
  bridge: (id: CareerDirectionId) => `career/${id}/bridge`,
  occupation: (code: string) => `occupation/${code}`,
};

export function formatRoute(r: Route): string {
  switch (r.name) {
    case "q":
      return "q" + r.step;
    case "mba":
      return paths.mba(r.id);
    case "experience":
      return paths.experience(r.id);
    case "cluster":
      return paths.cluster(r.id);
    case "career":
      return paths.career(r.id);
    case "occupation":
      return paths.occupation(r.code);
    case "bridge":
      return paths.bridge(r.id);
    default:
      return r.name;
  }
}

/** Parses a hash (with or without "#"). Unknown or malformed hashes → home. */
export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, "");
  if (is(SIMPLE, h)) return { name: h };
  const q = /^q([123])$/.exec(h);
  if (q) return { name: "q", step: Number(q[1]) as 1 | 2 | 3 };

  // Semantic routes
  const [section, id, sub] = h.split("/");
  if (section === "mba" && is(PROGRAM_IDS, id) && sub === undefined) return { name: "mba", id };
  if (section === "experience" && is(EXPERIENCE_IDS, id) && sub === undefined) return { name: "experience", id };
  if (section === "careers" && is(CAREER_CLUSTER_IDS, id) && sub === undefined) return { name: "cluster", id };
  if (section === "occupation" && id && /^\d{6}$/.test(id) && sub === undefined) return { name: "occupation", code: id };
  if (section === "career" && id) {
    const direction = is(CAREER_DIRECTION_IDS, id) ? id : legacyProfileDirection(id);
    if (direction) {
      if (sub === undefined) return { name: "career", id: direction };
      if (sub === "bridge") return { name: "bridge", id: direction };
    }
  }

  // Legacy prototype routes
  const legacy = /^(mba|story|career|bridge)-(\d{1,2})$/.exec(h);
  if (legacy) {
    const n = Number(legacy[2]);
    if (legacy[1] === "mba") {
      const id = legacyProgram(n);
      if (id) return { name: "mba", id };
    } else if (legacy[1] === "story") {
      const id = legacyExperience(n);
      if (id) return { name: "experience", id };
    } else {
      const id = legacyCareerDirection(n);
      if (id) return legacy[1] === "career" ? { name: "career", id } : { name: "bridge", id };
    }
  }
  return { name: "home" };
}
