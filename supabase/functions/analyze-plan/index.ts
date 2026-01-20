import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base de données des prix Québec 2025
const PRIX_QUEBEC_2025 = {
  bois: {
    "2x4x8_SPF": 4.50,
    "2x6x8_SPF": 7.25,
    "2x8x12_SPF": 16.80,
    "contreplaque_3_4_4x8": 52.00,
    "OSB_7_16_4x8": 24.50,
  },
  gypse: {
    "regulier_1_2_4x8": 18.50,
    "resistant_1_2_4x8": 22.00,
  },
  isolation: {
    "R20_fibre_verre_pi2": 0.85,
    "R30_fibre_verre_pi2": 1.15,
  },
  toiture: {
    "bardeau_asphalte_25ans_carre": 95.00,
    "membrane_Tyvek_pi2": 0.42,
  },
  beton: {
    "ciment_portland_30kg": 12.50,
    "beton_30MPa_m3": 165.00,
  },
  taux_CCQ_2025: {
    charpentier_menuisier: 48.50,
    electricien: 52.00,
    plombier: 54.00,
    frigoriste: 56.00,
    ferblantier: 50.00,
    briqueteur_macon: 49.00,
    platrier: 46.00,
    peintre: 42.00,
  }
};

const SYSTEM_PROMPT_EXTRACTION = `Tu es un ESTIMATEUR PROFESSIONNEL QUÉBÉCOIS CERTIFIÉ avec 25 ans d'expérience.

MISSION: Analyser TOUS les plans de construction fournis simultanément pour produire une estimation COMPLÈTE.

## EXTRACTION REQUISE - TOUTES LES CATÉGORIES

Tu DOIS produire des estimations pour CHAQUE catégorie suivante, même si les plans ne montrent pas tous les détails:

1. **Fondation** - Semelles, murs de fondation, dalle de béton, imperméabilisation
2. **Structure** - Charpente, solives, colombages, poutres, poutrelles
3. **Toiture** - Fermes de toit, couverture, bardeaux, soffites, fascias
4. **Revêtement extérieur** - Parement, briques, pierre, vinyle
5. **Fenêtres et portes** - Toutes fenêtres, portes extérieures, portes intérieures
6. **Isolation et pare-air** - Isolation murs, plafonds, pare-vapeur, Tyvek
7. **Électricité** - Panneau, filage, prises, interrupteurs, luminaires
8. **Plomberie** - Tuyauterie, drains, robinetterie, chauffe-eau
9. **Chauffage/CVAC** - Système de chauffage, ventilation, climatisation
10. **Finition intérieure** - Gypse, peinture, moulures, planchers
11. **Cuisine** - Armoires, comptoirs, électroménagers
12. **Salle(s) de bain** - Vanités, toilettes, douches/bains

## RÈGLES CRITIQUES

- Analyse TOUTES les pages/images fournies ENSEMBLE
- Pour les éléments non visibles sur les plans, ESTIME en fonction de la superficie et du type de projet
- Utilise les prix du marché Québec 2025
- Ratio main-d'œuvre/matériaux: 35-50% selon le type de travail
- TOUJOURS inclure TPS 5% + TVQ 9.975%
- TOUJOURS ajouter contingence 5%

## PRIX DE RÉFÉRENCE QUÉBEC 2025 (par pi² de superficie habitable)

| Catégorie | Économique | Standard | Haut de gamme |
|-----------|------------|----------|---------------|
| Fondation | 35-45$ | 45-60$ | 60-80$ |
| Structure | 25-35$ | 35-50$ | 50-70$ |
| Toiture | 15-20$ | 20-30$ | 30-45$ |
| Revêtement | 15-25$ | 25-40$ | 40-70$ |
| Fenêtres/Portes | 20-30$ | 30-50$ | 50-80$ |
| Isolation | 8-12$ | 12-18$ | 18-25$ |
| Électricité | 15-20$ | 20-30$ | 30-50$ |
| Plomberie | 12-18$ | 18-28$ | 28-45$ |
| CVAC | 15-25$ | 25-40$ | 40-60$ |
| Gypse/Peinture | 12-18$ | 18-25$ | 25-35$ |
| Planchers | 8-15$ | 15-30$ | 30-60$ |
| Cuisine | 8k-15k$ | 15k-35k$ | 35k-80k$ |
| Salle de bain | 5k-10k$ | 10k-25k$ | 25k-50k$ |

## FORMAT DE RÉPONSE JSON STRICT

{
  "extraction": {
    "type_projet": "CONSTRUCTION_NEUVE | AGRANDISSEMENT | RENOVATION | GARAGE | GARAGE_AVEC_ETAGE",
    "superficie_nouvelle_pi2": number,
    "nombre_etages": number,
    "plans_analyses": number,
    "categories": [
      {
        "nom": "Nom de la catégorie",
        "items": [
          {
            "description": "Description du matériau/travail",
            "quantite": number,
            "unite": "pi² | vg³ | ml | pcs | unité | forfait",
            "dimension": "dimension si applicable",
            "prix_unitaire": number,
            "total": number,
            "source": "Page X ou Estimé",
            "confiance": "haute | moyenne | basse"
          }
        ],
        "sous_total_materiaux": number,
        "heures_main_oeuvre": number,
        "taux_horaire_CCQ": number,
        "sous_total_main_oeuvre": number,
        "sous_total_categorie": number
      }
    ],
    "elements_manquants": ["Éléments non spécifiés"],
    "ambiguites": ["Informations ambiguës"],
    "incoherences": ["Incohérences détectées"]
  },
  "totaux": {
    "total_materiaux": number,
    "total_main_oeuvre": number,
    "sous_total_avant_taxes": number,
    "contingence_5_pourcent": number,
    "sous_total_avec_contingence": number,
    "tps_5_pourcent": number,
    "tvq_9_975_pourcent": number,
    "total_ttc": number
  },
  "validation": {
    "surfaces_completes": boolean,
    "ratio_main_oeuvre_materiaux": number,
    "ratio_acceptable": boolean,
    "alertes": ["Alertes importantes"]
  },
  "recommandations": ["Recommandations"],
  "resume_projet": "Description du projet"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode, finishQuality = "standard", stylePhotoUrls = [], imageUrls: bodyImageUrls, imageUrl: singleImageUrl } = body;
    
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured - ANTHROPIC_API_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Quality level descriptions
    const qualityDescriptions: Record<string, string> = {
      "economique": "ÉCONOMIQUE - Matériaux entrée de gamme: plancher flottant 8mm, armoires mélamine, comptoirs stratifiés, portes creuses",
      "standard": "STANDARD - Bon rapport qualité-prix: bois franc ingénierie, armoires semi-custom, quartz, portes MDF pleines",
      "haut-de-gamme": "HAUT DE GAMME - Finitions luxueuses: bois franc massif, armoires sur mesure, granite/marbre, portes massives"
    };

    let imageUrls: string[] = [];
    
    // Handle image URLs
    if (mode === "plan") {
      if (bodyImageUrls && Array.isArray(bodyImageUrls)) {
        imageUrls = bodyImageUrls;
      } else if (singleImageUrl) {
        imageUrls = [singleImageUrl];
      }
      if (stylePhotoUrls && Array.isArray(stylePhotoUrls) && stylePhotoUrls.length > 0) {
        imageUrls = [...imageUrls, ...stylePhotoUrls];
      }
    } else if (stylePhotoUrls && Array.isArray(stylePhotoUrls) && stylePhotoUrls.length > 0) {
      imageUrls = [...stylePhotoUrls];
    }

    console.log('Analyzing:', { mode, imageCount: imageUrls.length, quality: finishQuality });

    // Build the prompt
    let extractionPrompt: string;
    
    if (mode === "plan") {
      extractionPrompt = `Analyse ${imageUrls.length > 1 ? 'ces ' + imageUrls.length + ' plans' : 'ce plan'} de construction pour un projet AU QUÉBEC.

