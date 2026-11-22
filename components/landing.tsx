import { prototypeStatus } from "@/content/prototype";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Compass,
  Sparkles,
  Route,
} from "lucide-react";
import { getProof, landingProofIds } from "@/content";
import { icon } from "./icons";
export function Proof() {
  return (
    <div className="proof">
      {landingProofIds.map((id) => {
        const item = getProof(id),
          I = icon(item.icon ?? "badge-check");
        return (
          <span key={id}>
            <I size={19} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
export function Landing({ go }: { go: (s: string) => void }) {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <i /> MBA DISCOVERY EXPERIENCE
            </span>
            <h1>
              BUILD YOUR
              <br />
              <em>MBA FUTURE.</em>
            </h1>
            <p>
              Discover the MBA that fits your ambitions, experience what makes
              studying at Flinders different, and explore where it could take
              you.
            </p>
          </div>
          <span className="hero-tag">
            <i /> FLINDERS MBA SERIES <b>/</b> 01
          </span>
        </div>
      </section>
      <section className="wrap pathways">
        <div className="section-label">
          <span className="eyebrow">
            <i /> CHOOSE YOUR PATH
          </span>
          <span className="rule" />
          <span className="micro">01 / DISCOVER</span>
        </div>
        <div className="path-grid">
          {[
            {
              title: "Find my MBA",
              desc: "Find the MBA that fits you.",
              cta: "Start matching",
              img: "campus",
              icon: GraduationCap,
              to: "q1",
            },
            {
              title: "Explore careers",
              desc: "Start with where you want to go.",
              cta: "Explore careers",
              img: "city",
              icon: Compass,
              to: "careers",
            },
          ].map((p, i) => (
            <button
              className={"path-card path-" + i}
              key={p.to}
              onClick={() => go(p.to)}
              style={{
                backgroundImage: `linear-gradient(90deg,rgba(11,20,40,.85),rgba(15,24,43,.18)),url(./${p.img}.webp)`,
              }}
            >
              <span className="card-index">PATH 0{i + 1}</span>
              <span className="icon-well">
                <p.icon size={24} />
              </span>
              <h2>{p.title}</h2>
              <p>{p.desc}</p>
              <span className="path-cta">
                {p.cta}
                <ArrowRight size={17} />
              </span>
            </button>
          ))}
        </div>
        <button className="experience-link" onClick={() => go("experiences")}>
          <span className="experience-icon">
            <Sparkles />
          </span>
          <span>
            <small className="micro">THE FLINDERS DIFFERENCE</small>
            <strong>See what makes our MBA different</strong>
          </span>
          <ArrowUpRight className="end" />
        </button>
        <Proof />
      </section>
    </>
  );
}
export function Header({
  go,
  onMenu,
  menuOpen = false,
}: {
  go: (s: string) => void;
  onMenu: () => void;
  menuOpen?: boolean;
}) {
  return (
    <header className="top">
      <div className="wrap top-inner">
        {/* Public prototype: a typographic product title, not university brand artwork. */}
        <button
          className="brand brand-text"
          onClick={() => go("home")}
          aria-label="Flinders MBA Future home"
        >
          <span className="brand-title">
            FLINDERS MBA <b>FUTURE</b>
          </span>
          <small className="brand-status">{prototypeStatus.label}</small>
        </button>
        <button className="journey" onClick={() => go("journey")}>
          <Route size={16} />
          My Journey
        </button>
        <button
          className="menu-trigger"
          onClick={onMenu}
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-dialog"
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
