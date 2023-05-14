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

function App() {
  return (
    <Router>
      <Routes>
        <Route path={"/"} element={<Settings/>}/>
        <Route path={"/settings/:simID"} element={<WindAndSources/>}/>
        <Route path={"/map/:simID"} element={<Map/>}/>
        <Route path={"*"} element={<Navigate to={"/"} replace/>}/>
      </Routes>
    </Router>
  );
}

export default App;
