import { useState } from 'react';
import { Edit3, Check, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { mockVehicles, mockParties, mockProducts } from '@/utils/mockData';
import PasswordConfirmationModal from './PasswordConfirmationModal';

export default function ManualEntry() {
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [productName, setProductName] = useState('');
  const [manualWeight, setManualWeight] = useState('');
  const [reason, setReason] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { success } = useNotification();

  const handleSubmit = () => {
    if (!vehicleNo || !partyName || !productName || !manualWeight || !reason) return;
    setShowPasswordModal(true);
  };

  const handlePasswordConfirmed = () => {
    setShowPasswordModal(false);
    success(`Manual entry saved! Weight: ${manualWeight} kg. Bill generated (CLOSED).`);
    
    // Reset form
    setVehicleNo('');
    setPartyName('');
    setProductName('');
    setManualWeight('');
    setReason('');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-destructive" />
              Manual Weight Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">
                    Password Authentication Required
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Manual entries require supervisor password for security. Use only for corrections,
                    back-entries, or when scale is malfunctioning.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-weight">Weight (kg) *</Label>
                  <Input
                    id="manual-weight"
                    type="number"
                    placeholder="Enter weight manually"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(e.target.value)}
                    className="text-lg font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Number *</Label>
                  <Select value={vehicleNo} onValueChange={setVehicleNo}>
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.vehicleNo}>
                          {vehicle.vehicleNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party">Party Name *</Label>
                  <Select value={partyName} onValueChange={setPartyName}>
                    <SelectTrigger id="party">
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockParties.map((party) => (
                        <SelectItem key={party.id} value={party.partyName}>
                          {party.partyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProducts.map((product) => (
                        <SelectItem key={product.id} value={product.productName}>
                          {product.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Manual Entry *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why manual entry is needed (scale malfunction, back-entry, correction, etc.)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    This reason will be logged for audit purposes
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Entry Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="font-mono font-bold">
                        {manualWeight || '—'} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">{vehicleNo || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Party:</span>
                      <span className="font-medium">{partyName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium">{productName || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!vehicleNo || !partyName || !productName || !manualWeight || !reason}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Submit Manual Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PasswordConfirmationModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onConfirm={handlePasswordConfirmed}
      />
    </>
  );
}
