import { useState } from "react";
import { Check, Plus, ArrowLeft } from "lucide-react";
import { ambitions, interests, experiences, matchmakerRules } from "@/content";
import type { IconKey, PhotoKey } from "@/content/types";
import type { Journey } from "@/lib/journey";
import { Action, type Go } from "./elements";
import { icon } from "./icons";

type Option = { id: string; title: string; summary?: string; icon?: IconKey; photo?: PhotoKey };

export function Matcher({
  step,
  p,
  set,
  go,
}: {
  step: number;
  p: Journey;
  set: (p: Journey) => void;
  go: Go;
}) {
  const k = (["ambitions", "interests", "experiences"] as const)[step - 1],
    sel = p[k] as string[],
    max = [matchmakerRules.limits.ambitions, matchmakerRules.limits.interests, experiences.length][step - 1],
    limited = step < 3 && sel.length >= max,
    [hint, setHint] = useState(""),
    opts: Option[] = [
      ambitions.map((x) => ({ id: x.id, title: x.label, icon: x.icon })),
      interests.map((x) => ({ id: x.id, title: x.label })),
      experiences.map((x) => ({ id: x.id, title: x.title, summary: x.summary, icon: x.icon, photo: x.photo })),
    ][step - 1];
  return (
    <section className="wrap frame">
      <div className="stepbar">
        <button
          className="back"
          onClick={() => go(step === 1 ? "home" : `q${step - 1}`)}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="micro">YOUR MATCHMAKER · 0{step} / 03</span>
        <span className="steps">
          {[1, 2, 3].map((n) => (
            <i className={n < step ? "lit" : n === step ? "lit current" : ""} key={n} />
          ))}
        </span>
      </div>
      <span className="eyebrow">
        <i />
        {["YOUR AMBITIONS", "YOUR INTERESTS", "YOUR EXPERIENCE"][step - 1]}
      </span>
      <h1>
        {
          [
            "Where do you want to go?",
            "What gets you curious?",
            "What would make your MBA unforgettable?",
          ][step - 1]
        }
      </h1>
      <p className="lead">
        {
          [
            "Choose up to three ambitions.",
            "Pick up to four areas you’d most like to explore.",
            "Choose the experiences that matter most to you.",
          ][step - 1]
        }
      </p>
      <div className={"choices step" + step}>
        {opts.map((o, i) => {
          const on = sel.includes(o.id),
            Icon = o.icon ? icon(o.icon) : null;
          return (
            <button
              key={o.title}
              className={"choice " + (on ? "chosen" : "")}
              style={{ animationDelay: `${Math.min(i, 7) * 28}ms`, ...(
                step === 3 && !on && o.photo
                  ? {
                      backgroundImage: `linear-gradient(90deg,#172036e8,#17203688),url(./${o.photo}.webp)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {})
              }}
              // At the limit, unselected choices stay focusable (aria-disabled) so
              // keyboard and screen-reader users still meet them, with the reason.
              aria-disabled={!on && limited ? true : undefined}
              aria-describedby={!on && limited ? "selection-status" : undefined}
              aria-pressed={on}
              onClick={() => {
                if (!on && limited) {
                  setHint(`Maximum reached. Deselect one of your ${max} choices to choose another.`);
                  return;
                }
                setHint("");
                set({
                  ...p,
                  [k]: on ? sel.filter((n) => n !== o.id) : [...sel, o.id],
                  complete: false,
                });
              }}
            >
              {step !== 2 && Icon && <Icon className="choice-symbol" />}
              <span>
                <strong>{o.title}</strong>
                {step === 3 && <small>{o.summary}</small>}
              </span>
              {on ? (
                <Check className="pick-sign" />
              ) : (
                <Plus className="pick-sign" />
              )}
            </button>
          );
        })}
      </div>
      <div className="continue">
        <span id="selection-status" aria-live="polite">
          {sel.length}
          {step < 3 ? ` of ${max}` : ""} selected
          {limited && <b className="limit-note"> · Maximum reached</b>}
          {hint && <span className="sr-only"> {hint}</span>}
        </span>
        <Action
          disabled={!sel.length}
          className={step === 3 ? "action-final" : undefined}
          onClick={() => {
            if (step === 3) set({ ...p, complete: true });
            go(step === 3 ? "matching" : `q${step + 1}`);
          }}
        >
          {step === 3 ? "Build my MBA future" : "Continue"}
        </Action>
      </div>
    </section>
  );
}
