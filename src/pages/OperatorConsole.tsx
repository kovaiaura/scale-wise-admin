import { useWeighbridge } from '@/hooks/useWeighbridge';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import UnifiedWeighmentForm from '@/components/operator/UnifiedWeighmentForm';

export default function OperatorConsole() {
  const { liveWeight, isStable, connectionStatus, isConnecting } = useWeighbridge();

  return (
    <div className="space-y-6">
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