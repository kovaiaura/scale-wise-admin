import { useState, useEffect } from 'react';
import { weighbridgeService, WeighbridgeData } from '@/services/weighbridgeService';

export function useWeighbridge() {
  const [data, setData] = useState<WeighbridgeData>({
    weight: 0,
    isStable: false,
    unit: 'KG',
    timestamp: Date.now(),
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testMode, setTestMode] = useState(() => {
    const enabled = localStorage.getItem('weighbridgeEnabled');
    return enabled === 'false';
  });

  useEffect(() => {
    // Auto-connect on mount
    setIsConnecting(true);
    weighbridgeService.connect().then(() => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    // Subscribe to weight updates
    const unsubscribe = weighbridgeService.subscribe((newData) => {
      setData(newData);
    });

    // Listen for config changes
    const handleConfigChange = () => {
      const enabled = localStorage.getItem('weighbridgeEnabled');
      setTestMode(enabled === 'false');
    };
    
    window.addEventListener('weighbridgeConfigChanged', handleConfigChange);

    return () => {
      unsubscribe();
      window.removeEventListener('weighbridgeConfigChanged', handleConfigChange);
    };
  }, []);

  const disconnect = () => {
    weighbridgeService.disconnect();
    setIsConnected(false);
  };

  const reconnect = async () => {
    setIsConnecting(true);
    disconnect();
    await weighbridgeService.connect();
    setIsConnected(true);
    setIsConnecting(false);
  };

  return {
    liveWeight: data.weight,
    isStable: data.isStable,
    unit: data.unit,
    timestamp: data.timestamp,
    connectionStatus: isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected',
    isConnected,
    isConnecting,
    testMode,
    disconnect,
    reconnect,
  };
}
