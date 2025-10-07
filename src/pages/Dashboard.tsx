import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, IndianRupee, Truck, FileText, Printer, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/contexts/AccessControlContext';
import { mockDashboardStats } from '@/utils/mockData';
import { PrintTemplateComponent } from '@/components/print/PrintTemplate';
import { printTemplateService } from '@/services/printTemplateService';
import { Bill } from '@/types/weighment';
import { getBills } from '@/services/billService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const chartData = [
  { day: 'Mon', weighments: 15 },
  { day: 'Tue', weighments: 22 },
  { day: 'Wed', weighments: 18 },
  { day: 'Thu', weighments: 25 },
  { day: 'Fri', weighments: 20 },
  { day: 'Sat', weighments: 12 },
  { day: 'Sun', weighments: 8 },
];

const monthlyAmountData = [
  { month: 'Jan', amount: 125000 },
  { month: 'Feb', amount: 142000 },
  { month: 'Mar', amount: 138000 },
  { month: 'Apr', amount: 165000 },
  { month: 'May', amount: 158000 },
  { month: 'Jun', amount: 172000 },
  { month: 'Jul', amount: 168000 },
  { month: 'Aug', amount: 185000 },
  { month: 'Sep', amount: 192000 },
  { month: 'Oct', amount: 178000 },
  { month: 'Nov', amount: 195000 },
  { month: 'Dec', amount: 210000 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [selectedTicket, setSelectedTicket] = useState<Bill | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkAccess, showBlockedDialog } = useAccessControl();
  const printRef = useRef<HTMLDivElement>(null);
  const template = printTemplateService.loadTemplate();
  const navigate = useNavigate();

  useEffect(() => {
    const bills = getBills();
    // Get the 5 most recent bills (newest first)
    const sortedBills = bills
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentBills(sortedBills);
  }, []);

  const handlePrint = async () => {
    if (!checkAccess(user?.role)) {
      showBlockedDialog();
      return;
    }

    if (!printRef.current || !selectedTicket) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A5 landscape width in mm
      const imgHeight = 148; // A5 landscape height in mm
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Convert PDF to blob and open in new window for printing
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the object URL after a delay
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        };
      }

      toast({
        title: "Bill Printed",
        description: `Bill for ${selectedTicket?.ticketNo} has been sent to printer`,
      });
    } catch (error) {
      console.error('Error printing:', error);
      toast({
        title: "Error",
        description: "Failed to print bill",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!checkAccess(user?.role)) {
      showBlockedDialog();
      return;
    }

    if (!printRef.current || !selectedTicket) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A5 landscape width in mm
      const imgHeight = 148; // A5 landscape height in mm
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Bill-${selectedTicket.ticketNo}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Bill for ${selectedTicket.ticketNo} has been downloaded`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      title: "Today's Weighments",
      value: mockDashboardStats.todayWeighments,
      icon: Scale,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: "Today's Amount",
      value: `₹${mockDashboardStats.totalAmount.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Monthly Amount',
      value: `₹${mockDashboardStats.monthlyAmount.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Pending Tickets',
      value: mockDashboardStats.pendingTickets,
      icon: FileText,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your weighbridge overview.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card 
              className={`card-shadow hover:shadow-elevated transition-shadow ${
                stat.title === 'Pending Tickets' ? 'cursor-pointer' : ''
              }`}
              onClick={() => stat.title === 'Pending Tickets' && navigate('/operator')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Weekly Weighments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="weighments" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Monthly Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAmountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ticket No</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Party</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Net Weight</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.length > 0 ? (
                  recentBills.map((bill) => (
                    <tr 
                      key={bill.id} 
                      onClick={() => setSelectedTicket(bill)}
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-sm font-medium">{bill.billNo}</td>
                      <td className="p-3 text-sm">{bill.vehicleNo}</td>
                      <td className="p-3 text-sm">{bill.partyName}</td>
                      <td className="p-3 text-sm">{bill.productName}</td>
                      <td className="p-3 text-sm text-right font-mono">{bill.netWeight || 0} kg</td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.status === 'CLOSED' || bill.status === 'PRINTED'
                              ? 'bg-success/10 text-success'
                              : bill.status === 'OPEN'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              View and manage bill {selectedTicket?.billNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bill No</p>
                  <p className="font-medium">{selectedTicket.billNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedTicket.vehicleNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">{selectedTicket.partyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedTicket.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross Weight</p>
                  <p className="font-medium font-mono">{selectedTicket.grossWeight || 0} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tare Weight</p>
                  <p className="font-medium font-mono">{selectedTicket.tareWeight || 0} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Weight</p>
                  <p className="font-medium font-mono">{selectedTicket.netWeight || 0} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTicket.status === 'CLOSED' || selectedTicket.status === 'PRINTED'
                        ? 'bg-success/10 text-success'
                        : selectedTicket.status === 'OPEN'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Print Preview using Template */}
              <div className="border rounded-lg overflow-auto print:border-0" style={{ maxHeight: '400px' }}>
                <div ref={printRef}>
                  <PrintTemplateComponent
                    bill={selectedTicket}
                    template={template}
                    editMode={false}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 print:hidden">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
