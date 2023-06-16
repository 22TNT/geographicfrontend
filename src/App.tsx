import React, {useState} from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
  useNavigate,
} from "react-router-dom";

import Settings from "./components/SettingsPage";
import Map from "./components/MapPage";
import WindAndSources from "./components/WindAndSources";
import MapHomePage from "./components/MapHomePage";
import MapSourcesPage from "./components/MapSourcesPage";
import MapSimuPage from "./components/MapSimuPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path={"/"} element={<MapHomePage/>}/>
        <Route path={"/settings/:simID"} element={<MapSourcesPage/>}/>
        <Route path={"/map/:simID"} element={<MapSimuPage/>}/>
        <Route path={"*"} element={<Navigate to={"/"} replace/>}/>
      </Routes>
    </Router>
  );
}

export default App;
