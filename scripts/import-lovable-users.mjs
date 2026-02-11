#!/usr/bin/env node
/**
 * Import users from a Lovable CSV into Supabase.
 * Creates auth users, profiles, and optional subscriptions (plan).
 * Outputs a CSV with password reset links to send to users.
 *
 * Usage: node scripts/import-lovable-users.mjs <path-to.csv>
 * Env:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or .env.import)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CSV_PATH = process.argv[2] || "lovable-users.csv";
const OUTPUT_PATH = "import-reset-links.csv";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.import");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));
  return { headers, rows };
}

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || (c === "\n" && !inQuotes)) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function rowToRecord(headers, row) {
  const rec = {};
  headers.forEach((h, i) => {
    rec[h.toLowerCase().replace(/\s/g, "_")] = (row[i] ?? "").trim();
  });
  return rec;
}

function randomPassword() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

loadEnv();
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use .env.import or env vars.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const csvPath = resolve(process.cwd(), CSV_PATH);
  let content;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch (e) {
    console.error("Cannot read file:", CSV_PATH, e.message);
    process.exit(1);
  }
  const { headers, rows } = parseCSV(content);
  const emailIdx = headers.findIndex((h) => h.toLowerCase().replace(/\s/g, "_") === "email");
  if (emailIdx === -1) {
    console.error("CSV must have an 'email' column.");
    process.exit(1);
  }

  const { data: plans } = await supabase.from("plans").select("id, name");
  const planByName = new Map((plans || []).map((p) => [p.name.trim().toLowerCase(), p.id]));

  const results = [];
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const rec = rowToRecord(headers, rows[i]);
    const email = (rec.email || "").trim();
    if (!email) {
      skipped++;
      continue;
    }
    const displayName = rec.display_name || rec.displayname || "";
    const planName = (rec.plan || "").trim();
    const planId = planName ? planByName.get(planName.toLowerCase()) : null;

    try {
      const password = randomPassword();
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: displayName ? { full_name: displayName } : undefined,
      });

      if (createError) {
        if (createError.message && createError.message.includes("already been registered")) {
          console.log("Skip (exists):", email);
          skipped++;
          const { data: linkData } = await supabase.auth.admin.generateLink({ type: "recovery", email });
          const link = linkData?.properties?.action_link ?? linkData?.action_link ?? "";
          if (link) results.push({ email, reset_password_link: link });
        } else {
          console.error("Error creating", email, createError.message);
          errors++;
        }
        continue;
      }

      const userId = userData.user?.id;
      if (!userId) {
        errors++;
        continue;
      }

      await supabase.from("profiles").upsert(
        { user_id: userId, display_name: displayName || null },
        { onConflict: "user_id" }
      );

      if (planId) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          billing_cycle: "monthly",
        });
      }

      const { data: linkData } = await supabase.auth.admin.generateLink({ type: "recovery", email });
      const resetLink = linkData?.properties?.action_link ?? linkData?.action_link ?? "";
      results.push({ email, reset_password_link: resetLink });
      created++;
      console.log("Created:", email, planName || "(no plan)");
    } catch (err) {
      console.error("Error for", email, err.message);
      errors++;
    }
  }

  const outCsv = ["email,reset_password_link", ...results.map((r) => `"${r.email}","${r.reset_password_link}"`)].join("\n");
  writeFileSync(resolve(process.cwd(), OUTPUT_PATH), outCsv, "utf8");
  console.log("\nDone. Created:", created, "Skipped:", skipped, "Errors:", errors);
  console.log("Reset links written to:", OUTPUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
