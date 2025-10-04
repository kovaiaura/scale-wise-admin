/**
 * Weighbridge Indicator Service
 * Provides mock live weight data for development
 * In production, this would connect to actual weighbridge hardware via Serial/Network
 */

export interface WeighbridgeConfig {
  connectionType: 'serial' | 'network';
  serialPort?: string;
  baudRate?: number;
  dataBits?: number;
  parity?: 'none' | 'even' | 'odd';
  stopBits?: number;
  networkIp?: string;
  networkPort?: number;
  protocol?: string;
  weightUnit?: string;
  decimalPlaces?: number;
  stabilityThreshold?: number;
}

export interface WeighbridgeData {
  weight: number;
  isStable: boolean;
  unit: string;
  timestamp: number;
}

type WeighbridgeCallback = (data: WeighbridgeData) => void;

class WeighbridgeService {
  private callbacks: Set<WeighbridgeCallback> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private currentWeight = 0;
  private config: WeighbridgeConfig | null = null;
  private baseWeight = 12000; // Base weight for simulation
  private isConnected = false;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.config = {
      connectionType: (localStorage.getItem('weighbridgeConnectionType') as 'serial' | 'network') || 'serial',
      serialPort: localStorage.getItem('weighbridgeSerialPort') || 'COM1',
      baudRate: parseInt(localStorage.getItem('weighbridgeBaudRate') || '9600'),
      dataBits: parseInt(localStorage.getItem('weighbridgeDataBits') || '8'),
      parity: (localStorage.getItem('weighbridgeParity') as 'none' | 'even' | 'odd') || 'none',
      stopBits: parseInt(localStorage.getItem('weighbridgeStopBits') || '1'),
      networkIp: localStorage.getItem('weighbridgeNetworkIp') || '192.168.1.50',
      networkPort: parseInt(localStorage.getItem('weighbridgeNetworkPort') || '4001'),
      protocol: localStorage.getItem('weighbridgeProtocol') || 'generic-ascii',
      weightUnit: localStorage.getItem('weighbridgeUnit') || 'KG',
      decimalPlaces: parseInt(localStorage.getItem('weighbridgeDecimalPlaces') || '0'),
      stabilityThreshold: parseInt(localStorage.getItem('weighbridgeStabilityThreshold') || '5'),
    };
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.loadConfig();
      
      // Simulate connection delay
      setTimeout(() => {
        this.isConnected = true;
        this.startReading();
        resolve(true);
      }, 500);
    });
  }

  disconnect() {
    this.isConnected = false;
    this.stopReading();
  }

  subscribe(callback: WeighbridgeCallback) {
    this.callbacks.add(callback);
    
    // If already connected, send current data immediately
    if (this.isConnected) {
      callback({
        weight: this.currentWeight,
        isStable: this.isWeightStable(),
        unit: this.config?.weightUnit || 'KG',
        timestamp: Date.now(),
      });
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private startReading() {
    if (this.intervalId) return;

    // Simulate weight reading every 500ms
    this.intervalId = setInterval(() => {
      this.simulateWeightReading();
      this.notifySubscribers();
    }, 500);
  }

  private stopReading() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private simulateWeightReading() {
    // Mock weight simulation with realistic variations
    const threshold = this.config?.stabilityThreshold || 5;
    const variation = Math.random() < 0.8 
      ? Math.random() * threshold  // Stable 80% of the time
      : Math.random() * (threshold * 10); // Unstable 20% of the time
    
    // Randomly change base weight to simulate vehicle movement
    if (Math.random() < 0.05) { // 5% chance to change base weight
      const weightChange = (Math.random() - 0.5) * 2000; // ±1000 kg
      this.baseWeight = Math.max(0, this.baseWeight + weightChange);
    }

    this.currentWeight = Math.round(this.baseWeight + variation);
  }

  private isWeightStable(): boolean {
    const threshold = this.config?.stabilityThreshold || 5;
    const deviation = Math.abs(this.currentWeight - this.baseWeight);
    return deviation <= threshold;
  }

  private notifySubscribers() {
    const data: WeighbridgeData = {
      weight: this.currentWeight,
      isStable: this.isWeightStable(),
      unit: this.config?.weightUnit || 'KG',
      timestamp: Date.now(),
    };

    this.callbacks.forEach(callback => callback(data));
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getCurrentWeight(): number {
    return this.currentWeight;
  }

  getConfig(): WeighbridgeConfig | null {
    return this.config;
  }
}

// Singleton instance
export const weighbridgeService = new WeighbridgeService();

// Listen for config changes
if (typeof window !== 'undefined') {
  window.addEventListener('weighbridgeConfigChanged', () => {
    if (weighbridgeService.getConnectionStatus()) {
      weighbridgeService.disconnect();
      setTimeout(() => {
        weighbridgeService.connect();
      }, 100);
    }
  });
}
