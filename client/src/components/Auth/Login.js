import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If proxy is set up in package.json, this will be 'http://localhost:5000/api/auth/login'
      const response = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      console.log('Login successful, token:', response.data.token);
      
      // For now, navigate to a placeholder home page
      // In a real app, you might navigate to a dashboard or protected route
      navigate('/'); 

    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      setError(err.response && err.response.data.message ? err.response.data.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
