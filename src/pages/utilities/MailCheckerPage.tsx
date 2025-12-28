import { Layout } from '@/components/layout/Layout';
import { MailChecker } from '@/components/utilities/MailChecker';

const MailCheckerPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <MailChecker />
      </div>
    </Layout>
  );
};

export default MailCheckerPage;
