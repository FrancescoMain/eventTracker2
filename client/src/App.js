import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage'; // Import the DashboardPage
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          {/* You can add more protected routes here, e.g.,
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage /> 
              </ProtectedRoute>
            } 
          /> 
          */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
