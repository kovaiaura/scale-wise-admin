import { useState, useEffect } from 'react';
import UnifiedWeighmentForm from '@/components/operator/UnifiedWeighmentForm';

export default function OperatorConsole() {
  const [liveWeight, setLiveWeight] = useState(0);
  const [isStable, setIsStable] = useState(true);

  // Simulate live weight updates
  useEffect(() => {
    const interval = setInterval(() => {
      const baseWeight = 12000;
      const variation = isStable ? Math.random() * 10 : Math.random() * 500;
      setLiveWeight(Math.round(baseWeight + variation));
    }, 500);

    return () => clearInterval(interval);
  }, [isStable]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Operator Console</h1>
        <p className="text-muted-foreground">Live weighing operations</p>
      </div>

      <UnifiedWeighmentForm liveWeight={liveWeight} isStable={isStable} />
    </div>
  );
}
