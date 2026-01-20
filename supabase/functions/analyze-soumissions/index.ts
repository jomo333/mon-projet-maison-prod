import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoumissionDoc {
  file_name: string;
  file_url: string;
}

// Fonction pour extraire le texte d'un PDF en utilisant un service externe
async function extractPdfContent(pdfUrl: string): Promise<string> {
  try {
    console.log("Fetching PDF from:", pdfUrl);
    
    // Télécharger le PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.error("Failed to fetch PDF:", response.status);
      return `[Impossible de télécharger le document]`;
    }
    
    const pdfBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);
    
    // Extraire le texte basique du PDF (recherche de streams de texte)
    const text = extractTextFromPdfBytes(pdfBytes);
    
    if (text && text.trim().length > 50) {
      return text;
    }
    
    return `[Document PDF - extraction de texte limitée. Taille: ${Math.round(pdfBuffer.byteLength / 1024)} KB]`;
  } catch (error) {
    console.error("Error extracting PDF content:", error);
    return `[Erreur lors de l'extraction du contenu]`;
  }
}

// Extraction basique de texte depuis les bytes d'un PDF
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(bytes);
  
  const extractedTexts: string[] = [];
  
  // Chercher les objets stream contenant du texte
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
  let match;
  
  while ((match = streamRegex.exec(content)) !== null) {
    const streamContent = match[1];
    
    // Extraire le texte entre parenthèses (format PDF pour les strings)
    const textMatches = streamContent.match(/\(([^)]*)\)/g);
    if (textMatches) {
      for (const textMatch of textMatches) {
        const text = textMatch.slice(1, -1)
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\");
        
        if (text.trim().length > 2 && !/^[\x00-\x1F\x7F-\xFF]+$/.test(text)) {
          extractedTexts.push(text.trim());
        }
      }
    }
    
    // Chercher aussi les hex strings
    const hexMatches = streamContent.match(/<([0-9A-Fa-f]+)>/g);
    if (hexMatches) {
      for (const hexMatch of hexMatches) {
        const hex = hexMatch.slice(1, -1);
        if (hex.length > 4 && hex.length % 2 === 0) {
          try {
            let text = "";
            for (let i = 0; i < hex.length; i += 2) {
              const charCode = parseInt(hex.substr(i, 2), 16);
              if (charCode >= 32 && charCode < 127) {
                text += String.fromCharCode(charCode);
              }
            }
            if (text.trim().length > 2) {
              extractedTexts.push(text.trim());
            }
          } catch {
            // Ignorer les erreurs de conversion
          }
        }
      }
    }
  }
  
  // Chercher aussi le texte BT...ET (text objects)
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/gi;
  while ((match = btEtRegex.exec(content)) !== null) {
    const textObject = match[1];
    const tjMatches = textObject.match(/\(([^)]*)\)\s*Tj/g);
    if (tjMatches) {
      for (const tjMatch of tjMatches) {
        const text = tjMatch.match(/\(([^)]*)\)/)?.[1] || "";
        if (text.trim().length > 1) {
          extractedTexts.push(text.trim());
        }
      }
    }
  }
  
  // Nettoyer et joindre le texte
  const uniqueTexts = [...new Set(extractedTexts)];
  return uniqueTexts.join(" ").replace(/\s+/g, " ").trim();
}

// Fonction pour extraire le contenu d'autres types de fichiers
async function extractFileContent(fileUrl: string, fileName: string): Promise<string> {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  
  if (['pdf'].includes(extension)) {
    return await extractPdfContent(fileUrl);
  }
  
  if (['txt', 'csv', 'json', 'xml'].includes(extension)) {
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        const text = await response.text();
        return text.substring(0, 10000); // Limiter à 10k caractères
      }
    } catch (error) {
      console.error("Error reading text file:", error);
    }
    return `[Impossible de lire le fichier texte]`;
  }
  
  if (['doc', 'docx', 'xls', 'xlsx'].includes(extension)) {
    return `[Document ${extension.toUpperCase()} - L'extraction directe n'est pas supportée. Veuillez fournir les informations clés manuellement: montant total, détails des travaux, conditions, garanties]`;
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return `[Image: ${fileName} - Veuillez décrire le contenu pertinent de cette image]`;
  }
  
  return `[Format de fichier non supporté: ${extension}]`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tradeName, tradeDescription, documents } = await req.json() as {
      tradeName: string;
      tradeDescription: string;
      documents: SoumissionDoc[];
    };

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun document à analyser" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing ${documents.length} documents for ${tradeName}`);

    // Extraire le contenu de chaque document
    const documentContents: string[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`Processing document ${i + 1}: ${doc.file_name}`);
      
      const content = await extractFileContent(doc.file_url, doc.file_name);
      documentContents.push(`
### Document ${i + 1}: ${doc.file_name}

${content}
`);
    }

    const allDocumentsContent = documentContents.join("\n---\n");

    const systemPrompt = `Tu es un expert en construction résidentielle au Québec, spécialisé dans l'analyse des soumissions de sous-traitants.
Tu dois analyser les soumissions reçues pour un corps de métier spécifique et fournir une recommandation détaillée.

IMPORTANT: Tu as accès au contenu extrait des documents PDF/fichiers. Analyse ce contenu pour:
1. Identifier les montants proposés
2. Comparer les portées de travaux
3. Évaluer les conditions et garanties
4. Déterminer le meilleur rapport qualité-prix

Ton analyse doit inclure:
1. Un résumé de chaque soumission avec les montants identifiés
2. Un tableau comparatif des éléments clés (prix, délais, garanties, exclusions)
3. Une analyse du rapport qualité-prix
4. Une recommandation claire avec justification
5. Des points de négociation suggérés

Réponds en français. Sois précis, professionnel et objectif.`;

    const userPrompt = `Analyse les soumissions pour le corps de métier suivant:

**Corps de métier:** ${tradeName}
**Description:** ${tradeDescription}

---

## CONTENU DES DOCUMENTS DE SOUMISSION

${allDocumentsContent}

---

Fournis une analyse détaillée et structurée avec:
1. **Résumé de chaque soumission** (montants, portée des travaux, délais)
2. **Tableau comparatif** des éléments clés
3. **Analyse du rapport qualité-prix** 
4. **Recommandation finale** avec justification
5. **Points de négociation** suggérés pour obtenir de meilleures conditions`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'analyse" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("analyze-soumissions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
