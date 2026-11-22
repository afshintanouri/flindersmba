"use client";
import { useState, useEffect, useRef } from "react";
import { MatchSequence } from "./match-sequence";
import { ArrowRight, X } from "lucide-react";
import { Landing, Header } from "./landing";
import { Matcher } from "./matcher";
import { Reveal, Options, Compare, ProgramDetail } from "./programmes";
import { CareerCluster, CareerPage, Careers, OccupationProfile } from "./careers";
import { Experiences } from "./experiences";
import { Journey } from "./journey";
import { AboutPanel, ContactPanel, SiteFooter } from "./contact";
import { prototypeStatus } from "@/content/prototype";
import { contactCopy } from "@/content/contact";
import {
  emptyJourney,
  isEmptyJourney,
  journeysEqual,
  loadJourney,
  saveJourney,
  withVisit,
  type Journey as JourneyState,
} from "@/lib/journey";
import { formatRoute, parseRoute, type Route } from "@/lib/routes";
import { isShareHash, shareFromHash } from "@/lib/share";
import {
  isKioskSearch,
  KIOSK_ACTIVITY_EVENTS,
  KIOSK_IDLE_RESET_MS,
  KIOSK_IDLE_WARNING_MS,
  KIOSK_STORAGE_KEY,
} from "@/lib/kiosk";
import { documentTitle, pageName } from "@/lib/titles";

type Modal = "" | "menu" | "reset" | "import" | "idle" | "share-error" | "contact" | "about";

const modalLabels: Record<Exclude<Modal, "">, string> = {
  menu: "Your discovery paths",
  reset: "Start a new journey",
  import: "Open a shared journey",
  idle: "Ready for the next MBA journey?",
  "share-error": "This shared link could not be opened",
  contact: contactCopy.panelHeading,
  about: prototypeStatus.aboutHeading,
};

/** Journey storage: localStorage normally; this tab's sessionStorage only in kiosk mode. */
const journeyStore = (kiosk: boolean) =>
  kiosk ? { storage: sessionStorage, key: KIOSK_STORAGE_KEY } : { storage: localStorage, key: undefined };

