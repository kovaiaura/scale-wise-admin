import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OperatorConsole from "./pages/OperatorConsole";
import Weighments from "./pages/Weighments";
import Reports from "./pages/Reports";
import MastersVehicles from "./pages/MastersVehicles";
import MastersParties from "./pages/MastersParties";
import MastersProducts from "./pages/MastersProducts";
import SettingsWeighbridge from "./pages/SettingsWeighbridge";
import SettingsSerialNumber from "./pages/SettingsSerialNumber";
import SettingsProfile from "./pages/SettingsProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="operator" element={<OperatorConsole />} />
                <Route path="weighments" element={<Weighments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="masters/vehicles" element={<MastersVehicles />} />
                <Route path="masters/parties" element={<MastersParties />} />
                <Route path="masters/products" element={<MastersProducts />} />
                <Route path="settings/weighbridge" element={<SettingsWeighbridge />} />
                <Route path="settings/serial-number" element={<SettingsSerialNumber />} />
                <Route path="settings/users" element={<div>User Management (Coming Soon)</div>} />
                <Route path="settings/profile" element={<SettingsProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
