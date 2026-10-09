import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Components/Home";
import Players from "./Components/Players";
import PlayerProfile from "./Components/PlayerProfile";
import AdminImport from "./Components/AdminImport";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Players" element={<Players />} />
            <Route path="/Players/:id" element={<PlayerProfile />} />
            <Route path="/admin/import" element={<AdminImport />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
