import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();

  const sectionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                {t("privacy.lastUpdated")}
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                {t("privacy.title")}{" "}
                <span className="text-primary">{t("privacy.titleHighlight")}</span>
              </h1>
              
              <p className="text-lg text-muted-foreground">
                {t("privacy.subtitle")}
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
                  const items = t(`privacy.sections.${num}.items`, { returnObjects: true, defaultValue: [] }) as string[];
                  const footer = t(`privacy.sections.${num}.footer`, { defaultValue: "" });

                  return (
                    <div key={num} className="relative">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                          {num}
                        </div>
                        
                        <div className="flex-1">
                          <h2 className="font-display text-2xl font-semibold mb-4">
                            {t(`privacy.sections.${num}.title`)}
                          </h2>
                          
                          <div className="text-muted-foreground space-y-4">
                            <p>{t(`privacy.sections.${num}.intro`)}</p>
                            
                            {Array.isArray(items) && items.length > 0 && (
                              <ul className="space-y-2 ml-4">
                                {items.map((item, index) => (
                                  <li key={index} className="flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            {footer && (
                              <p className="mt-4 text-sm">{footer}</p>
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
                  {t("privacy.contactTitle")}
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  {t("privacy.contactDescription")}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      📧
                    </div>
                    <div>
                      <p className="font-medium">{t("privacy.email")}</p>
                      <a 
                        href="mailto:confidentialite@monprojetmaison.ca" 
                        className="text-primary hover:underline"
                      >
                        confidentialite@monprojetmaison.ca
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      📍
                    </div>
                    <div>
                      <p className="font-medium">{t("privacy.address")}</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {t("privacy.companyAddress")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-background border text-sm text-muted-foreground">
                  <strong>Note :</strong> {t("privacy.legalNote")}
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-12 text-center text-sm text-muted-foreground">
                {t("privacy.copyright", { year: new Date().getFullYear() })}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
