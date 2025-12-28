import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
  const { t } = useLanguage();
  
  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('termsOfService')}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsIntroTitle')}</h2>
            <p>{t('termsIntroContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsConditionsTitle')}</h2>
            <p>{t('termsConditionsContent')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('termsCondition1')}</li>
              <li>{t('termsCondition2')}</li>
              <li>{t('termsCondition3')}</li>
              <li>{t('termsCondition4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsAccountTitle')}</h2>
            <p>{t('termsAccountContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsProductsTitle')}</h2>
            <p>{t('termsProductsContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsPaymentTitle')}</h2>
            <p>{t('termsPaymentContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsLiabilityTitle')}</h2>
            <p>{t('termsLiabilityContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsChangesTitle')}</h2>
            <p>{t('termsChangesContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsContactTitle')}</h2>
            <p>{t('termsContactContent')}</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
