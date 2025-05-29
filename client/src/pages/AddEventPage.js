import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventForm from '../components/Events/EventForm';
import { Container, Alert } from 'react-bootstrap';

const AddEventPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (eventData) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        navigate('/login'); // Redirect to login if no token
        return;
      }

      await axios.post('/api/events', eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Event created successfully');
      navigate('/'); // Navigate to dashboard/calendar on success
    } catch (err) {
      console.error('Error creating event:', err.response ? err.response.data : err.message);
      setError(err.response && err.response.data.message ? err.response.data.message : 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      <EventForm onSubmit={handleSubmit} error={error} loading={loading} />
    </Container>
  );
};

export default AddEventPage;
