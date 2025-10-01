import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { mockParties } from '@/utils/mockData';
import { useToast } from '@/hooks/use-toast';

export default function MastersParties() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [parties, setParties] = useState(mockParties);
  const [formData, setFormData] = useState({
    partyName: '',
    address: '',
    contactPerson: '',
    contactNo: '',
    email: ''
  });
  const { toast } = useToast();

  const filteredParties = parties.filter(
    (party) =>
      party.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.contactNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.partyName || !formData.address || !formData.contactPerson || !formData.contactNo || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newParty = {
      id: String(parties.length + 1),
      partyName: formData.partyName,
      address: formData.address,
      contactPerson: formData.contactPerson,
      contactNo: formData.contactNo,
      email: formData.email
    };

    setParties([...parties, newParty]);
    setIsDialogOpen(false);
    setFormData({
      partyName: '',
      address: '',
      contactPerson: '',
      contactNo: '',
      email: ''
    });
    
    toast({
      title: "Success",
      description: "Party added successfully"
    });
  };

  const handleRowClick = (party: any) => {
    setSelectedParty(party);
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedParty((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!selectedParty.partyName || !selectedParty.address || !selectedParty.contactPerson || !selectedParty.contactNo || !selectedParty.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setParties(parties.map(p => 
      p.id === selectedParty.id ? selectedParty : p
    ));
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Party updated successfully"
    });
  };

  const handleDelete = (partyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setParties(parties.filter(p => p.id !== partyId));
    toast({
      title: "Success",
      description: "Party deleted successfully"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-muted-foreground">Manage party/customer master data</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Party
        </Button>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parties..."
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
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Party ID</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((party) => (
                  <tr 
                    key={party.id} 
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(party)}
                  >
                    <td className="p-3 text-sm font-mono font-medium">PTY-{party.id.padStart(3, '0')}</td>
                    <td className="p-3 text-sm font-semibold">{party.partyName}</td>
                    <td className="p-3 text-sm">{party.address}</td>
                    <td className="p-3 text-sm">
                      <div className="space-y-1">
                        <div className="font-mono text-xs">{party.contactNo}</div>
                        <div className="text-xs text-muted-foreground">{party.email}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(party);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(party.id, e)}
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
            <DialogTitle>Add New Party</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="partyName">Party Name *</Label>
              <Input
                id="partyName"
                name="partyName"
                placeholder="e.g., ABC Corporation"
                value={formData.partyName}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                placeholder="e.g., 123 Main St, City"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                placeholder="e.g., John Doe"
                value={formData.contactPerson}
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="e.g., contact@company.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Party</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Party Details</DialogTitle>
          </DialogHeader>
          {selectedParty && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-partyName">Party Name *</Label>
                <Input
                  id="edit-partyName"
                  name="partyName"
                  placeholder="e.g., ABC Corporation"
                  value={selectedParty.partyName}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  name="address"
                  placeholder="e.g., 123 Main St, City"
                  value={selectedParty.address}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                <Input
                  id="edit-contactPerson"
                  name="contactPerson"
                  placeholder="e.g., John Doe"
                  value={selectedParty.contactPerson}
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
                  value={selectedParty.contactNo}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  placeholder="e.g., contact@company.com"
                  value={selectedParty.email}
                  onChange={handleEditChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Party</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
