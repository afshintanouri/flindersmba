/**
 * Roadshow kiosk mode.
 *
 * Launch:  https://<site>/flindersmba/?kiosk=1   (also ?kiosk=true)
 * A hash route may follow: /flindersmba/?kiosk=1#careers
 *
 * In kiosk mode the visitor's journey lives only in this tab's
 * sessionStorage (never localStorage), so a new visitor does not inherit a
 * previous visitor's selections, and an idle reset clears it. Ordinary
 * (personal device) sessions are unaffected.
 */

/** No pointer, touch, key or navigation activity for this long → "Ready for the next MBA journey?" */
export const KIOSK_IDLE_WARNING_MS = 2 * 60 * 1000;
/** No answer to the prompt for this long → the journey is cleared and Home is shown. */
export const KIOSK_IDLE_RESET_MS = 30 * 1000;

/** Kiosk journey storage key (sessionStorage only). */
export const KIOSK_STORAGE_KEY = "flinders-mba-journey.kiosk";

export function isKioskSearch(search: string): boolean {
  const v = new URLSearchParams(search).get("kiosk");
  return v !== null && ["1", "true", "yes"].includes(v.trim().toLowerCase());
}

/** Events that count as visitor activity for the idle timer. */
export const KIOSK_ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "hashchange"] as const;
