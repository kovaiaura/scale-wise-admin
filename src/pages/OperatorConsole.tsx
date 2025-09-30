import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import UnifiedWeighmentForm from '@/components/operator/UnifiedWeighmentForm';

export default function OperatorConsole() {
  const [liveWeight, setLiveWeight] = useState(0);
  const [isStable, setIsStable] = useState(false);

  // Simulate live weight updates
  useEffect(() => {
    const interval = setInterval(() => {
      const baseWeight = 12000;
      const variation = isStable ? Math.random() * 10 : Math.random() * 500;
      setLiveWeight(Math.round(baseWeight + variation));
    }, 500);

    return () => clearInterval(interval);
  }, [isStable]);

  const toggleStability = () => {
    setIsStable(!isStable);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operator Console</h1>
          <p className="text-muted-foreground">Live weighing operations</p>
        </div>
        
        <Button onClick={toggleStability} variant="outline">
          {isStable ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Simulate Unstable
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Simulate Stable
            </>
          )}
        </Button>
      </div>

      <UnifiedWeighmentForm liveWeight={liveWeight} isStable={isStable} />
    </div>
  );
}
