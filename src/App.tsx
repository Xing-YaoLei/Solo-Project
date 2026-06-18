import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import Training from "@/pages/Training"
import Practice from "@/pages/Practice"
import Game from "@/pages/Game"
import Result from "@/pages/Result"
import Stats from "@/pages/Stats"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/training" element={<Training />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
        <Route path="/game/:levelId" element={<Game />} />
        <Route path="/result/:levelId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
