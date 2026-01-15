const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching building code for:", query);

    const systemPrompt = `Tu es un expert du Code national du bâtiment du Canada 2015 (CNBC 2015) et du Code de construction du Québec.
    
Ton rôle est d'aider les autoconstructeurs résidentiels à comprendre les exigences du code du bâtiment.

IMPORTANT: Tu dois fournir des réponses précises basées sur le Code national du bâtiment du Canada 2015.

Pour chaque question, tu dois:
1. Identifier l'article ou les articles pertinents du code
2. Fournir le contenu exact ou paraphrasé de l'article
3. Donner un résumé clair et accessible pour un non-professionnel
4. Mentionner les articles connexes s'il y en a

Format de réponse OBLIGATOIRE en JSON:
{
  "article": "Numéro de l'article (ex: 9.8.8.1)",
  "title": "Titre de l'article",
  "content": "Contenu détaillé de l'article avec les exigences spécifiques. Utilise des retours à la ligne pour la lisibilité.",
  "summary": "Résumé clair et simple en 2-3 phrases pour un autoconstructeur. Explique ce que cela signifie concrètement.",
  "relatedArticles": ["9.8.8.2", "9.8.8.3"]
}

Exemples de contenu pour référence:

Article 9.8.8.1 - Hauteur des garde-corps:
Les garde-corps doivent avoir une hauteur d'au moins 900 mm mesurée verticalement depuis la surface de plancher jusqu'au dessus du garde-corps. Exception: 1070 mm si la différence de niveau est supérieure à 1800 mm.

Article 9.8.2.1 - Mains courantes:
Des mains courantes doivent être installées de chaque côté d'un escalier de plus de 1100 mm de largeur. Hauteur: entre 865 mm et 965 mm.

Article 9.32.1.2 - Résistance thermique:
Les murs au-dessus du sol doivent avoir une résistance thermique minimale (RSI) selon la zone climatique.

Article 9.9.10.1 - Ventilation mécanique:
Les salles de bains doivent être ventilées par un système mécanique d'une capacité minimale de 25 L/s.

Article 9.10.13.1 - Détecteurs de fumée:
Des avertisseurs de fumée doivent être installés à chaque étage, dans chaque chambre et dans les corridors menant aux chambres.

RAPPEL: Inclus toujours un avertissement que ces informations sont à titre indicatif et qu'il faut consulter un professionnel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question sur le Code du bâtiment: ${query}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search building code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a structured response
        result = {
          article: "Recherche générale",
          title: "Résultat de recherche",
          content: content,
          summary: "Veuillez reformuler votre question pour obtenir un article spécifique du code.",
          relatedArticles: [],
        };
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      result = {
        article: "Recherche générale",
        title: "Résultat de recherche",
        content: content,
        summary: "L'IA a fourni une réponse, mais le format n'était pas structuré.",
        relatedArticles: [],
      };
    }

    console.log("Search successful for:", query);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