QUALITÉ DE FINITION: ${qualityDescriptions[finishQuality] || qualityDescriptions["standard"]}

${body.additionalNotes ? `NOTES CLIENT: ${body.additionalNotes}` : ''}

INSTRUCTIONS CRITIQUES:
1. Examine TOUTES les pages/images fournies ensemble
2. Extrait les dimensions et quantités visibles
3. Pour chaque catégorie NON VISIBLE, ESTIME les coûts basés sur la superficie totale
4. Tu DOIS retourner TOUTES les 12 catégories principales (Fondation, Structure, Toiture, Revêtement, Fenêtres, Isolation, Électricité, Plomberie, CVAC, Finition, Cuisine, Salle de bain)
5. Applique les prix du marché Québec 2025

Retourne le JSON structuré COMPLET avec TOUTES les catégories.`;
    } else {
      // Manual mode
      const { projectType, squareFootage, numberOfFloors, hasGarage, foundationSqft, floorSqftDetails, additionalNotes } = body;
      
      extractionPrompt = `Génère une estimation budgétaire COMPLÈTE pour ce projet au QUÉBEC en 2025.

## PROJET À ESTIMER
- TYPE: ${projectType || 'Maison unifamiliale'}
- ÉTAGES: ${numberOfFloors || 1}
- SUPERFICIE TOTALE: ${squareFootage || 1500} pi²
${foundationSqft ? `- FONDATION: ${foundationSqft} pi²` : ''}
${floorSqftDetails?.length ? `- DÉTAIL ÉTAGES: ${floorSqftDetails.join(', ')} pi²` : ''}
- GARAGE: ${hasGarage ? 'Oui (attaché)' : 'Non'}
- QUALITÉ: ${qualityDescriptions[finishQuality] || qualityDescriptions["standard"]}
${additionalNotes ? `- NOTES CLIENT: ${additionalNotes}` : ''}

