import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/components/Dashboard";
import Logs from "@/components/Logs";
import Users from "@/components/Users";
import AIAnalysis from "@/components/AIAnalysis";
import Statistics from "@/components/Statistics";
import Alerts from "@/components/Alerts";
import Settings from "@/components/Settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";

function Router() {
  const [activeSection, setActiveSection] = useState("dashboard");
  
  return (
    <div className="flex h-screen bg-primary-dark text-gray-100 overflow-hidden">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/logs" component={Logs} />
          <Route path="/users" component={Users} />
          <Route path="/ai-analysis" component={AIAnalysis} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
