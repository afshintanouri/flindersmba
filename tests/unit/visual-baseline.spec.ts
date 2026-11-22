import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * The approved visual baseline record used by CI must stay valid.
 *
 * approvedCommit is a full commit hash, or "initial": the repository's root
 * commit. "initial" is used by the history-free public release repository,
 * whose first commit is the approved release snapshot (private commit hashes
 * do not exist there).
 */
test("approved visual baseline record is valid", () => {
  const record = JSON.parse(readFileSync("tests/visual-baseline.json", "utf8"));
  expect(record.approvedCommit).toMatch(/^([0-9a-f]{40}|initial)$/);
  expect(record.approvedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(record.approvedBy).toBeTruthy();
  expect(record.history.map((h: { commit: string }) => h.commit)).toContain(record.approvedCommit);
  if (record.approvedCommit === "initial") {
    // Exactly one root commit, so "initial" is unambiguous.
    const roots = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], { encoding: "utf8" }).trim().split("\n");
    expect(roots).toHaveLength(1);
  } else {
    // The approved commit must exist in this repository's history.
    expect(() => execFileSync("git", ["cat-file", "-e", `${record.approvedCommit}^{commit}`])).not.toThrow();
  }
});
