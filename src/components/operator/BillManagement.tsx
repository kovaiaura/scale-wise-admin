import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';
import { Bill, BillStatus } from '@/types/weighment';
import { getBills, searchBills } from '@/services/billService';
import { exportBillsToExcel, exportBillsToCSV, exportBillsToPDF } from '@/utils/exportUtils';
import BillPrintView from './BillPrintView';
import { useToast } from '@/hooks/use-toast';

export default function BillManagement() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'ALL'>('ALL');
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchQuery, statusFilter, bills]);

  const loadBills = () => {
    const allBills = getBills();
    setBills(allBills.reverse()); // Show newest first
  };

  const filterBills = () => {
    let filtered = bills;

    // Filter by search query
    if (searchQuery) {
      filtered = searchBills(searchQuery);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    setFilteredBills(filtered);
  };

  const handleExportExcel = () => {
    exportBillsToExcel(filteredBills);
    toast({
      title: "Exported to Excel",
      description: `${filteredBills.length} bills exported successfully`
    });
  };

  const handleExportCSV = () => {
    exportBillsToCSV(filteredBills);
    toast({
      title: "Exported to CSV",
      description: `${filteredBills.length} bills exported successfully`
    });
  };

  const handleExportPDF = () => {
    exportBillsToPDF(filteredBills);
    toast({
      title: "Exported to PDF",
      description: `${filteredBills.length} bills exported successfully`
    });
  };

  const getStatusBadge = (status: BillStatus) => {
    const variants = {
      OPEN: 'default',
      CLOSED: 'secondary',
      PRINTED: 'outline'
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Bill Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bill no, vehicle, party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BillStatus | 'ALL')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="PRINTED">Printed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bills Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Net Weight</TableHead>
                  <TableHead className="text-right">Charges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono font-semibold">{bill.billNo}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(bill.createdAt).toLocaleDateString('en-IN')}</div>
                          <div className="text-muted-foreground">
                            {new Date(bill.createdAt).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{bill.vehicleNo}</TableCell>
                      <TableCell>{bill.partyName}</TableCell>
                      <TableCell>{bill.productName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {bill.netWeight !== null ? `${bill.netWeight.toLocaleString()} KG` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{bill.charges.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBillToPrint(bill)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {filteredBills.length > 0 && (
            <div className="flex justify-end gap-8 p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Total Bills: </span>
                <span className="font-bold">{filteredBills.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Net Weight: </span>
                <span className="font-bold">
                  {filteredBills.reduce((sum, b) => sum + (b.netWeight || 0), 0).toLocaleString()} KG
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Charges: </span>
                <span className="font-bold">
                  ₹{filteredBills.reduce((sum, b) => sum + b.charges, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Modal */}
      {billToPrint && (
        <BillPrintView 
          bill={billToPrint} 
          onClose={() => setBillToPrint(null)}
        />
      )}
    </div>
  );
}
