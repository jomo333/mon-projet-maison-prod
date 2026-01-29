import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CookiePreferencesDialog } from "@/components/cookies/CookiePreferencesDialog";
import { CookiePreferences, getStoredPreferences } from "@/components/cookies/CookieConsent";
import { useTranslation } from "react-i18next";

const CookiePolicy = () => {
  const { t } = useTranslation();
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    return getStoredPreferences() || {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
  });

  const handleSavePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("mpm_cookie_consent", "true");
    localStorage.setItem("mpm_cookie_preferences", JSON.stringify(prefs));
    setPreferences(prefs);
    setShowPreferences(false);
  };

  const sectionNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
  const categoryKeys = ["essential", "analytics", "marketing", "functional"] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Cookie className="h-4 w-4" />
                {t("cookies.lastUpdated")}
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                {t("cookies.title")}{" "}
                <span className="text-primary">{t("cookies.titleHighlight")}</span>
              </h1>
              
              <p className="text-lg text-muted-foreground">
                {t("cookies.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-12">
                {sectionNumbers.map((num) => {
                  const content = t(`cookies.sections.${num}.content`, { defaultValue: "" });
                  const intro = t(`cookies.sections.${num}.intro`, { defaultValue: "" });
                  const items = t(`cookies.sections.${num}.items`, { returnObjects: true, defaultValue: [] }) as string[];
                  const browsers = t(`cookies.sections.${num}.browsers`, { returnObjects: true, defaultValue: [] }) as Array<{ name: string; url: string }>;

                  return (
                    <div key={num} className="relative">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                          {num}
                        </div>
                        
                        <div className="flex-1">
                          <h2 className="font-display text-2xl font-semibold mb-4">
                            {t(`cookies.sections.${num}.title`)}
                          </h2>
                          
                          <div className="text-muted-foreground space-y-4">
                            {content && <p>{content}</p>}
                            
                            {intro && <p>{intro}</p>}
                            
                            {/* Cookie categories section */}
                            {num === 2 && (
                              <div className="space-y-6 mt-4">
                                {categoryKeys.map((catKey) => {
                                  const examples = t(`cookies.sections.2.categories.${catKey}.examples`, { returnObjects: true, defaultValue: [] }) as string[];
                                  return (
                                    <div key={catKey} className="p-4 rounded-lg bg-muted/50 border">
                                      <h3 className="font-semibold text-foreground mb-2">
                                        {t(`cookies.sections.2.categories.${catKey}.name`)}
                                      </h3>
                                      <p className="text-sm mb-3">
                                        {t(`cookies.sections.2.categories.${catKey}.description`)}
                                      </p>
                                      <div className="text-sm">
                                        <span className="font-medium text-foreground">
                                          {t("common.details")} :
                                        </span>
                                        <ul className="mt-1 ml-4 space-y-1">
                                          {examples.map((ex, i) => (
                                            <li key={i} className="flex gap-2">
                                              <span className="text-primary">•</span>
                                              <span>{ex}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {Array.isArray(items) && items.length > 0 && num !== 2 && (
                              <ul className="space-y-2 ml-4">
                                {items.map((item, index) => (
                                  <li key={index} className="flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            {num === 4 && (
                              <div className="mt-4">
                                <Button onClick={() => setShowPreferences(true)}>
                                  {t("cookies.managePreferences")}
                                </Button>
                              </div>
                            )}
                            
                            {Array.isArray(browsers) && browsers.length > 0 && (
                              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                {browsers.map((browser, idx) => (
                                  <a
                                    key={idx}
                                    href={browser.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-primary">→</span>
                                    <span className="font-medium text-foreground">{browser.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact Section */}
              <div className="mt-16 p-8 rounded-2xl bg-muted/50 border">
                <h2 className="font-display text-2xl font-semibold mb-4">
                  {t("cookies.contactTitle")}
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  {t("cookies.contactDescription")}
                </p>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                    📧
                  </div>
                  <div>
                    <p className="font-medium">{t("cookies.email")}</p>
                    <a 
                      href="mailto:confidentialite@monprojetmaison.ca" 
                      className="text-primary hover:underline"
                    >
                      confidentialite@monprojetmaison.ca
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-12 text-center text-sm text-muted-foreground">
                {t("cookies.copyright", { year: new Date().getFullYear() })}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      <CookiePreferencesDialog
        open={showPreferences}
        onOpenChange={setShowPreferences}
        preferences={preferences}
        onSave={handleSavePreferences}
      />
    </div>
  );
};

export default CookiePolicy;
