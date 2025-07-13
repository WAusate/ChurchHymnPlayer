import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeToastProvider } from "@/components/safe-toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import HymnList from "@/pages/hymn-list";
import Player from "@/pages/player";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/organ/:organKey">
        {(params) => <HymnList organKey={params.organKey} />}
      </Route>
      <Route path="/organ/:organKey/hymn/:hymnIndex">
        {(params) => <Player organKey={params.organKey} hymnIndex={params.hymnIndex} />}
      </Route>
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeToastProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            <Router />
          </div>
        </TooltipProvider>
      </SafeToastProvider>
    </QueryClientProvider>
  );
}

export default App;
