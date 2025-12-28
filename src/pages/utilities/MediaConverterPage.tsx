import React from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import MediaConverter from "@/components/utilities/MediaConverter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Image, 
  Music, 
  Video, 
  Zap, 
  Shield, 
  Download,
  FileVideo
} from "lucide-react";

const MediaConverterPage: React.FC = () => {
  const features = [
    {
      icon: Image,
      title: "Ảnh",
      description: "JPG, PNG, WebP, ICO, GIF, BMP"
    },
    {
      icon: Music,
      title: "Âm thanh",
      description: "MP3, WAV, AAC, OGG, M4A"
    },
    {
      icon: Video,
      title: "Video",
      description: "MP4, WebM, MOV, MKV, AVI"
    },
    {
      icon: Zap,
      title: "Xử lý nhanh",
      description: "Chạy trực tiếp trên trình duyệt"
    },
    {
      icon: Shield,
      title: "Bảo mật",
      description: "File không upload lên server"
    },
    {
      icon: Download,
      title: "Batch & ZIP",
      description: "Xử lý nhiều file, tải về ZIP"
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Chuyển Đổi Media | Image, Audio, Video Converter</title>
        <meta name="description" content="Công cụ chuyển đổi ảnh, âm thanh, video online. Hỗ trợ JPG, PNG, WebP, MP3, WAV, MP4, WebM. Xử lý trực tiếp trên trình duyệt." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <FileVideo className="h-6 w-6 text-primary" />
            Bộ Chuyển Đổi Media
          </h1>
          <p className="text-muted-foreground">
            Chuyển đổi ảnh, âm thanh, video online - Không cần cài phần mềm
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-dashed">
                <CardContent className="p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="font-medium text-sm">{feature.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{feature.description}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Converter */}
        <MediaConverter />
      </div>
    </Layout>
  );
};

export default MediaConverterPage;
