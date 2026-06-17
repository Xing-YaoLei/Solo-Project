import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "@/pages/MainMenu";
import LoadingPage from "@/pages/LoadingPage";
import InspectionPage from "@/pages/InspectionPage";
import ContractPage from "@/pages/ContractPage";
import MeterPage from "@/pages/MeterPage";
import ReviewPage from "@/pages/ReviewPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/game/inspection" element={<InspectionPage />} />
        <Route path="/game/contract" element={<ContractPage />} />
        <Route path="/game/meter" element={<MeterPage />} />
        <Route path="/game/review" element={<ReviewPage />} />
        <Route path="*" element={<MainMenu />} />
      </Routes>
    </Router>
  );
}
