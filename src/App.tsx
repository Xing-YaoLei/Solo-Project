import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ConfigPage from "@/pages/ConfigPage";
import RecordsPage from "@/pages/RecordsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/records" element={<RecordsPage />} />
      </Routes>
    </Router>
  );
}
