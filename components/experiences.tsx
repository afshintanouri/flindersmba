import { experienceAvailability, experienceGridOrder, getExperience } from "@/content";
import type { ExperienceId } from "@/content/types";
import { paths } from "@/lib/routes";
import { Frame, Action, type Go } from "./elements";
import { icon } from "./icons";
import { ArrowUpRight } from "lucide-react";
export function Experiences({ go, id }: { go: Go; id?: ExperienceId }) {
  if (id !== undefined) {
    const x = getExperience(id),
      n = x.legacyIndex,
      Icon = icon(x.icon);
    return (
      <Frame
        label="EXPERIENCE STORY"
        title={x.title}
        className="story-page"
        back={() => go("experiences")}
      >
        <div
          className={"story-hero story-" + n}
          style={
            x.photo
              ? {
                  backgroundImage: `linear-gradient(90deg,#15203bd9,transparent),url(./${x.photo}.webp)`,
                }
              : undefined
          }
        >
          <Icon />
          <span className="micro">FLINDERS MBA EXPERIENCE / 0{n + 1}</span>
          <h2>{x.label}</h2>
        </div>
        <p className="story-text">{x.story}</p>
        <div className="micro">{experienceAvailability(id)}</div>
        <div className="actions">
          <Action onClick={() => go("q1")}>Find my MBA</Action>
          <Action secondary onClick={() => go("experiences")}>
            More experiences
          </Action>
        </div>
      </Frame>
    );
  }
  return (
    <Frame
      back={() => go("home")}
      label="THE FLINDERS DIFFERENCE"
      title="Experience the Flinders MBA."
      desc="Business school doesn’t have to stay in the classroom."
    >
      <div className="bento">
        {experienceGridOrder.map((eid) => {
          const x = getExperience(eid),
            n = x.legacyIndex,
            Icon = icon(x.icon);
          return (
            <button
              key={eid}
              className={"bento-tile story-" + n}
              onClick={() => go(paths.experience(eid))}
            >
              {x.photo && <img className="tile-photo" src={`./${x.photo}.webp`} alt="" />}
              <Icon className="tile-icon" />
              <span className="micro">EXPERIENCE / 0{n + 1}</span>
              <h2>{x.label}</h2>
              <p>{x.summary}</p>
              <ArrowUpRight className="corner" />
            </button>
          );
        })}
      </div>
    </Frame>
  );
}
