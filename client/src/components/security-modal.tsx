import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Key, Phone, Mic, StopCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USER_ID = "user-1";

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [password, setPassword] = useState("");
  const [verificationWord, setVerificationWord] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [spokenWord, setSpokenWord] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const maxSteps = 3;
  const progress = (currentStep / maxSteps) * 100;

  const passwordMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest("POST", "/api/verify-password", { userId: MOCK_USER_ID, password });
    },
    onSuccess: () => {
      setCurrentStep(2);
      phoneMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Invalid password",
        description: "Please check your password and try again.",
        variant: "destructive",
      });
    },
  });

  const phoneMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/verify-phone", { userId: MOCK_USER_ID });
    },
    onSuccess: (response) => {
      const data = response.json();
      setVerificationWord(data.verificationWord);
      setPhoneNumber(data.phoneNumber);
      toast({
        title: "Call initiated",
        description: "Check your phone for the verification call.",
      });
    },
    onError: () => {
      toast({
        title: "Phone verification failed",
        description: "Unable to initiate phone call. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voiceMutation = useMutation({
    mutationFn: async (spokenWord: string) => {
      return apiRequest("POST", "/api/verify-voice", { userId: MOCK_USER_ID, spokenWord });
    },
    onSuccess: (response) => {
      const data = response.json();
      toast({
        title: "Access granted!",
        description: `Temporary access enabled for ${data.duration} minutes.`,
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Voice verification failed",
        description: "The spoken word didn't match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setPassword("");
    setVerificationWord("");
    setPhoneNumber("");
    setSpokenWord("");
    setIsRecording(false);
    onClose();
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your security password.",
        variant: "destructive",
      });
      return;
    }
    passwordMutation.mutate(password);
  };

  const handlePhoneConfirm = () => {
    setCurrentStep(3);
  };

  const handleVoiceSubmit = () => {
    if (!spokenWord.trim()) {
      toast({
        title: "Spoken word required",
        description: "Please enter the word you spoke.",
        variant: "destructive",
      });
      return;
    }
    voiceMutation.mutate(spokenWord);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop actual audio recording
    if (!isRecording) {
      toast({
        title: "Recording started",
        description: "Speak the verification word clearly.",
      });
    } else {
      toast({
        title: "Recording stopped",
        description: "Please enter what you said to verify.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-4" data-testid="modal-security">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-card-foreground mb-2" data-testid="text-modal-title">
            Security Verification
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Progress value={progress} className="flex-1" data-testid="progress-security" />
            <span className="text-sm text-muted-foreground" data-testid="text-step-counter">
              Step {currentStep} of {maxSteps}
            </span>
          </div>
        </DialogHeader>

        {/* Step 1: Password */}
        {currentStep === 1 && (
          <div className="space-y-4 security-step" data-testid="step-password">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="text-primary text-2xl" />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                Enter Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your security password"
                className="w-full"
                data-testid="input-password"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handlePasswordSubmit}
              disabled={passwordMutation.isPending}
              data-testid="button-verify-password"
            >
              {passwordMutation.isPending ? "Verifying..." : "Continue"}
            </Button>
          </div>
        )}

        {/* Step 2: Phone Verification */}
        {currentStep === 2 && (
          <div className="space-y-4 security-step" data-testid="step-phone">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-primary text-2xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2" data-testid="text-phone-title">
                Phone Verification
              </h3>
              <p className="text-muted-foreground text-sm mb-4" data-testid="text-phone-description">
                We're calling {phoneNumber || "+1 (555) ***-****"} with a verification word.
              </p>
              {verificationWord && (
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Verification Word:</p>
                  <p className="text-lg font-bold text-primary" data-testid="text-verification-word">
                    {verificationWord}
                  </p>
                </div>
              )}
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handlePhoneConfirm}
              data-testid="button-confirm-call"
            >
              I Received the Call
            </Button>
          </div>
        )}

        {/* Step 3: Voice Recording */}
        {currentStep === 3 && (
          <div className="space-y-4 security-step" data-testid="step-voice">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="text-primary text-2xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2" data-testid="text-voice-title">
                Voice Verification
              </h3>
              <p className="text-muted-foreground text-sm mb-4" data-testid="text-voice-description">
                Please say the word "{verificationWord || 'SUNSHINE'}" clearly into your microphone.
              </p>
              
              <div className="bg-muted rounded-lg p-6 mb-4">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    size="lg"
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      isRecording 
                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                    onClick={toggleRecording}
                    data-testid="button-record-voice"
                  >
                    {isRecording ? (
                      <StopCircle className="text-xl" />
                    ) : (
                      <Mic className="text-xl" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3" data-testid="text-record-instruction">
                  {isRecording ? "Recording... Tap to stop" : "Tap to start recording"}
                </p>
              </div>
              
              <div>
                <Label htmlFor="spokenWord" className="block text-sm font-medium text-card-foreground mb-2">
                  What did you say?
                </Label>
                <Input
                  id="spokenWord"
                  type="text"
                  value={spokenWord}
                  onChange={(e) => setSpokenWord(e.target.value)}
                  placeholder="Enter the word you spoke"
                  className="w-full"
                  data-testid="input-spoken-word"
                  onKeyDown={(e) => e.key === 'Enter' && handleVoiceSubmit()}
                />
              </div>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleVoiceSubmit}
              disabled={voiceMutation.isPending}
              data-testid="button-verify-voice"
            >
              {voiceMutation.isPending ? "Verifying..." : "Verify Recording"}
            </Button>
          </div>
        )}

        <Button 
          variant="ghost"
          className="w-full mt-4 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          data-testid="button-cancel-security"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
