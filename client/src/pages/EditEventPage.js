import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is imported
import EventForm from '../components/Events/EventForm';
import { Container, Alert, Spinner, Button } from 'react-bootstrap'; // Import Button

const EditEventPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(''); // General form/page error
  const [loading, setLoading] = useState(false); // For form submission
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportError, setPdfExportError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      setError('');
      setPageLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please login.');
          navigate('/login');
          return;
        }
        // GET requests for events are public, but sending token doesn't hurt
        const response = await axios.get(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInitialData(response.data);
      } catch (err) {
        console.error('Error fetching event:', err.response ? err.response.data : err.message);
        setError(err.response && err.response.data.message ? err.response.data.message : 'Failed to load event data.');
      } finally {
        setPageLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, navigate]);

  const handleSubmit = async (eventData) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        navigate('/login');
        return;
      }

      await axios.put(`/api/events/${eventId}`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Event updated successfully');
      navigate('/'); // Navigate to dashboard/calendar on success
    } catch (err) {
      console.error('Error updating event:', err.response ? err.response.data : err.message);
      setError(err.response && err.response.data.message ? err.response.data.message : 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading event data...</span>
        </Spinner>
        <p>Loading event data...</p>
      </Container>
    );
  }

  if (error && !initialData) { // Show general error if initial data failed to load
    return <Container><Alert variant="danger" className="mt-3">{error}</Alert></Container>;
  }

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setPdfExportError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPdfExportError('Authentication required. Please login again.');
        navigate('/login'); // Should be handled by ProtectedRoute or similar, but good fallback
        return;
      }

      const response = await axios.get(`/api/events/${eventId}/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Crucial for file download
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = initialData && initialData.title 
                       ? `event_${initialData.title.replace(/\s+/g, '_')}_${eventId}.pdf` 
                       : `event_${eventId}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting PDF:', err.response ? err.response.data : err.message);
      // Try to parse error from blob if it's a JSON error response
      if (err.response && err.response.data instanceof Blob && err.response.data.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function() {
            const errorData = JSON.parse(this.result);
            setPdfExportError(errorData.message || 'Failed to export PDF. The server returned an error.');
        };
        reader.readAsText(err.response.data);
      } else {
        setPdfExportError(err.response && err.response.data && err.response.data.message 
                          ? err.response.data.message 
                          : 'Failed to export PDF. Please try again.');
      }
    } finally {
      setIsExportingPdf(false);
    }
  };
  
  // Show general form error if submission fails, or PDF export error
  return (
    <Container>
      {error && !pdfExportError && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {pdfExportError && <Alert variant="danger" className="mt-3">{pdfExportError}</Alert>}
      
      {initialData && (
        <>
          <EventForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isEditMode={true}
            error={error} // Pass general form error to EventForm
            loading={loading}
          />
          <div className="mt-3 d-flex justify-content-end">
            <Button 
              variant="info" 
              onClick={handleExportPdf} 
              disabled={isExportingPdf || !initialData}
            >
              {isExportingPdf ? 'Exporting...' : 'Export to PDF'}
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default EditEventPage;
