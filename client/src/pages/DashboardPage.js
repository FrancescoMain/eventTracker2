import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    console.log('Token removed, logging out.');
    navigate('/login');
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <div className="text-center">
            <h1>Welcome, Admin!</h1>
            <p>This is your dashboard. More features will be added soon.</p>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
