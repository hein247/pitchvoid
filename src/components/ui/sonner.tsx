import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(270_12%_4%)] group-[.toaster]:text-foreground group-[.toaster]:border-[hsl(var(--primary)/0.3)] group-[.toaster]:shadow-[0_0_20px_hsl(var(--primary)/0.15)]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-[hsl(var(--primary)/0.5)] group-[.toaster]:text-primary",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:text-destructive",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
