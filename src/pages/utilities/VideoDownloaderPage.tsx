import { Layout } from '@/components/layout/Layout';
import { VideoDownloader } from '@/components/utilities/VideoDownloader';

const VideoDownloaderPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        <VideoDownloader />
      </div>
    </Layout>
  );
};

export default VideoDownloaderPage;
