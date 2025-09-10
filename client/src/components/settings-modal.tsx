import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USER_ID = "user-1";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [channelUrl, setChannelUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [accessDuration, setAccessDuration] = useState("30");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const settings = {
        userId: MOCK_USER_ID,
        allowedChannelUrl: channelUrl,
        allowedChannelName: channelName || "Unknown Channel",
        securityPassword,
        phoneNumber,
        voiceVerificationEnabled: voiceEnabled,
        temporaryAccessDuration: parseInt(accessDuration),
      };
      return apiRequest("POST", "/api/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", MOCK_USER_ID] });
      toast({
        title: "Settings saved",
        description: "Your security settings have been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const endAccessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/end-temporary-access", { userId: MOCK_USER_ID });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", MOCK_USER_ID] });
      toast({
        title: "Access revoked",
        description: "All temporary access sessions have been ended.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to end access",
        description: "Could not revoke temporary access. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Channel URL required",
        description: "Please enter a valid YouTube channel URL.",
        variant: "destructive",
      });
      return;
    }
    
    if (!securityPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please set a security password.",
        variant: "destructive",
      });
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number for verification.",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" data-testid="modal-settings">
        <DialogHeader className="flex flex-row items-center justify-between mb-2">
          <DialogTitle className="text-xl font-bold text-card-foreground tracking-wide" data-testid="text-settings-title">
            Settings
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            data-testid="button-close-settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channel Management */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3" data-testid="text-channel-section">
              Channel Management
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="channelUrl" className="block text-sm font-medium text-card-foreground mb-2">
                  Allowed Channel URL
                </Label>
                <Input
                  id="channelUrl"
                  type="url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://youtube.com/channel/..."
                  data-testid="input-channel-url"
                />
              </div>
              <div>
                <Label htmlFor="channelName" className="block text-sm font-medium text-card-foreground mb-2">
                  Channel Name
                </Label>
                <Input
                  id="channelName"
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name"
                  data-testid="input-channel-name"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3" data-testid="text-security-section">
              Security Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="securityPassword" className="block text-sm font-medium text-card-foreground mb-2">
                  Security Password
                </Label>
                <Input
                  id="securityPassword"
                  type="password"
                  value={securityPassword}
                  onChange={(e) => setSecurityPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-security-password"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-card-foreground mb-2">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone-number"
                />
              </div>
              <Card className="bg-muted">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium text-card-foreground" data-testid="text-voice-verification">
                      Voice Verification
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Require voice confirmation for unblocking
                    </p>
                  </div>
                  <Switch
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                    data-testid="switch-voice-verification"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Session Management */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3" data-testid="text-session-section">
              Session Management
            </h3>
            <div className="space-y-3">
              <Card className="bg-muted">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium text-card-foreground" data-testid="text-access-duration">
                      Temporary Access Duration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      How long temporary unblock lasts
                    </p>
                  </div>
                  <Select value={accessDuration} onValueChange={setAccessDuration}>
                    <SelectTrigger className="w-32" data-testid="select-access-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Button 
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => endAccessMutation.mutate()}
                disabled={endAccessMutation.isPending}
                data-testid="button-end-access"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {endAccessMutation.isPending ? "Ending..." : "End All Temporary Sessions"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            data-testid="button-save-settings"
          >
            <Plus className="mr-2 h-4 w-4" />
            {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            variant="secondary"
            className="flex-1 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
            onClick={onClose}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
