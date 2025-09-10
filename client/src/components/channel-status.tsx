import { useQuery } from "@tanstack/react-query";
import { Lock, RotateCcw, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChannelStatusProps {
  onTemporaryUnblock: () => void;
}

const MOCK_USER_ID = "user-1"; // In a real app, this would come from authentication

export default function ChannelStatus({ onTemporaryUnblock }: ChannelStatusProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/videos", MOCK_USER_ID],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="mb-8" data-testid="card-channel-status">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const channel = data?.allowedChannel;
  const hasTemporaryAccess = data?.hasTemporaryAccess;

  return (
    <Card className="mb-8" data-testid="card-channel-status">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground" data-testid="text-section-title">
            Current Allowed Channel
          </h2>
          <Badge 
            className={`${hasTemporaryAccess ? 'bg-orange-500/20 text-orange-500' : 'bg-primary/20 text-primary'}`}
            data-testid="badge-security-status"
          >
            <Lock className="mr-1 h-3 w-3" />
            {hasTemporaryAccess ? 'Temporary Access' : 'Secured'}
          </Badge>
        </div>
        
        {channel ? (
          <div className="flex items-center space-x-4">
            <img 
              src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&h=128"
              alt={`${channel.name} channel avatar`}
              className="w-16 h-16 rounded-full object-cover"
              data-testid="img-channel-avatar"
            />
            <div>
              <h3 className="text-lg font-medium text-card-foreground" data-testid="text-channel-name">
                {channel.name}
              </h3>
              <p className="text-muted-foreground" data-testid="text-channel-subscribers">
                Educational content channel
              </p>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-channel-description">
                Secure access to approved educational content
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="text-no-channel">
              No channel configured. Please set up your allowed channel in settings.
            </p>
          </div>
        )}
        
        <div className="mt-4 flex space-x-3">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => refetch()}
            data-testid="button-refresh-channel"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={onTemporaryUnblock}
            data-testid="button-temporary-unblock"
          >
            <Unlock className="mr-2 h-4 w-4" />
            Temporary Unblock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
