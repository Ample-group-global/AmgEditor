import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Main Content - No Sidebar */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Page Content */}
        <ScrollArea className="flex-1">
          <div className="w-full min-h-[calc(100vh-3rem)]">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
