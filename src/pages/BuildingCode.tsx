import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Loader2, AlertCircle, FileText, Lightbulb, MessageSquare, Send, User, Bot, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Base de données locale du Code du Bâtiment
const buildingCodeDB = {
  structure: [
    {
      id: 'S1',
      question: 'Quelle est la hauteur maximale pour un bâtiment résidentiel?',
      reponse: 'La hauteur maximale dépend du zonage, généralement 12-15 mètres pour R1-R2, jusqu\'à 25 mètres pour R3-R4.',
      code: 'Article 3.2.1',
      importance: 'haute' as const,
      tags: ['hauteur', 'résidentiel', 'zonage', 'bâtiment']
    },
    {
      id: 'S2',
      question: 'Quelle distance minimale entre deux bâtiments?',
      reponse: 'Minimum 3 mètres entre bâtiments, 6 mètres si présence de fenêtres face à face.',
      code: 'Article 3.4.2',
      importance: 'haute' as const,
      tags: ['distance', 'espacement', 'bâtiment', 'fenêtre']
    },
    {
      id: 'S3',
      question: 'Quelle est l\'épaisseur minimale des dalles de béton?',
      reponse: '100mm minimum pour dalles résidentielles, 150mm pour commerciales.',
      code: 'Article 3.6.8',
      importance: 'haute' as const,
      tags: ['béton', 'dalle', 'épaisseur', 'fondation']
    },
    {
      id: 'S4',
      question: 'Quelle est la charge admissible pour un plancher résidentiel?',
      reponse: 'La charge vive minimale pour un plancher résidentiel est de 1.9 kPa (40 lb/pi²). Pour les balcons, elle est de 2.4 kPa.',
      code: 'Article 4.1.5.3',
      importance: 'haute' as const,
      tags: ['plancher', 'charge', 'résidentiel', 'structure']
    }
  ],
  securite: [
    {
      id: 'SEC1',
      question: 'Combien de sorties de secours sont requises?',
      reponse: 'Minimum 2 sorties pour bâtiments >300m². Pour <300m², 1 sortie peut suffire selon l\'occupation. La distance maximale de parcours jusqu\'à une sortie est de 45m pour les bâtiments non protégés par gicleurs.',
      code: 'Article 3.4.2.1',
      importance: 'critique' as const,
      tags: ['sortie', 'évacuation', 'sécurité', 'secours']
    },
    {
      id: 'SEC2',
      question: 'Largeur minimale des escaliers de secours?',
      reponse: '1100mm minimum pour usage résidentiel, 1400mm pour usage commercial. La largeur doit permettre l\'évacuation selon le nombre d\'occupants.',
      code: 'Article 3.4.3.2',
      importance: 'critique' as const,
      tags: ['escalier', 'largeur', 'secours', 'évacuation']
    },
    {
      id: 'SEC3',
      question: 'Hauteur minimale des garde-corps?',
      reponse: '1070mm (42 pouces) minimum pour balcons, terrasses et toits. 900mm (36 pouces) pour escaliers intérieurs. Les ouvertures ne doivent pas permettre le passage d\'une sphère de 100mm de diamètre.',
      code: 'Article 9.8.8.1',
      importance: 'critique' as const,
      tags: ['garde-corps', 'balcon', 'hauteur', 'sécurité', 'rampe', 'balustre']
    },
    {
      id: 'SEC4',
      question: 'Quelles sont les exigences pour les détecteurs de fumée?',
      reponse: 'Un détecteur de fumée doit être installé à chaque étage, y compris le sous-sol. Ils doivent être interconnectés si plus d\'un est requis. Dans les corridors de plus de 10m, un détecteur est requis tous les 10m.',
      code: 'Article 9.10.19',
      importance: 'critique' as const,
      tags: ['détecteur', 'fumée', 'alarme', 'incendie', 'sécurité']
    },
    {
      id: 'SEC5',
      question: 'Résistance au feu des séparations coupe-feu?',
      reponse: 'Les séparations coupe-feu entre logements doivent avoir une résistance au feu d\'au moins 1 heure. Entre un garage et un logement, la résistance requise est de 45 minutes minimum.',
      code: 'Article 9.10.9',
      importance: 'critique' as const,
      tags: ['feu', 'séparation', 'coupe-feu', 'résistance', 'incendie']
    }
  ],
  escaliers: [
    {
      id: 'ESC1',
      question: 'Quelles sont les dimensions des marches d\'escalier?',
      reponse: 'Giron (profondeur): minimum 235mm, maximum 355mm. Hauteur (contremarche): minimum 125mm, maximum 200mm. La formule 2H + G doit donner entre 600mm et 660mm.',
      code: 'Article 9.8.4.1',
      importance: 'haute' as const,
      tags: ['escalier', 'marche', 'giron', 'contremarche', 'dimension']
    },
    {
      id: 'ESC2',
      question: 'Quelle est la hauteur libre minimale dans un escalier?',
      reponse: 'La hauteur libre minimale est de 1950mm (6\'5") mesurée verticalement du nez de marche au plafond.',
      code: 'Article 9.8.2.1',
      importance: 'haute' as const,
      tags: ['escalier', 'hauteur', 'libre', 'dégagement']
    },
    {
      id: 'ESC3',
      question: 'Quand faut-il une main courante?',
      reponse: 'Une main courante est requise de chaque côté si l\'escalier a plus de 1100mm de largeur. Une main courante est toujours requise si l\'escalier a plus de 2 marches. Hauteur: entre 865mm et 965mm.',
      code: 'Article 9.8.7',
      importance: 'haute' as const,
      tags: ['main courante', 'escalier', 'rampe', 'hauteur']
    }
  ],
  isolation: [
    {
      id: 'ISO1',
      question: 'Quel coefficient R pour les murs extérieurs?',
      reponse: 'R minimum de 4.0 (RSI 0.70) pour murs extérieurs en zone climatique standard. Pour les zones froides (>6000 degrés-jours), R-20 à R-24 est recommandé.',
      code: 'Article 9.36.2.6',
      importance: 'moyenne' as const,
      tags: ['isolation', 'mur', 'thermique', 'coefficient', 'RSI']
    },
    {
      id: 'ISO2',
      question: 'Isolation requise pour les toitures?',
      reponse: 'R minimum de 6.0 (RSI 1.06) pour toitures et combles aménagés. Pour les plafonds sous combles non aménagés, R-50 à R-60 est recommandé pour une performance optimale.',
      code: 'Article 9.36.2.4',
      importance: 'moyenne' as const,
      tags: ['isolation', 'toiture', 'comble', 'plafond', 'thermique']
    },
    {
      id: 'ISO3',
      question: 'Isolation des fondations?',
      reponse: 'Les murs de fondation doivent être isolés à un minimum de R-12 (RSI 2.1) dans les zones froides. L\'isolation doit descendre jusqu\'à 600mm sous le niveau du sol ou jusqu\'à la semelle.',
      code: 'Article 9.36.2.8',
      importance: 'moyenne' as const,
      tags: ['fondation', 'isolation', 'sous-sol', 'thermique']
    },
    {
      id: 'ISO4',
      question: 'Exigences pour le pare-vapeur?',
      reponse: 'Un pare-vapeur avec une perméance maximale de 60 ng/(Pa·s·m²) doit être installé du côté chaud de l\'isolant. Il doit être continu et scellé aux joints.',
      code: 'Article 9.25.4',
      importance: 'moyenne' as const,
      tags: ['pare-vapeur', 'humidité', 'isolation', 'membrane']
    }
  ],
  plomberie: [
    {
      id: 'PLB1',
      question: 'Pression d\'eau minimale requise?',
      reponse: '200 kPa (30 PSI) minimum aux points d\'utilisation, 550 kPa (80 PSI) maximum. Un réducteur de pression est requis si la pression dépasse 550 kPa.',
      code: 'Article 2.6.1.6',
      importance: 'moyenne' as const,
      tags: ['pression', 'eau', 'plomberie']
    },
    {
      id: 'PLB2',
      question: 'Diamètre minimum des tuyaux d\'évacuation?',
      reponse: '50mm (2 pouces) pour lavabos et douches, 75mm (3 pouces) pour baignoires, 100mm (4 pouces) pour toilettes et colonnes de chute.',
      code: 'Article 2.4.10',
      importance: 'moyenne' as const,
      tags: ['tuyau', 'évacuation', 'diamètre', 'plomberie', 'drain']
    },
    {
      id: 'PLB3',
      question: 'Pente minimale des drains?',
      reponse: 'La pente minimale est de 1% (1:100) pour les drains de 75mm et plus, et 2% (1:50) pour les drains de moins de 75mm.',
      code: 'Article 2.4.6',
      importance: 'moyenne' as const,
      tags: ['pente', 'drain', 'évacuation', 'plomberie']
    },
    {
      id: 'PLB4',
      question: 'Ventilation des appareils sanitaires?',
      reponse: 'Chaque appareil sanitaire doit être ventilé. Le diamètre du tuyau de ventilation doit être au moins la moitié du diamètre du drain, minimum 32mm.',
      code: 'Article 2.5.4',
      importance: 'moyenne' as const,
      tags: ['ventilation', 'sanitaire', 'évent', 'plomberie']
    }
  ],
  electricite: [
    {
      id: 'ELEC1',
      question: 'Nombre de prises requises par pièce?',
      reponse: 'Minimum 1 prise par 4 mètres de mur dans les pièces habitables. Chaque mur de plus de 900mm doit avoir une prise. Aucun point le long du mur ne doit être à plus de 1.8m d\'une prise.',
      code: 'Article 26-712',
      importance: 'moyenne' as const,
      tags: ['prise', 'électricité', 'réceptacle']
    },
    {
      id: 'ELEC2',
      question: 'Hauteur standard des prises électriques?',
      reponse: '300-450mm du sol pour prises standard. 1100mm pour comptoirs de cuisine. Les prises de cuisine doivent être à moins de 1.8m de tout point du comptoir.',
      code: 'Article 26-712(d)',
      importance: 'moyenne' as const,
      tags: ['prise', 'hauteur', 'électricité']
    },
    {
      id: 'ELEC3',
      question: 'Circuits requis pour une cuisine?',
      reponse: 'Minimum 2 circuits de 20A pour les prises de comptoir, plus des circuits dédiés pour: cuisinière, réfrigérateur, lave-vaisselle, broyeur.',
      code: 'Article 26-724',
      importance: 'moyenne' as const,
      tags: ['cuisine', 'circuit', 'électricité', 'ampérage']
    },
    {
      id: 'ELEC4',
      question: 'Prises DDFT (GFCI) requises où?',
      reponse: 'Les prises DDFT sont requises dans: salles de bain, cuisines (à moins de 1.5m de l\'évier), buanderies, garages, extérieur, et à moins de 1.5m d\'un lavabo.',
      code: 'Article 26-700(11)',
      importance: 'haute' as const,
      tags: ['DDFT', 'GFCI', 'sécurité', 'électricité', 'salle de bain']
    }
  ],
  ventilation: [
    {
      id: 'VENT1',
      question: 'Ventilation requise pour salle de bain?',
      reponse: 'Une fenêtre ouvrable d\'au moins 0.35m² OU un ventilateur d\'extraction d\'au moins 50 L/s (25 cfm pour salle d\'eau, 50 cfm pour salle de bain complète).',
      code: 'Article 9.32.3.3',
      importance: 'moyenne' as const,
      tags: ['ventilation', 'salle de bain', 'extraction', 'fenêtre']
    },
    {
      id: 'VENT2',
      question: 'Ventilation de la cuisine?',
      reponse: 'Une hotte de cuisinière avec extraction d\'au moins 50 cfm est requise. Pour les cuisinières à gaz, minimum 100 cfm recommandé.',
      code: 'Article 9.32.3.5',
      importance: 'moyenne' as const,
      tags: ['ventilation', 'cuisine', 'hotte', 'extraction']
    },
    {
      id: 'VENT3',
      question: 'Échangeur d\'air requis?',
      reponse: 'Un système de ventilation mécanique principal (VRC ou VRE) est requis pour les maisons neuves. Le débit minimum est basé sur le nombre de chambres: 30 L/s pour 0-1 chambre, +7.5 L/s par chambre additionnelle.',
      code: 'Article 9.32.3.1',
      importance: 'moyenne' as const,
      tags: ['VRC', 'échangeur', 'ventilation', 'air']
    }
  ],
  fenestration: [
    {
      id: 'FEN1',
      question: 'Surface vitrée minimale par pièce?',
      reponse: 'La surface vitrée doit être au moins 5% de la surface de plancher de la pièce qu\'elle dessert. Pour les chambres, une fenêtre ouvrable est requise pour l\'évacuation d\'urgence.',
      code: 'Article 9.7.2.2',
      importance: 'moyenne' as const,
      tags: ['fenêtre', 'vitrage', 'éclairage', 'naturel']
    },
    {
      id: 'FEN2',
      question: 'Dimensions minimales des fenêtres d\'évacuation?',
      reponse: 'Ouverture minimale de 0.35m² avec aucune dimension inférieure à 380mm. Le seuil ne doit pas être à plus de 1000mm du plancher.',
      code: 'Article 9.9.10.1',
      importance: 'haute' as const,
      tags: ['fenêtre', 'évacuation', 'urgence', 'chambre']
    },
    {
      id: 'FEN3',
      question: 'Performance thermique des fenêtres?',
      reponse: 'Les fenêtres doivent avoir un coefficient U maximal de 2.0 W/(m²·K) pour les zones climatiques froides. Les fenêtres ENERGY STAR sont recommandées.',
      code: 'Article 9.36.2.3',
      importance: 'moyenne' as const,
      tags: ['fenêtre', 'thermique', 'coefficient', 'énergie']
    }
  ]
};

