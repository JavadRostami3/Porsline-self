import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SurveyProvider } from "@/context/survey-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Survey from "@/pages/survey";
import ThankYou from "@/pages/thank-you";
import Results from "@/pages/results";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSubmissions from "@/pages/admin/submissions";
import SubmissionDetails from "@/pages/admin/submission-details";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/survey" component={Survey} />
      <Route path="/thank-you" component={ThankYou} />
      <Route path="/results" component={Results} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/submissions/:id" component={SubmissionDetails} />
      <Route path="/admin/submissions" component={AdminSubmissions} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SurveyProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </SurveyProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
