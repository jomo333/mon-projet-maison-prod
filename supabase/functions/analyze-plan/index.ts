import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, projectType, squareFootage } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing plan:', { projectType, squareFootage, hasImage: !!imageUrl });

    const systemPrompt = `Tu es un expert en estimation de coûts de construction résidentielle au Québec. 
Tu dois analyser les informations fournies sur un projet de construction et générer une estimation budgétaire détaillée.

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec cette structure:
{
  "projectSummary": "Description courte du projet",
  "estimatedTotal": number,
  "categories": [
    {
      "name": "Nom de la catégorie",
      "budget": number,
      "description": "Description des travaux",
      "items": [
        { "name": "Item", "cost": number, "quantity": "quantité", "unit": "unité" }
      ]
    }
  ],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "warnings": ["Avertissement si applicable"]
}

Catégories typiques: Fondations, Structure/Charpente, Toiture, Fenêtres et Portes, Électricité, Plomberie, Chauffage/Ventilation, Isolation, Revêtements extérieurs, Finitions intérieures.

Base tes estimations sur les prix du marché québécois 2024-2025.`;

    const userMessage = `Analyse ce projet de construction et génère un budget détaillé:
- Type de projet: ${projectType || 'Maison unifamiliale'}
- Superficie approximative: ${squareFootage || 1500} pieds carrés
${imageUrl ? '- Un plan a été fourni (analyse l\'image pour plus de détails)' : '- Aucun plan fourni, utilise des estimations standards'}

Génère une estimation budgétaire complète et réaliste pour le Québec.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to analyze plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let budgetData;
    try {
      // Clean up the response in case it has markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      budgetData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse budget data', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis complete:', budgetData.projectSummary);

    return new Response(
      JSON.stringify({ success: true, data: budgetData }),
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