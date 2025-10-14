import { useState, useEffect } from 'react';
import { useWeighbridge } from '@/hooks/useWeighbridge';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Loader2, Lock } from 'lucide-react';
import UnifiedWeighmentForm from '@/components/operator/UnifiedWeighmentForm';

export default function OperatorConsole() {
  const { liveWeight, isStable, connectionStatus, isConnecting } = useWeighbridge();
  const { user } = useAuth();
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);

  useEffect(() => {
    // Check localStorage for access control in desktop mode
    const saved = localStorage.getItem('accessControl');
    if (saved) {
      const data = JSON.parse(saved);
      setIsAccessBlocked(data.isAccessBlocked || false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {isAccessBlocked && user?.role !== 'super_admin' && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Your access has been temporarily suspended</AlertTitle>
          <AlertDescription>
            Some features are currently restricted. Contact your administrator to restore access.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operator Console</h1>
          <p className="text-muted-foreground mt-1">Live weighbridge control panel</p>
        </div>
        
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="default" className="gap-2">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          )}
          {connectionStatus === 'connecting' && (
            <Badge variant="secondary" className="gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting...
            </Badge>
          )}
          {connectionStatus === 'disconnected' && (
            <Badge variant="destructive" className="gap-2">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      <UnifiedWeighmentForm liveWeight={liveWeight} isStable={isStable} />
    </div>
  );
}