INSTRUCTIONS CRITIQUES:
1. Tu DOIS retourner TOUTES les 12 catégories principales
2. Utilise les prix du MILIEU de la fourchette pour la qualité sélectionnée
3. Inclus matériaux ET main-d'œuvre pour chaque catégorie
4. Calcule contingence 5% + TPS 5% + TVQ 9.975%

Retourne le JSON structuré COMPLET.`;
    }

    let finalContent: string;

    if (mode === 'plan' && imageUrls.length > 0) {
      // Fetch and convert all images to base64
      console.log(`Converting ${imageUrls.length} images to base64...`);
      
      const imageContents: any[] = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        console.log(`Fetching image ${i + 1}/${imageUrls.length}...`);
        
        try {
          const resp = await fetch(url);
          if (!resp.ok) {
            console.log(`Failed to fetch image ${i + 1}: ${resp.status}`);
            continue;
          }
          
          const arrayBuffer = await resp.arrayBuffer();
          const bytes = arrayBuffer.byteLength;
          
          // Skip very large images (>5MB)
          if (bytes > 5_000_000) {
            console.log(`Skipping large image ${i + 1} (${Math.round(bytes / 1024 / 1024)}MB)`);
            continue;
          }
          
          const base64 = encodeBase64(arrayBuffer);
          const contentType = resp.headers.get('content-type') || 'image/png';
          const mediaType = contentType.includes('jpeg') || contentType.includes('jpg')
            ? 'image/jpeg'
            : contentType.includes('webp')
              ? 'image/webp'
              : 'image/png';
          
          imageContents.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          });
          
          console.log(`Image ${i + 1} converted (${Math.round(bytes / 1024)}KB)`);
        } catch (err) {
          console.log(`Error fetching image ${i + 1}:`, err);
        }
      }

      if (imageContents.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Impossible de charger les images. Vérifiez qu'elles sont accessibles.",
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Sending ${imageContents.length} images to Claude for analysis...`);

      // Single call with ALL images
      const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: SYSTEM_PROMPT_EXTRACTION,
          messages: [
            {
              role: 'user',
              content: [
                ...imageContents,
                { type: 'text', text: extractionPrompt },
              ],
            },
          ],
        }),
      });

      if (!claudeResp.ok) {
        const txt = await claudeResp.text();
        console.error('Claude API error:', claudeResp.status, txt);
        
        // Check for specific errors
        if (claudeResp.status === 413 || txt.includes('too large')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Les images sont trop volumineuses. Essayez avec moins de pages ou des images plus petites.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: false, error: `Erreur API: ${claudeResp.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const claudeData = await claudeResp.json();
      finalContent = claudeData.content?.[0]?.text || '';
      console.log('Claude analysis complete');
      
    } else {
      // Manual mode or no images: text-only call
      console.log('Analyzing with Claude (text mode)...');
      
      const textResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: SYSTEM_PROMPT_EXTRACTION,
          messages: [{ role: 'user', content: extractionPrompt }],
        }),
      });

      if (!textResp.ok) {
        const txt = await textResp.text();
        console.error('Claude text error:', textResp.status, txt);
        return new Response(
          JSON.stringify({ success: false, error: `Claude API failed: ${textResp.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const textData = await textResp.json();
      finalContent = textData.content?.[0]?.text || '';
      console.log('Claude text analysis complete');
    }

    if (!finalContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Réponse vide de l\'IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the final JSON
    let budgetData;
    try {
      let cleanContent = finalContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const jsonStart = cleanContent.indexOf('{');
      if (jsonStart > 0) {
        cleanContent = cleanContent.substring(jsonStart);
      }
      
      try {
        budgetData = JSON.parse(cleanContent);
      } catch (firstTry) {
        console.log('JSON appears truncated, attempting to repair...');
        
        let braceCount = 0;
        let bracketCount = 0;
        for (const char of cleanContent) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
        }
        
        let repairedContent = cleanContent;
        while (bracketCount > 0) {
          repairedContent += ']';
          bracketCount--;
        }
        while (braceCount > 0) {
          repairedContent += '}';
          braceCount--;
        }
        
        try {
          budgetData = JSON.parse(repairedContent);
          console.log('JSON repair successful');
        } catch (secondTry) {
          console.error('JSON repair failed, creating fallback response');
          budgetData = {
            extraction: {
              type_projet: "ANALYSE_INCOMPLETE",
              superficie_nouvelle_pi2: 0,
              nombre_etages: 1,
              categories: [],
              elements_manquants: ["L'analyse a été interrompue - veuillez réessayer"]
            },
            totaux: { total_ttc: 0 },
            recommandations: ["Veuillez relancer l'analyse - la réponse a été tronquée"],
            resume_projet: "Analyse incomplète"
          };
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', finalContent?.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Échec de l\'analyse - veuillez réessayer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to expected format for frontend compatibility
    const transformedData = transformToLegacyFormat(budgetData, finishQuality);

    console.log('Analysis complete - categories:', transformedData.categories?.length || 0);

    return new Response(
      JSON.stringify({ success: true, data: transformedData, rawAnalysis: budgetData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error analyzing plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze plan';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Transform the new detailed format to legacy format for frontend compatibility
function transformToLegacyFormat(data: any, finishQuality: string): any {
  if (data.categories && Array.isArray(data.categories) && data.categories[0]?.budget !== undefined) {
    return data;
  }

  const extraction = data.extraction || data;
  const totaux = data.totaux || {};
  const validation = data.validation || {};

  const categories = (extraction.categories || []).map((cat: any) => ({
    name: cat.nom || cat.name,
    budget: cat.sous_total_categorie || cat.budget || 0,
    description: `${cat.items?.length || 0} items - Main-d'œuvre: ${cat.heures_main_oeuvre || 0}h`,
    items: (cat.items || []).map((item: any) => ({
      name: `${item.description} (${item.source || 'N/A'})`,
      cost: item.total || item.cost || 0,
      quantity: String(item.quantite || item.quantity || ''),
      unit: item.unite || item.unit || ''
    }))
  }));

  // Add contingence and taxes as categories
  if (totaux.contingence_5_pourcent) {
    categories.push({
      name: "Contingence (5%)",
      budget: totaux.contingence_5_pourcent,
      description: "Provision pour imprévus",
      items: [{ name: "Contingence 5%", cost: totaux.contingence_5_pourcent, quantity: "1", unit: "forfait" }]
    });
  }

  if (totaux.tps_5_pourcent || totaux.tvq_9_975_pourcent) {
    const tps = totaux.tps_5_pourcent || 0;
    const tvq = totaux.tvq_9_975_pourcent || 0;
    categories.push({
      name: "Taxes",
      budget: tps + tvq,
      description: "TPS 5% + TVQ 9.975%",
      items: [
        { name: "TPS (5%)", cost: tps, quantity: "1", unit: "taxe" },
        { name: "TVQ (9.975%)", cost: tvq, quantity: "1", unit: "taxe" }
      ]
    });
  }

  const warnings = [
    ...(extraction.elements_manquants || []).map((e: string) => `⚠️ Élément manquant: ${e}`),
    ...(extraction.ambiguites || []).map((e: string) => `❓ Ambiguïté: ${e}`),
    ...(extraction.incoherences || []).map((e: string) => `⚡ Incohérence: ${e}`),
    ...(validation.alertes || [])
  ];

  const projectType = (extraction.type_projet || "").toUpperCase();
  const isAttachedOrExtension = projectType.includes("AGRANDISSEMENT") || 
                                 projectType.includes("GARAGE") || 
                                 projectType.includes("JUMELÉ") ||
                                 projectType.includes("JUMELE") ||
                                 projectType.includes("ANNEXE");

  warnings.push("🏗️ PRÉPARATION DU SITE: Vérifier les coûts d'excavation, nivellement, et accès chantier");
  warnings.push("🚧 PERMIS ET INSPECTIONS: Frais de permis de construction et inspections municipales à prévoir");
  warnings.push("📋 SERVICES PUBLICS: Confirmer les raccordements (eau, égout, électricité, gaz) et frais associés");

  if (isAttachedOrExtension) {
    warnings.push("🔗 JUMELAGE STRUCTUREL: Travaux de connexion à la structure existante (linteaux, ancrages, renfort fondation)");
    warnings.push("⚡ RACCORDEMENT ÉLECTRIQUE: Extension du panneau existant et mise aux normes possiblement requise");
    warnings.push("🔌 RACCORDEMENT PLOMBERIE: Connexion aux systèmes existants (eau, drainage, chauffage)");
    warnings.push("🏠 IMPERMÉABILISATION: Joint d'étanchéité entre nouvelle et ancienne construction critique");
    warnings.push("🎨 HARMONISATION: Travaux de finition pour raccorder les matériaux extérieurs existants");
    warnings.push("🔥 COUPE-FEU: Vérifier les exigences de séparation coupe-feu entre garage et habitation");
  }

  return {
    projectType: extraction.type_projet || "CONSTRUCTION_NEUVE",
    projectSummary: data.resume_projet || `Projet de ${extraction.superficie_nouvelle_pi2 || 0} pi² - ${extraction.nombre_etages || 1} étage(s)`,
    estimatedTotal: totaux.total_ttc || totaux.sous_total_avant_taxes || 0,
    newSquareFootage: extraction.superficie_nouvelle_pi2 || 0,
    plansAnalyzed: extraction.plans_analyses || 1,
    finishQuality: finishQuality,
    categories,
    recommendations: data.recommandations || [],
    warnings,
    validation: {
      surfacesCompletes: validation.surfaces_completes,
      ratioMainOeuvre: validation.ratio_main_oeuvre_materiaux,
      ratioAcceptable: validation.ratio_acceptable
    },
    totauxDetails: totaux
  };
}
