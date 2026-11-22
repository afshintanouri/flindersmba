import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { contactCopy, contactMailto, mbaContact } from "@/content/contact";
import { prototypeStatus } from "@/content/prototype";

/** The standard LinkedIn mark (lucide-react v1 ships no brand icons). Decorative. */
export function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/** Name and role of the MBA team contact. */
export function ContactIdentity() {
  return (
    <p className="contact-identity">
      <strong>{mbaContact.name}</strong>
      <span>
        {mbaContact.role}, {mbaContact.organisation}
      </span>
    </p>
  );
}

/**
 * Email and LinkedIn actions. Not rendered on a shared kiosk: there the QR
 * hand-off carries the visitor's result (with these options) to their phone.
 */
export function ContactActions() {
  return (
    <div className="actions contact-actions">
      <a className="action" href={contactMailto()} aria-label={`Email ${mbaContact.name}, ${mbaContact.role}`}>
        <Mail size={18} aria-hidden="true" />
        Email the MBA Director
        <ArrowRight size={17} aria-hidden="true" />
      </a>
      <a
        className="action secondary"
        href={mbaContact.linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Connect with ${mbaContact.name} on LinkedIn (opens in a new tab)`}
      >
        <LinkedInIcon />
        Connect on LinkedIn
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </div>
  );
}

/** Contact panel body (inside the existing dialog). */
export function ContactPanel({ kiosk, onJourney }: { kiosk: boolean; onJourney: () => void }) {
  return (
    <div className="contact-panel">
      <p>{contactCopy.intro}</p>
      <ContactIdentity />
      {kiosk ? (
        <>
          <p className="note">{contactCopy.kioskPanel}</p>
          <div className="actions">
            <button className="action" onClick={onJourney}>
              Go to My MBA Future
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <ContactActions />
      )}
    </div>
  );
}

/** Final human step on My MBA Future (personal devices). */
export function JourneyContact() {
  return (
    <section className="contact-section" aria-labelledby="contact-heading">
      <h2 className="micro" id="contact-heading">
        {contactCopy.journeyHeading.toUpperCase()}
      </h2>
      <p>{contactCopy.journeyIntro}</p>
      <ContactIdentity />
      <ContactActions />
    </section>
  );
}

/**
 * About this prototype (inside the existing dialog). No links: the general Flinders MBA
 * page URL is not yet verified, so it is not linked here.
 */
export function AboutPanel() {
  return (
    <div className="about-panel">
      <p>{prototypeStatus.statement}</p>
      <p className="note">{prototypeStatus.sources}</p>
    </div>
  );
}

/** Restrained global footer: product, prototype status, contact prompt, About. */
export function SiteFooter({
  onContact,
  onAbout,
  open,
}: {
  onContact: () => void;
  onAbout: () => void;
  open: "" | "contact" | "about";
}) {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <p className="footer-status">
          <span className="micro">{prototypeStatus.product.toUpperCase()}</span>
          <span>{prototypeStatus.label}</span>
        </p>
        <p className="footer-prompt">
          <span className="micro">{contactCopy.footerPrompt.toUpperCase()}</span>
          <button
            className="text-link footer-contact"
            onClick={onContact}
            aria-haspopup="dialog"
            aria-expanded={open === "contact"}
            aria-controls="site-dialog"
          >
            {contactCopy.footerAction}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </p>
        <button
          className="text-link footer-about"
          onClick={onAbout}
          aria-haspopup="dialog"
          aria-expanded={open === "about"}
          aria-controls="site-dialog"
        >
          {prototypeStatus.aboutAction}
        </button>
      </div>
    </footer>
  );
}
