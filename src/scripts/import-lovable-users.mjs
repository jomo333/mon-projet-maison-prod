#!/usr/bin/env node
/**
 * Import utilisateurs depuis un CSV (export Lovable ou manuel) vers Supabase.
 * Crée : auth.users, profiles, subscriptions.
 *
 * Variables d'environnement :
 *   SUPABASE_URL              (requis)
 *   SUPABASE_SERVICE_ROLE_KEY (requis)
 *
 * Usage :
 *   node scripts/import-lovable-users.mjs chemin/vers/fichier.csv
 *
 * CSV : colonnes email (ou courriel), display_name (ou nom), plan (ou forfait).
 * Séparateur : virgule. Ne pas mettre de virgule dans les valeurs.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Charger .env depuis le dossier courant ou la racine du projet (parent de src/)
function loadEnv() {
  const cwd = process.cwd();
  const dirs = [cwd, resolve(cwd, "..")];
  for (const dir of dirs) {
    const envPath = resolve(dir, ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
      break;
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Erreur: définir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (PowerShell: $env:SUPABASE_URL='...'; $env:SUPABASE_SERVICE_ROLE_KEY='...')"
  );
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-lovable-users.mjs chemin/vers/fichier.csv");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Résoudre les noms de colonnes (email/courriel, display_name/nom, plan/forfait)
function headerIndex(header, names) {
  const i = header.findIndex((c) => names.includes((c || "").trim().toLowerCase()));
  return i >= 0 ? i : -1;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], headers: [] };
  const headers = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

async function getPlanIdByName(name) {
  if (!name || !name.trim()) return null;
  const { data } = await supabase.from("plans").select("id").ilike("name", name.trim()).limit(1).single();
  return data?.id ?? null;
}

async function main() {
  const absPath = resolve(process.cwd(), csvPath);
  let content;
  try {
    content = readFileSync(absPath, "utf8");
  } catch (e) {
    console.error("Fichier introuvable:", absPath, e.message);
  }

  const { headers, rows } = parseCsv(content);
  const emailIdx = headerIndex(headers, ["email", "courriel"]) >= 0 ? headerIndex(headers, ["email", "courriel"]) : headers.findIndex((h) => /email|courriel/i.test((h || "").trim()));
  const nameIdx = headerIndex(headers, ["display_name", "nom", "name"]) >= 0 ? headerIndex(headers, ["display_name", "nom", "name"]) : headers.findIndex((h) => /nom|name|display_name/i.test((h || "").trim()));
  const planIdx = headerIndex(headers, ["plan", "forfait"]) >= 0 ? headerIndex(headers, ["plan", "forfait"]) : headers.findIndex((h) => /plan|forfait/i.test((h || "").trim()));

  if (emailIdx < 0) {
    console.error("Aucune colonne email/courriel trouvée dans le CSV. En-têtes:", headers.join(", "));
    process.exit(1);
  }
  const emailKey = headers[emailIdx];
  const nameKey = nameIdx >= 0 ? headers[nameIdx] : "display_name";
  const planKey = planIdx >= 0 ? headers[planIdx] : "plan";

  console.log("Colonnes utilisées: email=" + emailKey + ", nom=" + nameKey + ", plan=" + planKey);
  console.log("Lignes à traiter:", rows.length);

  const resetLinks = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = (row[emailKey] ?? row.email ?? row.courriel ?? "").trim();
    const displayName = (row[nameKey] ?? row.display_name ?? row.nom ?? "").trim();
    const planName = (row[planKey] ?? row.plan ?? row.forfait ?? "").trim();

    if (!email) {
      console.warn("Ligne " + (i + 2) + ": email vide, ignorée.");
      continue;
    }

    try {
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: displayName ? { display_name: displayName } : undefined,
      });

      if (createError) {
        if (createError.message && createError.message.includes("already been registered")) {
          console.warn("Déjà inscrit:", email, "- ignoré.");
          continue;
        }
        console.error("Création auth échouée pour", email, createError.message);
        continue;
      }

      const userId = userData?.user?.id;
      if (!userId) {
        console.error("Pas d'id utilisateur pour", email);
        continue;
      }

      await supabase.from("profiles").upsert(
        { user_id: userId, display_name: displayName || null },
        { onConflict: "user_id" }
      );

      const planId = await getPlanIdByName(planName);
      const startDate = new Date().toISOString().slice(0, 10);
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan_id: planId,
          status: "active",
          billing_cycle: "monthly",
          start_date: startDate,
        },
        { onConflict: "user_id" }
      );

      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      const resetLink = linkData?.properties?.action_link;
      if (resetLink) resetLinks.push({ email, link: resetLink });

      console.log("OK:", email, displayName || "-", planName || "-");
    } catch (err) {
      console.error("Erreur pour", email, err.message);
    }
  }

  if (resetLinks.length > 0) {
    console.log("\n--- Liens de réinitialisation mot de passe ---");
    resetLinks.forEach(({ email, link }) => console.log(email + "\t" + link));
  }
  console.log("\nTerminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
