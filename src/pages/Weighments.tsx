import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockTickets } from '@/utils/mockData';

export default function Weighments() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTickets = mockTickets.filter(
    (ticket) =>
      ticket.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weighments</h1>
          <p className="text-muted-foreground">Manage all weighment tickets</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket, vehicle, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ticket No</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Party</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Gross</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Tare</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Net</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 text-sm font-medium">{ticket.ticketNo}</td>
                    <td className="p-3 text-sm">{ticket.date}</td>
                    <td className="p-3 text-sm font-mono">{ticket.vehicleNo}</td>
                    <td className="p-3 text-sm">{ticket.partyName}</td>
                    <td className="p-3 text-sm">{ticket.productName}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={ticket.containerType === 'Load' ? 'default' : 'secondary'}>
                        {ticket.containerType}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-right font-mono">{ticket.grossWeight}</td>
                    <td className="p-3 text-sm text-right font-mono">{ticket.tareWeight}</td>
                    <td className="p-3 text-sm text-right font-mono font-bold">{ticket.netWeight}</td>
                    <td className="p-3 text-right">
                      <Badge
                        variant={
                          ticket.status === 'completed'
                            ? 'default'
                            : ticket.status === 'in-progress'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {ticket.status}
                      </Badge>
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
