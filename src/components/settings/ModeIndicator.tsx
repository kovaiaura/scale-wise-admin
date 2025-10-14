import { Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ModeIndicator() {
  return (
    <Badge variant="secondary" className="gap-2">
      <Monitor className="h-3 w-3" />
      Desktop Mode
    </Badge>
  );
}
