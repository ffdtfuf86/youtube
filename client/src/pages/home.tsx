import { useState } from "react";
import AppHeader from "@/components/app-header";
import ChannelStatus from "@/components/channel-status";
import VideoGrid from "@/components/video-grid";
import SecurityStatus from "@/components/security-status";
import SecurityModal from "@/components/security-modal";
import SettingsModal from "@/components/settings-modal";
import VideoPlayer from "@/components/video-player";

export default function Home() {
  // Enhanced: State management for modals and video playback
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader onShowSettings={() => setShowSettingsModal(true)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChannelStatus onTemporaryUnblock={() => setShowSecurityModal(true)} />
        <VideoGrid onPlayVideo={setSelectedVideo} />
        <SecurityStatus />
      </div>

      <SecurityModal 
        isOpen={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
      />
      
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      <VideoPlayer 
        videoUrl={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />
    </div>
  );
}
