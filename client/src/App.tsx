import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SimpleToastContainer } from "@/components/simple-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/home";
import HymnList from "@/pages/hymn-list";
import Player from "@/pages/player";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Config from "@/pages/config";
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
      <Route path="/login" component={Login} />
      <Route path="/config" component={Config} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50">
              <Router />
              <SimpleToastContainer />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
