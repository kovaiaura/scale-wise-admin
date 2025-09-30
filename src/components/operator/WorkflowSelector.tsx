import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Repeat, FolderOpen, Zap, Edit3 } from 'lucide-react';

export type WorkflowType = 'regular' | 'shuttle' | 'open-bill' | 'quick' | 'manual';

interface WorkflowSelectorProps {
  value: WorkflowType;
  onChange: (value: WorkflowType) => void;
}

export default function WorkflowSelector({ value, onChange }: WorkflowSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as WorkflowType)} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="regular" className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Regular</span>
        </TabsTrigger>
        <TabsTrigger value="shuttle" className="flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          <span className="hidden sm:inline">Shuttle</span>
        </TabsTrigger>
        <TabsTrigger value="open-bill" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Open Bills</span>
        </TabsTrigger>
        <TabsTrigger value="quick" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Quick</span>
        </TabsTrigger>
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline">Manual</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
