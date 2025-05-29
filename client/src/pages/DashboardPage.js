import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
import CalendarComponent from '../components/Calendar/CalendarComponent'; // Import CalendarComponent

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    console.log('Token removed, logging out.');
    navigate('/login');
  };

  const handleAddNewEvent = () => {
    navigate('/events/new');
  };

  return (
    <Container fluid className="mt-3"> {/* Changed to fluid and adjusted margin */}
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Admin Dashboard</h1>
            <div>
              <Button variant="primary" onClick={handleAddNewEvent} className="me-2">
                Add New Event
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
          <p>Welcome! Here are your events. Click on an event to edit it.</p>
          <CalendarComponent /> {/* Render the CalendarComponent */}
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
