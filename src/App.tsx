import { useState, useEffect } from "react";
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
import PrintSettings from "./pages/PrintSettings";
import NotFound from "./pages/NotFound";
import FirstTimeSetup from "./pages/FirstTimeSetup";
import { LoadingScreen } from "./components/setup/LoadingScreen";
import { initDatabase, checkSetupStatus } from "./services/database/connection";

const queryClient = new QueryClient();

const AppContent = () => {
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        await initDatabase();
        const completed = await checkSetupStatus();
        setSetupCompleted(completed);
      } catch (error) {
        console.error('Setup check failed:', error);
        setSetupCompleted(false);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  if (isCheckingSetup) return <LoadingScreen />;
  if (setupCompleted === false) return <FirstTimeSetup onSetupComplete={() => setSetupCompleted(true)} />;

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<FirstTimeSetup />} />
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
          <Route path="settings/print-template" element={<PrintSettings />} />
          <Route path="settings/profile" element={<SettingsProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
