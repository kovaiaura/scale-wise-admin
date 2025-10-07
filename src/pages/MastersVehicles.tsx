import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/contexts/AccessControlContext';
import { mockVehicles } from '@/utils/mockData';
import { useToast } from '@/hooks/use-toast';

export default function MastersVehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [formData, setFormData] = useState({
    vehicleNo: '',
    vehicleType: '',
    ownerName: '',
    contactNo: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkAccess, showBlockedDialog } = useAccessControl();

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!checkAccess(user?.role)) {
      showBlockedDialog();
      return;
    }

    if (!formData.vehicleNo || !formData.vehicleType || !formData.ownerName || !formData.contactNo) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newVehicle = {
      id: String(vehicles.length + 1),
      vehicleNo: formData.vehicleNo.toUpperCase(),
      vehicleType: formData.vehicleType,
      capacity: 0,
      ownerName: formData.ownerName,
      contactNo: formData.contactNo
    };

    setVehicles([...vehicles, newVehicle]);
    setIsDialogOpen(false);
    setFormData({
      vehicleNo: '',
      vehicleType: '',
      ownerName: '',
      contactNo: ''
    });
    
    toast({
      title: "Success",
      description: "Vehicle added successfully"
    });
  };

  const handleRowClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedVehicle((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!checkAccess(user?.role)) {
      showBlockedDialog();
      return;
    }

    if (!selectedVehicle.vehicleNo || !selectedVehicle.vehicleType || !selectedVehicle.ownerName || !selectedVehicle.contactNo) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setVehicles(vehicles.map(v => 
      v.id === selectedVehicle.id ? { ...selectedVehicle, vehicleNo: selectedVehicle.vehicleNo.toUpperCase() } : v
    ));
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Vehicle updated successfully"
    });
  };

  const handleDelete = (vehicleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!checkAccess(user?.role)) {
      showBlockedDialog();
      return;
    }

    setVehicles(vehicles.filter(v => v.id !== vehicleId));
    toast({
      title: "Success",
      description: "Vehicle deleted successfully"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicle master data</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={!checkAccess(user?.role)}>
          {!checkAccess(user?.role) && <Lock className="mr-2 h-4 w-4" />}
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicle No</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Capacity</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Owner</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr 
                    key={vehicle.id} 
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(vehicle)}
                  >
                    <td className="p-3 text-sm font-mono font-medium">{vehicle.vehicleNo}</td>
                    <td className="p-3 text-sm">{vehicle.vehicleType}</td>
                    <td className="p-3 text-sm">{vehicle.capacity} kg</td>
                    <td className="p-3 text-sm">{vehicle.ownerName}</td>
                    <td className="p-3 text-sm font-mono">{vehicle.contactNo}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(vehicle);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(vehicle.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleNo">Vehicle Number *</Label>
              <Input
                id="vehicleNo"
                name="vehicleNo"
                placeholder="e.g., GJ01AB1234"
                value={formData.vehicleNo}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Input
                id="vehicleType"
                name="vehicleType"
                placeholder="e.g., Truck, Trailer"
                value={formData.vehicleType}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input
                id="ownerName"
                name="ownerName"
                placeholder="e.g., John Doe"
                value={formData.ownerName}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactNo">Contact Number *</Label>
              <Input
                id="contactNo"
                name="contactNo"
                type="tel"
                placeholder="e.g., +91 9876543210"
                value={formData.contactNo}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicleNo">Vehicle Number *</Label>
                <Input
                  id="edit-vehicleNo"
                  name="vehicleNo"
                  placeholder="e.g., GJ01AB1234"
                  value={selectedVehicle.vehicleNo}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicleType">Vehicle Type *</Label>
                <Input
                  id="edit-vehicleType"
                  name="vehicleType"
                  placeholder="e.g., Truck, Trailer"
                  value={selectedVehicle.vehicleType}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ownerName">Owner Name *</Label>
                <Input
                  id="edit-ownerName"
                  name="ownerName"
                  placeholder="e.g., John Doe"
                  value={selectedVehicle.ownerName}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactNo">Contact Number *</Label>
                <Input
                  id="edit-contactNo"
                  name="contactNo"
                  type="tel"
                  placeholder="e.g., +91 9876543210"
                  value={selectedVehicle.contactNo}
                  onChange={handleEditChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
