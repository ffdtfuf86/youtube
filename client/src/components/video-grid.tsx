import { useQuery } from "@tanstack/react-query";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoGridProps {
  onPlayVideo: (videoUrl: string) => void;
}

const MOCK_USER_ID = "user-1";

export default function VideoGrid({ onPlayVideo }: VideoGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/videos", MOCK_USER_ID],
    enabled: true,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/refresh-videos", { userId: MOCK_USER_ID });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", MOCK_USER_ID] });
      toast({
        title: "Videos refreshed",
        description: "Latest videos have been loaded from YouTube",
      });
    },
    onError: () => {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh videos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const videos = data?.videos || [];

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground" data-testid="text-videos-title">
          Latest Videos
        </h2>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-refresh-videos"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {videos.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground" data-testid="text-no-videos">
            <Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No videos available</p>
            <p className="text-sm mt-2">
              Configure your allowed channel in settings or refresh to load videos.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card 
              key={video.id}
              className="overflow-hidden hover:border-primary/50 transition-colors"
              data-testid={`card-video-${video.id}`}
            >
              <img 
                src={video.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225"}
                alt={`${video.title} thumbnail`}
                className="w-full h-48 object-cover"
                data-testid={`img-thumbnail-${video.id}`}
              />
              <CardContent className="p-4">
                <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2" data-testid={`text-title-${video.id}`}>
                  {video.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid={`text-description-${video.id}`}>
                  {video.description || "No description available"}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span data-testid={`text-views-${video.id}`}>
                    {video.viewCount || "0"} views
                  </span>
                  <span data-testid={`text-date-${video.id}`}>
                    {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Unknown date"}
                  </span>
                </div>
                <Button 
                  className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onPlayVideo(video.videoUrl)}
                  data-testid={`button-play-${video.id}`}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
