import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  
  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('privacyPolicy')}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyIntroTitle')}</h2>
            <p>{t('privacyIntroContent')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacyCollect1')}</li>
              <li>{t('privacyCollect2')}</li>
              <li>{t('privacyCollect3')}</li>
              <li>{t('privacyCollect4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyUseTitle')}</h2>
            <p>{t('privacyUseContent')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacyUse1')}</li>
              <li>{t('privacyUse2')}</li>
              <li>{t('privacyUse3')}</li>
              <li>{t('privacyUse4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacySecurityTitle')}</h2>
            <p>{t('privacySecurityContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacySharingTitle')}</h2>
            <p>{t('privacySharingContent')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacySharing1')}</li>
              <li>{t('privacySharing2')}</li>
              <li>{t('privacySharing3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyCookiesTitle')}</h2>
            <p>{t('privacyCookiesContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyRightsTitle')}</h2>
            <p>{t('privacyRightsContent')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyContactTitle')}</h2>
            <p>{t('privacyContactContent')}</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
