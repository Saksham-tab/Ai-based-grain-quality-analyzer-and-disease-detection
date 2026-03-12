import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";

import Layout from "@/components/layout/Layout";
import RealTimeAnalysisPage from "@/pages/real-time-analysis";
import PurityDashboardPage from "@/pages/purity-dashboard";
import ReportLookupPage from "@/pages/report-lookup";
import KisanSahayakPage from "@/pages/kisan-sahayak";
import { MqttProvider } from "./services/MqttProvider";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RealTimeAnalysisPage} />
      <Route path="/purity" component={PurityDashboardPage} />
      <Route path="/reports" component={ReportLookupPage} />
      <Route path="/kisan-sahayak" component={KisanSahayakPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MqttProvider>
        <TooltipProvider>
          <Toaster />
          <Layout>
            <Router />
          </Layout>
        </TooltipProvider>
      </MqttProvider>
    </QueryClientProvider>
  );
}
