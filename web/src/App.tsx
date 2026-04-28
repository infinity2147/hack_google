import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { CommandCenter } from "./pages/CommandCenter";
import { GlobalNetwork } from "./pages/GlobalNetwork";
import { EpidemiologicalModel } from "./pages/EpidemiologicalModel";
import { ImmuneIntelligence } from "./pages/ImmuneIntelligence";
import { RouteMarket } from "./pages/RouteMarket";
import { DocumentScanner } from "./pages/DocumentScanner";
import { LiveTrafficRoutes } from "./pages/LiveTrafficRoutes";
import { ShipmentTracker } from "./pages/ShipmentTracker";
import { ScenarioSandbox } from "./pages/ScenarioSandbox";
import { NetworkTrends } from "./pages/NetworkTrends";
import { DecisionHistory } from "./pages/DecisionHistory";

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/network" element={<GlobalNetwork />} />
        <Route path="/epidemiology" element={<EpidemiologicalModel />} />
        <Route path="/immune" element={<ImmuneIntelligence />} />
        <Route path="/market" element={<RouteMarket />} />
        <Route path="/documents" element={<DocumentScanner />} />
        <Route path="/traffic" element={<LiveTrafficRoutes />} />
        <Route path="/shipments" element={<ShipmentTracker />} />
        <Route path="/scenarios" element={<ScenarioSandbox />} />
        <Route path="/trends" element={<NetworkTrends />} />
        <Route path="/decisions" element={<DecisionHistory />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="ambient-glow flex min-h-screen bg-bg-base text-text-primary">
        <Sidebar />
        <div className="flex-1 min-w-0 relative z-10">
          <TopBar />
          <main>
            <AnimatedRoutes />
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
