import { Layout } from '@/components/layout/Layout';
import { DomainChecker } from '@/components/utilities/DomainChecker';

const DomainCheckerPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <DomainChecker />
      </div>
    </Layout>
  );
};

export default DomainCheckerPage;
