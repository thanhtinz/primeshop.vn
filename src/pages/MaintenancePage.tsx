import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Construction, Clock } from "lucide-react";

const MaintenancePage = () => {
  const { data: settings } = useSiteSettings();

  const title = settings?.maintenance_title || "Đang bảo trì";
  const message = settings?.maintenance_message || "Chúng tôi đang nâng cấp hệ thống. Vui lòng quay lại sau.";
  const imageUrl = settings?.maintenance_image;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Maintenance" 
            className="w-64 h-64 mx-auto mb-6 object-contain"
          />
        ) : (
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Construction className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Đang cập nhật</span>
            </div>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {message}
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
