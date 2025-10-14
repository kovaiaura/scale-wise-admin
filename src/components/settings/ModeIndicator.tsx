import { Monitor, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ModeIndicator() {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  const isDevelopment = !isTauri;

  if (isDevelopment) {
    return (
      <Badge variant="outline" className="gap-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
        <Wrench className="h-3 w-3" />
        Development Mode
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-2">
      <Monitor className="h-3 w-3" />
      Desktop Mode
    </Badge>
  );
}
