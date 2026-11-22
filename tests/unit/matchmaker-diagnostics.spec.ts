import { test } from "@playwright/test";
import { diagnose } from "@/lib/matchmaker-diagnostics";
import { personas } from "./personas";

/** Prints the score table for every persona (review aid; always passes). */
test("persona diagnostics report", async ({}, info) => {
  const report = personas.map((p) => diagnose(p, p.name)).join("\n\n");
  if (process.env.MATCHMAKER_REPORT) console.log(report);
  await info.attach("matchmaker-diagnostics.txt", { body: report, contentType: "text/plain" });
});
