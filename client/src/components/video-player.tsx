import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string | null;
  onClose: () => void;
}

export default function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  if (!videoUrl) return null;

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  return (
    <Dialog open={!!videoUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95" data-testid="modal-video-player">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={onClose}
            data-testid="button-close-video"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-[60vh] rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="iframe-youtube-video"
            />
          ) : (
            <div className="w-full h-[60vh] bg-muted rounded-lg flex items-center justify-center" data-testid="div-video-error">
              <p className="text-muted-foreground">Unable to load video</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
