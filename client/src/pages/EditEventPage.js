import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // Changed to axiosInstance
import EventForm from "../components/Events/EventForm";
import { Container, Alert, Spinner, Button } from "react-bootstrap";

const EditEventPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // For form submission
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch

  useEffect(() => {
    const fetchEvent = async () => {
      setError("");
      setPageLoading(true);
      try {
        // Token is now handled by axiosInstance interceptor
        const response = await axiosInstance.get(`/events/${eventId}`);
        setInitialData(response.data);
      } catch (err) {
        console.error(
          "Error fetching event:",
          err.response ? err.response.data : err.message
        );
        setError(err.response?.data?.message || "Caricamento evento fallito.");
      } finally {
        setPageLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]); // Removed navigate from dependencies as it's stable

  const handleSubmit = async (eventData) => {
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", eventData.title);
    formData.append("description", eventData.description);
    formData.append("date", eventData.date);
    if (eventData.location) {
      formData.append("location", eventData.location);
    }
    if (eventData.contacts) {
      formData.append("contacts", eventData.contacts);
    }

    // Append new image files
    eventData.newImageFiles.forEach((file) => {
      formData.append("imageGallery", file); // Use the same field name as backend expects for uploads
    });

    // Append images to remove (as JSON string or individual fields)
    // Sending as a JSON string is often simpler for the backend to parse.
    if (eventData.imagesToRemove && eventData.imagesToRemove.length > 0) {
      formData.append(
        "imagesToRemove",
        JSON.stringify(eventData.imagesToRemove)
      );
    }

    // Append existing images that are being kept (URLs)
    // This helps the backend reconstruct the final imageGallery array.
    if (eventData.existingImages && eventData.existingImages.length > 0) {
      formData.append(
        "existingImageUrls",
        JSON.stringify(eventData.existingImages)
      );
    }

    try {
      // Token is handled by axiosInstance interceptor
      // Axios will set Content-Type to multipart/form-data automatically for FormData
      await axiosInstance.put(`/events/${eventId}`, formData);

      console.log("Event updated successfully");
      navigate(`/events/${eventId}`); // Navigate to event detail page or dashboard
    } catch (err) {
      console.error(
        "Error updating event:",
        err.response ? err.response.data : err.message
      );
      setError(err.response?.data?.message || "Aggiornamento evento fallito.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento dati evento...</span>
        </Spinner>
        <p>Caricamento dati evento...</p>
      </Container>
    );
  }

  if (error && !initialData) {
    // Show error prominently if fetching failed and no data is available
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Indietro
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Title "Edit Event" is in EventForm, handled there */}
      {/* This page mainly orchestrates EventForm */}
      {initialData && (
        <EventForm
          initialData={initialData} // Pass the full initialData object
          onSubmit={handleSubmit}
          isEditMode={true}
          error={error} // Pass down error for EventForm to display if it handles it
          loading={loading} // Pass down loading state
        />
      )}
      {/* Display error here if it occurs during submit, or if initial fetch failed but we allow retry/render form */}
      {error && !loading && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" size="sm" />
          <p>Aggiornamento in corso...</p> {/* Updating... */}
        </div>
      )}
    </Container>
  );
};

export default EditEventPage;
