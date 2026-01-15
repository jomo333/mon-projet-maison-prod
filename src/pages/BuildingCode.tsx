import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Loader2, AlertCircle, FileText, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  article: string;
  title: string;
  content: string;
  summary: string;
  relatedArticles?: string[];
}

const BuildingCode = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Veuillez entrer une recherche");
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("search-building-code", {
        body: { query: query.trim() },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
      toast.error("Erreur de recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const exampleSearches = [
    "Hauteur minimale des garde-corps",
    "Isolation thermique des murs",
    "Escaliers résidentiels dimensions",
    "Ventilation salle de bain",
    "Sorties de secours maison",
    "Détecteurs de fumée requis",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Code du bâtiment</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recherchez dans le Code national du bâtiment du Canada 2015. 
              Notre IA analysera votre question et vous fournira l'article pertinent avec un résumé clair.
            </p>
          </div>

          {/* Disclaimer */}
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Avis important :</strong> Les informations fournies sont à titre indicatif seulement et n'ont aucune valeur légale. 
                Consultez toujours un professionnel qualifié et les autorités locales pour vos projets de construction.
              </p>
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche intelligente
              </CardTitle>
              <CardDescription>
                Décrivez ce que vous cherchez en langage naturel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Ex: Quelle est la hauteur minimale d'un garde-corps sur un balcon?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isSearching}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>

              {/* Example searches */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Exemples de recherches :</p>
                <div className="flex flex-wrap gap-2">
                  {exampleSearches.map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(example)}
                      disabled={isSearching}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Lightbulb className="h-5 w-5" />
                    Résumé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Article */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {result.article}
                      </CardTitle>
                      <CardDescription className="mt-1">{result.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                      className="whitespace-pre-wrap text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: result.content }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Related articles */}
              {result.relatedArticles && result.relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Articles connexes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.relatedArticles.map((article) => (
                        <Button
                          key={article}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery(article);
                            handleSearch();
                          }}
                        >
                          {article}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* No result placeholder */}
          {!result && !error && !isSearching && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Commencez votre recherche</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Entrez votre question ci-dessus pour trouver les articles pertinents du Code national du bâtiment du Canada.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuildingCode;