export function Discovery() {
  const [route, setRoute] = useState<Route>({ name: "home" }),
    [p, set] = useState<JourneyState>(emptyJourney),
    [ready, setReady] = useState(false),
    [modal, setModal] = useState<Modal>(""),
    [pending, setPending] = useState<JourneyState | null>(null),
    [kiosk, setKiosk] = useState(false),
    [announcement, setAnnouncement] = useState(""),
    current = useRef<JourneyState>(emptyJourney),
    routeRef = useRef<Route>({ name: "home" }),
    dialog = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null);
  current.current = p;
  routeRef.current = route;
  useEffect(() => {
    const isKiosk = isKioskSearch(location.search);
    setKiosk(isKiosk);
    document.documentElement.classList.toggle("kiosk", isKiosk);
    const store = journeyStore(isKiosk);
    const saved = loadJourney(store.storage, store.key);
    current.current = saved;
    set(saved);
    const read = () => {
      const hash = location.hash.slice(1);
      const shared = shareFromHash(hash);
      if (shared) {
        history.replaceState(null, "", "#journey");
        setRoute({ name: "journey" });
        const mine = current.current;
        if (isEmptyJourney(mine) || journeysEqual(mine, shared.journey)) {
          set(shared.journey);
        } else {
          // Never silently overwrite the visitor's own saved journey.
          setPending(shared.journey);
          setModal("import");
        }
        return;
      }
      if (isShareHash(hash)) {
        // An invalid, incomplete or unknown share payload: explain, then go home.
        history.replaceState(null, "", "#home");
        setRoute({ name: "home" });
        setModal("share-error");
        return;
      }
      const next = parseRoute(hash);
      const canonical = formatRoute(next);
      if (hash && hash !== canonical) history.replaceState(null, "", "#" + canonical);
      setRoute(next);
    };
    read();
    setReady(true);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const store = journeyStore(kiosk);
    saveJourney(store.storage, p, store.key);
  }, [p, ready, kiosk]);
  // Exploring a curated Career Direction records its stable ID in the journey.
  // (Official OSCA occupation browsing is never recorded.)
  const exploredCareer = route.name === "career" || route.name === "bridge" ? route.id : null;
  useEffect(() => {
    if (ready && exploredCareer) set((j) => withVisit(j, exploredCareer));
  }, [ready, exploredCareer]);
  const page = formatRoute(route);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (ready) main.current?.focus({ preventScroll: true });
  }, [page, ready]);
  // Document title and an accessible page announcement on every route change.
  const title = documentTitle(route, p.complete);
  useEffect(() => {
    document.title = title;
    if (ready) setAnnouncement(`${pageName(routeRef.current, current.current.complete) ?? "Home"} page`);
  }, [title, ready]);

  /* ---------- Kiosk idle reset (kiosk mode only) ---------- */
  useEffect(() => {
    if (!kiosk || !ready || modal === "idle") return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Nothing to clear on an untouched Home screen: stay as the attract screen.
        if (isEmptyJourney(current.current) && routeRef.current.name === "home") arm();
        else setModal("idle");
      }, KIOSK_IDLE_WARNING_MS);
    };
    arm();
    for (const e of KIOSK_ACTIVITY_EVENTS) window.addEventListener(e, arm, { capture: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const e of KIOSK_ACTIVITY_EVENTS) window.removeEventListener(e, arm, { capture: true });
    };
  }, [kiosk, ready, modal]);
  useEffect(() => {
    if (modal !== "idle") return;
    const timer = window.setTimeout(startFresh, KIOSK_IDLE_RESET_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);
  /** Clears this visitor's journey (kiosk storage included) and returns Home. */
  function startFresh() {
    set(emptyJourney);
    if (kiosk) {
      try {
        sessionStorage.removeItem(KIOSK_STORAGE_KEY);
      } catch {}
    }
    go("home");
  }
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function closeModal() {
    setPending(null);
    setModal("");
  }
  function go(s: string) {
    closeModal();
    location.hash = s;
    setRoute(parseRoute(s));
  }
  function finishMatch() {
    history.replaceState(null, "", "#reveal");
    setRoute({ name: "reveal" });
  }
  const results = ["reveal", "options", "compare", "matching"];
  let content;
  if (route.name === "home") content = <Landing go={go} />;
  else if (route.name === "q")
    content = (
      <Matcher
        step={
          !p.ambitions.length ? 1 : route.step === 3 && !p.interests.length ? 2 : route.step
        }
        p={p}
        set={set}
        go={go}
      />
    );
  else if (route.name === "journey" || (results.includes(route.name) && !p.complete))
    content = <Journey go={go} p={p} reset={() => setModal("reset")} kiosk={kiosk} />;
  else if (route.name === "matching")
    content = (
      <MatchSequence p={p} finish={finishMatch} />
    );
  else if (route.name === "reveal") content = <Reveal p={p} go={go} />;
  else if (route.name === "options") content = <Options p={p} go={go} />;
  else if (route.name === "compare") content = <Compare p={p} go={go} />;
  else if (route.name === "mba")
    content = <ProgramDetail p={p} go={go} id={route.id} />;
  else if (route.name === "careers") content = <Careers go={go} />;
  else if (route.name === "cluster") content = <CareerCluster go={go} id={route.id} />;
  else if (route.name === "occupation") content = <OccupationProfile go={go} code={route.code} />;
  else if (route.name === "career" || route.name === "bridge")
    content = (
      <CareerPage go={go} id={route.id} isBridge={route.name === "bridge"} />
    );
  else
    content = (
      <Experiences go={go} id={route.name === "experience" ? route.id : undefined} />
    );
  return (
    <>
      <a
        href="#content"
        className="skip"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Header go={go} onMenu={() => setModal("menu")} menuOpen={modal === "menu"} />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <main id="content" ref={main} tabIndex={-1} data-ready={ready} key={page}>
        {content}
      </main>
      <SiteFooter
        onContact={() => setModal("contact")}
        onAbout={() => setModal("about")}
        open={modal === "contact" || modal === "about" ? modal : ""}
      />
      <dialog
        id="site-dialog"
        aria-label={modal ? modalLabels[modal] : modalLabels.menu}
        ref={dialog}
        onCancel={closeModal}
        onClick={(e) => {
          if (e.target === dialog.current) closeModal();
        }}
      >
        <div className="dialog-panel">
          <button
            className="close"
            onClick={closeModal}
            aria-label="Close"
          >
            <X />
          </button>
          <span className="eyebrow">
            <i /> MBA FUTURE
          </span>
          <h2>
            {modal === "reset"
              ? "Start a new journey?"
              : modal === "import"
                ? "Open a shared journey?"
                : modal === "idle"
                  ? "Ready for the next MBA journey?"
                  : modal === "share-error"
                    ? "This link couldn’t be opened."
                    : modal === "contact"
                      ? `${contactCopy.panelHeading}.`
                      : modal === "about"
                        ? `${prototypeStatus.aboutHeading}.`
                        : "Your discovery paths"}
          </h2>
          {modal === "contact" ? (
            <ContactPanel kiosk={kiosk} onJourney={() => go("journey")} />
          ) : modal === "about" ? (
            <AboutPanel />
          ) : modal === "idle" ? (
            <>
              <p>
                This screen will start fresh for the next visitor in{" "}
                {Math.round(KIOSK_IDLE_RESET_MS / 1000)} seconds unless you continue.
              </p>
              <div className="actions">
                <button className="action" onClick={closeModal}>
                  Continue my journey
                </button>
                <button className="action secondary" onClick={startFresh}>
                  Start fresh
                </button>
              </div>
            </>
          ) : modal === "share-error" ? (
            <>
              <p>
                This shared MBA future may be incomplete or out of date. You can
                start your own journey instead.
              </p>
              <div className="actions">
                <button className="action" onClick={() => go("q1")}>
                  Find my MBA
                </button>
                <button className="action secondary" onClick={closeModal}>
                  Back to home
                </button>
              </div>
            </>
          ) : modal === "reset" ? (
            <>
              <p>
                This clears the selections and career visits saved on this
                device. Download your result first if you want to keep it.
              </p>
              <div className="actions">
                <button
                  className="action"
                  onClick={() => {
                    set(emptyJourney);
                    go("home");
                  }}
                >
                  Start again
                </button>
                <button
                  className="action secondary"
                  onClick={closeModal}
                >
                  Keep my journey
                </button>
              </div>
            </>
          ) : modal === "import" ? (
            <>
              <p>
                Opening this shared MBA future replaces the selections and
                career visits saved on this device.
              </p>
              <div className="actions">
                <button
                  className="action"
                  onClick={() => {
                    if (pending) set(pending);
                    closeModal();
                  }}
                >
                  Open shared journey
                </button>
                <button
                  className="action secondary"
                  onClick={closeModal}
                >
                  Keep my journey
                </button>
              </div>
            </>
          ) : (
            <nav>
              {[
                ["home", "Discovery home"],
                ["q1", "Find my MBA"],
                ["careers", "Explore careers"],
                ["experiences", "The Flinders difference"],
                ["journey", "My journey"],
                ...(p.complete ? [["options", "Compare my matches"]] : []),
              ].map(([s, t]) => (
                <button key={s} onClick={() => go(s)}>
                  {t}
                  <ArrowRight />
                </button>
              ))}
            </nav>
          )}
        </div>
      </dialog>
    </>
  );
}
