import { cn } from "@/lib/utils";

interface BackgroundDecorationsProps {
  className?: string;
  variant?: "default" | "subtle" | "hero";
}

export function BackgroundDecorations({ className, variant = "default" }: BackgroundDecorationsProps) {
  if (variant === "subtle") {
    return (
      <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 gradient-page opacity-50" />
        
        {/* Single soft blob */}
        <div className="blob-primary w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-30" />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={cn("absolute inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
        {/* Hero gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-70" />
        
        {/* Animated blobs */}
        <div className="blob-primary w-[500px] h-[500px] top-0 left-1/4 animate-float opacity-60" />
        <div className="blob-purple w-[400px] h-[400px] top-1/3 right-0 animate-float opacity-50" style={{ animationDelay: "-2s" }} />
        <div className="blob-pink w-[300px] h-[300px] bottom-0 left-0 animate-float opacity-40" style={{ animationDelay: "-4s" }} />
      </div>
    );
  }

  // Default - full page decorations
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 gradient-page" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      {/* Decorative blobs */}
      <div className="blob-primary w-[800px] h-[800px] -top-[400px] -right-[400px] opacity-40" />
      <div className="blob-purple w-[600px] h-[600px] top-1/3 -left-[300px] opacity-30" />
      <div className="blob-pink w-[500px] h-[500px] bottom-0 right-1/4 opacity-20" />
      <div className="blob-cyan w-[400px] h-[400px] top-2/3 left-1/3 opacity-20" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />
    </div>
  );
}

// Section-level decorations for specific areas
export function SectionGlow({ 
  color = "primary", 
  position = "top-right",
  size = "md",
  className 
}: { 
  color?: "primary" | "purple" | "pink" | "cyan";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const colorClasses = {
    primary: "blob-primary",
    purple: "blob-purple", 
    pink: "blob-pink",
    cyan: "blob-cyan"
  };

  const positionClasses = {
    "top-left": "-top-20 -left-20",
    "top-right": "-top-20 -right-20",
    "bottom-left": "-bottom-20 -left-20",
    "bottom-right": "-bottom-20 -right-20",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-72 h-72"
  };

  return (
    <div className={cn(
      colorClasses[color],
      positionClasses[position],
      sizeClasses[size],
      className
    )} />
  );
}

// Card glow effect on hover
export function CardGlow({ className }: { className?: string }) {
  return (
    <div className={cn(
      "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
      "bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 blur-xl",
      className
    )} />
  );
}
