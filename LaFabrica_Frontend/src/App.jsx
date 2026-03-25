import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import Players from "./Components/Players";
import PlayerProfile from "./Components/PlayerProfile";

function App() {
  return (
    <BrowserRouter>
        <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Players" element={<Players />} />
            <Route path="/Players/:id" element={<PlayerProfile />} />
          </Routes>
    </BrowserRouter>
  );
}

export default App;
