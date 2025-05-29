import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import AddEventPage from './pages/AddEventPage'; // Import AddEventPage
import EditEventPage from './pages/EditEventPage'; // Import EditEventPage
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
          <Route 
            path="/events/new" 
            element={
              <ProtectedRoute>
                <AddEventPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events/:eventId/edit" 
            element={
              <ProtectedRoute>
                <EditEventPage />
              </ProtectedRoute>
            } 
          />
          {/* You can add more protected routes here */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
