/*
 * RecruitPath — App Router
 * Design: Athletic Command Center — dark mode only, gold accent
 * Routes: / | /signup | /signin | /profile | /schools | /emails | /pricing | /settings | /admin
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useMemo } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ModalProvider } from "./contexts/ModalContext";
import AuthSidebar from "./components/AuthSidebar";
import DockNav from "./components/DockNav";
import { useIsMobile } from "./hooks/useMobile";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Schools from "./pages/Schools";
import Emails from "./pages/Emails";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import RosterGapFinder from "./pages/RosterGapFinder";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotificationPortal from "./components/NotificationPortal";
import Onboarding from "./pages/Onboarding";
import OutreachPage from "./pages/Outreach";
import RosterPage from "./pages/Roster";
import Affiliates from "./pages/Affiliates";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AdminAffiliates from "./pages/AdminAffiliates";
import DebugPage from "./pages/DebugPage";
import { trpc } from "@/lib/trpc";
import ComingSoonGate from "./components/ComingSoonGate";
import { useState } from "react";

// Routes that use the authenticated sidebar layout
const AUTH_ROUTES = [
  "/dashboard",
  "/schools",
  "/profile",
  "/settings",
  "/pricing",
  "/emails",
  "/roster-gap",
  "/outreach",
  "/roster",
  "/success",
  "/affiliate-dashboard",
  "/admin/affiliates",
  "/debug",
];

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Wraps authenticated pages with the fixed left sidebar */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", overflowX: "hidden", alignItems: "flex-start" }}>
      {/* Sidebar: hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        <AuthSidebar />
      </div>
      {/* Content area: full width on mobile (no px), offset by sidebar on desktop */}
      {/* Pages with AppFooter handle pb-[100px] themselves; pages without it must add their own */}
      <div className="w-full md:ml-[232px] px-0 md:px-0" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
      {/* Mobile dock nav: only visible on mobile */}
      {isMobile && <DockNav />}
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  const isAuthRoute = useMemo(
    () => AUTH_ROUTES.some(r => location === r || location.startsWith(r + "/")),
    [location]
  );

  return (
    <>
      <ScrollToTop />
      {isAuthRoute ? (
        <AuthenticatedLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/schools" component={Schools} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/emails" component={Emails} />
          <Route path="/roster-gap" component={RosterGapFinder} />
          <Route path="/outreach" component={OutreachPage} />
          <Route path="/roster" component={RosterPage} />
          <Route path="/success" component={PaymentSuccess} />
          <Route path="/affiliate-dashboard" component={AffiliateDashboard} />
          <Route path="/admin/affiliates" component={AdminAffiliates} />
          <Route path="/debug" component={DebugPage} />
          </Switch>
        </AuthenticatedLayout>
      ) : (
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/admin" component={Admin} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/about" component={About} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/contact" component={Contact} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/affiliates" component={Affiliates} />
          <Route path="/admin/affiliates" component={AdminAffiliates} />
          <Route component={NotFound} />
        </Switch>
      )}
    </>
  );
}

export default function App() {
  // ⚠️ PRE-LAUNCH LOCKDOWN — remove this block entirely (and the import + useState above) to launch publicly
  const [isUnlocked, setIsUnlocked] = useState(
    sessionStorage.getItem("siteUnlocked") === "true"
  );
  if (!isUnlocked && !["/pricing", "/about"].includes(window.location.pathname)) {
    return <ComingSoonGate onUnlock={() => setIsUnlocked(true)} />;
  }
  // END PRE-LAUNCH LOCKDOWN

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "#111827",
                border: "1px solid #1E293B",
                color: "#F8FAFC",
              },
            }}
          />
          <ModalProvider>
            <Router />
            <NotificationPortal />
          </ModalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
