import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const EventForm = ({ initialData, onSubmit, isEditMode = false, error, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [contacts, setContacts] = useState('');
  const [imageGallery, setImageGallery] = useState(''); // Comma-separated URLs

  useEffect(() => {
    if (isEditMode && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDate(initialData.date ? moment(initialData.date).toDate() : new Date());
      setLocation(initialData.location || '');
      setContacts(initialData.contacts || '');
      setImageGallery(initialData.imageGallery ? initialData.imageGallery.join(', ') : '');
    }
  }, [initialData, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const galleryArray = imageGallery.split(',').map(url => url.trim()).filter(url => url);
    onSubmit({
      title,
      description,
      date: moment(date).toISOString(), // Ensure consistent date format
      location,
      contacts,
      imageGallery: galleryArray,
    });
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="eventTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eventDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Event description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eventDate">
              <Form.Label>Date</Form.Label>
              <br />
              <DatePicker
                selected={date}
                onChange={(newDate) => setDate(newDate)}
                className="form-control"
                dateFormat="MMMM d, yyyy h:mm aa"
                showTimeSelect
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eventLocation">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eventContacts">
              <Form.Label>Contacts</Form.Label>
              <Form.Control
                type="text"
                placeholder="Contact information (phone, email)"
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eventImageGallery">
              <Form.Label>Image Gallery URLs (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., http://example.com/image1.jpg, http://example.com/image2.jpg"
                value={imageGallery}
                onChange={(e) => setImageGallery(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default EventForm;
