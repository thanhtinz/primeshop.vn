import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const NotFound = () => {
  const { data: settings, isLoading } = useSiteSettings();

  const title = settings?.error_404_title || "404";
  const heading = settings?.error_404_heading || "Trang không tồn tại";
  const message = settings?.error_404_message || "Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.";
  const buttonText = settings?.error_404_button || "Về trang chủ";
  const imageUrl = settings?.error_404_image;

  return (
    <Layout>
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20">
        <div className="text-center max-w-md animate-fade-in">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="404" 
              className="w-64 h-64 mx-auto mb-6 object-contain"
            />
          ) : (
            <div className="relative mb-6">
              <h1 className="text-[120px] sm:text-[160px] font-extrabold text-primary/10 leading-none select-none">
                {title}
              </h1>
              <AlertTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-primary animate-pulse" />
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {heading}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {message}
          </p>
          <Link to="/" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              <Home className="h-5 w-5" />
              {buttonText}
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
