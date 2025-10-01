import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpenTicket } from '@/types/weighment';

interface OpenTicketsTableProps {
  tickets: OpenTicket[];
  onRefresh?: () => void;
}

export default function OpenTicketsTable({ tickets, onRefresh }: OpenTicketsTableProps) {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Open Tickets ({tickets.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No open tickets</p>
            <p className="text-sm mt-2">Create a new ticket with "Gross" weight type to see it here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>First Weight</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono font-semibold">{ticket.ticketNo}</TableCell>
                  <TableCell className="text-sm">{ticket.date}</TableCell>
                  <TableCell className="font-semibold">{ticket.vehicleNo}</TableCell>
                  <TableCell>{ticket.partyName}</TableCell>
                  <TableCell>{ticket.productName}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.firstWeightType === 'gross' ? 'default' : 'secondary'}>
                      {ticket.firstWeightType === 'gross' ? 'Gross' : 'Tare'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {ticket.firstWeightType === 'gross' 
                      ? ticket.grossWeight?.toLocaleString() 
                      : ticket.tareWeight?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
