import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import WorkflowSelector, { WorkflowType } from '@/components/operator/WorkflowSelector';
import RegularWeighment from '@/components/operator/RegularWeighment';
import ShuttleWeighment from '@/components/operator/ShuttleWeighment';
import OpenBillManagement from '@/components/operator/OpenBillManagement';
import QuickWeighment from '@/components/operator/QuickWeighment';
import ManualEntry from '@/components/operator/ManualEntry';

export default function OperatorConsole() {
  const [workflow, setWorkflow] = useState<WorkflowType>('regular');
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

  const renderWorkflowContent = () => {
    switch (workflow) {
      case 'regular':
        return <RegularWeighment liveWeight={liveWeight} isStable={isStable} />;
      case 'shuttle':
        return <ShuttleWeighment liveWeight={liveWeight} isStable={isStable} />;
      case 'open-bill':
        return <OpenBillManagement />;
      case 'quick':
        return <QuickWeighment liveWeight={liveWeight} isStable={isStable} />;
      case 'manual':
        return <ManualEntry />;
      default:
        return <RegularWeighment liveWeight={liveWeight} isStable={isStable} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operator Console</h1>
          <p className="text-muted-foreground">Live weighing operations</p>
        </div>
        
        {(workflow === 'regular' || workflow === 'shuttle' || workflow === 'quick') && (
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
        )}
      </div>

      <WorkflowSelector value={workflow} onChange={setWorkflow} />

      <div className="mt-6">
        {renderWorkflowContent()}
      </div>
    </div>
  );
}
