/** Document titles per route ("<page> | Flinders MBA Future"). */
import { getCareerCluster, getCareerDirection, getExperience, getProgram } from "@/content";
import type { Route } from "./routes";

export const SITE_TITLE = "Flinders MBA Future";

export function pageName(r: Route, complete = false): string | null {
  switch (r.name) {
    case "home":
      return null;
    case "q":
      return "Find My MBA";
    case "matching":
    case "reveal":
      return "Your MBA match";
    case "options":
      return "Your MBA options";
    case "compare":
      return "Compare MBAs";
    case "mba":
      return getProgram(r.id).name;
    case "careers":
      return "Career Explorer";
    case "cluster":
      return `${getCareerCluster(r.id).label} careers`;
    case "career":
      return getCareerDirection(r.id).title;
    case "bridge":
      return `${getCareerDirection(r.id).title} capabilities`;
    case "occupation":
      return `Australian occupation ${r.code}`;
    case "experiences":
      return "The Flinders difference";
    case "experience":
      return getExperience(r.id).label;
    case "journey":
      return complete ? "My MBA Future" : "My journey";
  }
}

export const documentTitle = (r: Route, complete = false) => {
  const name = pageName(r, complete);
  return name ? `${name} | ${SITE_TITLE}` : SITE_TITLE;
};
