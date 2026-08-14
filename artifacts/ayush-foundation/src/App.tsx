import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AboutPage from '@/pages/about';
import ContactPage from '@/pages/contact';
import HomePage from '@/pages/home';
import MedicinesPage from '@/pages/medicines';
import ServicesPage from '@/pages/services';
import {
  AdminDashboard,
  AdminLayout,
  AdminLoginPage,
  AdminResourcePage,
  AdminSettingsPage,
  InventoryPage,
  ProtectedAdminRoute,
} from '@/pages/admin';
import { AuthProvider } from '@/lib/auth';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/medicines" element={<MedicinesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<NavigateToDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="medicines" element={<AdminResourcePage resourceKey="medicines" />} />
            <Route path="vet-medicines" element={<AdminResourcePage resourceKey="vet-medicines" />} />
            <Route path="general-products" element={<AdminResourcePage resourceKey="general-products" />} />
            <Route path="categories" element={<AdminResourcePage resourceKey="categories" />} />
            <Route path="brands" element={<AdminResourcePage resourceKey="brands" />} />
            <Route path="homepage" element={<AdminResourcePage resourceKey="homepage" />} />
            <Route path="new-arrivals" element={<AdminResourcePage resourceKey="new-arrivals" />} />
            <Route path="special-medicines" element={<AdminResourcePage resourceKey="special-medicines" />} />
            <Route path="orders" element={<AdminResourcePage resourceKey="orders" />} />
            <Route path="medicine-requests" element={<AdminResourcePage resourceKey="medicine-requests" />} />
            <Route path="inquiries" element={<AdminResourcePage resourceKey="inquiries" />} />
            <Route path="legal" element={<AdminResourcePage resourceKey="legal" />} />
            <Route path="announcements" element={<AdminResourcePage resourceKey="announcements" />} />
            <Route path="faq" element={<AdminResourcePage resourceKey="faq" />} />
            <Route path="testimonials" element={<AdminResourcePage resourceKey="testimonials" />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function App() {
  const basename =
    import.meta.env.BASE_URL === '/'
      ? undefined
      : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter basename={basename}>
            <Router />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

function NavigateToDashboard() {
  return <Navigate to="/admin/dashboard" replace />;
}

export default App;
