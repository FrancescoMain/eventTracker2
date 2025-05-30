import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card } from "react-bootstrap";

const UserProfilePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication tokens or user data from localStorage
    localStorage.removeItem("token"); // Assuming token is stored with key 'token'
    localStorage.removeItem("user"); // Assuming user data is stored with key 'user'

    // Redirect to login page
    navigate("/login");
    // Optionally, you might want to refresh the page or reset global state if using context/redux
    // window.location.reload();
    console.log("Utente disconnesso.");
  };

  // Placeholder for user data - replace with actual data fetching if needed
  const user = JSON.parse(localStorage.getItem("user")); // Example: retrieve user from localStorage

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Profilo Utente</Card.Header>
            <Card.Body>
              {user && (
                <div>
                  <Card.Text>
                    <strong>Nome Utente:</strong>{" "}
                    {user.username || "Non disponibile"}
                  </Card.Text>
                  <Card.Text>
                    <strong>Email:</strong> {user.email || "Non disponibile"}
                  </Card.Text>
                  {/* Add more user details here as needed */}
                </div>
              )}
              <hr />
              <Button
                variant="danger"
                onClick={handleLogout}
                className="w-100 mb-2"
              >
                Logout
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/")}
                className="w-100"
              >
                Torna al Calendario
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;
