import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const About = lazy(() => import("@/pages/About"));
const Archive = lazy(() => import("@/pages/Archive"));
const Contact = lazy(() => import("@/pages/Contact"));
const Home = lazy(() => import("@/pages/Home"));
const Work = lazy(() => import("@/pages/Work"));

function Router() {
  return (
    <Suspense fallback={<div className="spatial-route-loading" aria-busy="true"><span>LOADING / FIELD</span></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/work" component={Work} />
        <Route path="/contact" component={Contact} />
        <Route path="/archive" component={Archive} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
