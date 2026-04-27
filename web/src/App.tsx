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
import { CrowdIntelligence } from "./pages/CrowdIntelligence";

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
        <Route path="/crowd" element={<CrowdIntelligence />} />
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
