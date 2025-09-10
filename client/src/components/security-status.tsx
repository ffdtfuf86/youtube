import { Key, Phone, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SecurityStatus() {
  return (
    <Card data-testid="card-security-status">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4" data-testid="text-security-title">
          Security Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4" data-testid="status-password">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Key className="text-primary h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground" data-testid="text-password-title">
                  Password Protection
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-password-status">
                  Enabled
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4" data-testid="status-phone">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Phone className="text-primary h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground" data-testid="text-phone-title">
                  Phone Verification
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-phone-status">
                  +1 (555) ***-****
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4" data-testid="status-voice">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Mic className="text-primary h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground" data-testid="text-voice-title">
                  Voice Authentication
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-voice-status">
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
