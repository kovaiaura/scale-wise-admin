import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockParties } from '@/utils/mockData';

export default function MastersParties() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParties = mockParties.filter(
    (party) =>
      party.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.contactNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-muted-foreground">Manage party/customer master data</p>
        </div>
        <Button>
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
                  <tr key={party.id} className="border-b hover:bg-muted/50 transition-colors">
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
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
    </div>
  );
}
