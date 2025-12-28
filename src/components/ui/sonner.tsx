import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <style>{`
        [data-sonner-toast] [data-close-button] {
          left: auto !important;
          right: 8px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }
      `}</style>
      <Sonner
        theme="dark"
        position="top-center"
        richColors
        closeButton
        duration={3000}
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:pr-10",
            description: "group-[.toast]:text-muted-foreground",
            actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            closeButton: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster, toast };
