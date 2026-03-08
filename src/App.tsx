import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Tour from "./pages/Tour";
import Dashboard from "./pages/Dashboard";
import PublicPresentation from "./pages/PublicPresentation";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import FAQ from "./pages/FAQ";
import Legal from "./pages/Legal";
import Why from "./pages/Why";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

const CaseStudy = lazy(() => import("./pages/CaseStudy"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/tour" element={<Tour />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/why" element={<Why />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/case-study" element={<Suspense fallback={<div className="min-h-screen" style={{ background: "#FFFFFF" }} />}><CaseStudy /></Suspense>} />
        <Route path="/p/:id" element={<PublicPresentation />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
