import { Shield, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onShowSettings: () => void;
}

export default function AppHeader({ onShowSettings }: AppHeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Shield className="text-primary text-2xl" data-testid="icon-logo" />
            <h1 className="text-2xl font-bold text-foreground tracking-wide" data-testid="text-app-title">
              SecureYT
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              onClick={onShowSettings}
              data-testid="button-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center" data-testid="avatar-user">
              <User className="text-primary-foreground h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
