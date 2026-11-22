import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { getInterest } from '@/content';
import type { Journey } from '@/lib/journey';
import { matchProgrammes } from '@/lib/matchmaker';
import { Action } from './elements';

/** The three inputs the rules-based Matchmaker combines (shown as a staggered checklist). */
const CHECKS = ['Your ambitions', 'Your interests', 'Your ideal experience'];

export function MatchSequence({ p, finish }: { p: Journey; finish: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const kind = matchProgrammes(p).classification;
  const [title, cue] =
    kind === 'clear'
      ? [<>Meet your<br /><em>MBA match.</em></>, 'Your strongest match is ready.']
      : kind === 'close'
        ? [<>Meet your<br /><em>MBA matches.</em></>, 'Your strongest matches are ready.']
        : [<>Explore your<br /><em>MBA options.</em></>, 'Your MBA options are ready.'];
  const found =
    kind === 'clear'
      ? 'We’ve found your MBA direction.'
      : kind === 'close'
        ? 'We’ve found your MBA matches.'
        : 'We’ve found your MBA options.';
  useEffect(() => {
    if (!revealing) return;
    const timer = window.setTimeout(finish, 850);
    return () => window.clearTimeout(timer);
  }, [revealing, finish]);
  return <section className={'matching match-sequence' + (revealing ? ' is-revealing' : '')}>
    <div className="wrap">
      <span className="eyebrow"><i /> YOUR MATCHMAKER / PERSONAL EDITION</span>
      <h1>{revealing ? title : <>What sparked<br /><em>your curiosity.</em></>}</h1>
      <ul className="interest-roll" aria-label="Your selected interests">{p.interests.map((id, index) => <li key={id}><span aria-hidden="true">0{index + 1}</span>{getInterest(id).label}</li>)}</ul>
      <ol className="match-checks" aria-label="What shaped your result">
        {CHECKS.map((c) => <li key={c}><Check aria-hidden="true" />{c}</li>)}
      </ol>
      <div className="match-cue" aria-live="polite">{revealing ? cue : found}</div>
      <Action disabled={revealing} onClick={() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? finish() : setRevealing(true)}>Reveal my MBA</Action>
    </div>
  </section>;
}