type ImportanceLevel = 'critique' | 'haute' | 'moyenne';

interface BuildingCodeEntry {
  id: string;
  question: string;
  reponse: string;
  code: string;
  importance: ImportanceLevel;
  tags: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: BuildingCodeEntry[];
}

const BuildingCode = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const categories = [
    { id: 'all', name: 'Tout' },
    { id: 'structure', name: 'Structure' },
    { id: 'securite', name: 'Sécurité' },
    { id: 'escaliers', name: 'Escaliers' },
    { id: 'isolation', name: 'Isolation' },
    { id: 'plomberie', name: 'Plomberie' },
    { id: 'electricite', name: 'Électricité' },
    { id: 'ventilation', name: 'Ventilation' },
    { id: 'fenestration', name: 'Fenêtres' }
  ];

  const searchBuildingCode = (query: string): BuildingCodeEntry[] => {
    const allEntries: BuildingCodeEntry[] = category === 'all' 
      ? Object.values(buildingCodeDB).flat()
      : (buildingCodeDB[category as keyof typeof buildingCodeDB] as BuildingCodeEntry[]) || [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = allEntries.map(entry => {
      let score = 0;
      const searchText = `${entry.question} ${entry.reponse} ${entry.code} ${entry.tags.join(' ')}`.toLowerCase();
      
      searchTerms.forEach(term => {
        if (searchText.includes(term)) {
          score += 1;
          // Bonus for exact matches in question or tags
          if (entry.question.toLowerCase().includes(term)) score += 2;
          if (entry.tags.some(tag => tag.includes(term))) score += 2;
        }
      });

      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.entry);
  };

  const handleSend = async () => {
    if (!input.trim() || isSearching) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input.trim();
    setInput("");
    setIsSearching(true);

    // Simulate brief search delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const results = searchBuildingCode(query);
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: results.length > 0 
        ? `J'ai trouvé ${results.length} article${results.length > 1 ? 's' : ''} pertinent${results.length > 1 ? 's' : ''} dans le Code du bâtiment :`
        : "Je n'ai pas trouvé de résultat correspondant à votre recherche. Essayez avec d'autres termes comme: garde-corps, escalier, isolation, ventilation, électricité...",
      results: results.length > 0 ? results : undefined,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSearch = () => {
    setMessages([]);
    setInput("");
  };

  const getImportanceColor = (importance: ImportanceLevel) => {
    switch(importance) {
      case 'critique': return 'text-red-600 bg-red-50 border-red-200';
      case 'haute': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const exampleSearches = [
    "Hauteur garde-corps",
    "Dimensions escalier",
    "Isolation murs",
    "Ventilation salle de bain",
    "Prises électriques",
    "Sorties de secours"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Code du bâtiment</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recherchez des informations sur le Code national du bâtiment du Canada. 
              Base de données locale - aucune API externe requise.
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

          {/* Category Filter */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recherche
                </CardTitle>
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleNewSearch}>
                    Nouvelle recherche
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Posez votre question</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Recherchez des informations sur les normes de construction.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {exampleSearches.map((example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          {message.role === "assistant" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === "user" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        {/* Show results if present */}
                        {message.results && message.results.length > 0 && (
                          <div className="ml-11 space-y-3">
                            {message.results.map((result) => (
                              <Card key={result.id} className="border-l-4 border-l-primary">
                                <CardHeader className="py-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                      {result.question}
                                    </CardTitle>
                                    <span className={`px-2 py-1 rounded-full border text-xs font-medium ${getImportanceColor(result.importance)}`}>
                                      {result.importance}
                                    </span>
                                  </div>
                                </CardHeader>
                                <CardContent className="py-0 pb-4">
                                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                    {result.reponse}
                                  </p>
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">
                                      {result.code}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isSearching && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Input */}
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Input
                  placeholder="Recherchez: garde-corps, escalier, isolation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isSearching}
                />
                <Button onClick={handleSend} disabled={isSearching || !input.trim()}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuildingCode;
