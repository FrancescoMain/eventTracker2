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
        setError(err.response?.data?.message || "Failed to load event data.");
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
      setError(err.response?.data?.message || "Failed to update event.");
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

  // Error during page load
  if (error && !initialData) {
    return (
      <Container>
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // If initialData is null after loading and no error, it implies event not found or still an issue.
  if (!initialData && !pageLoading) {
    return (
      <Container>
        <Alert variant="warning" className="mt-3">
          Event data could not be loaded or event not found.
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      {/* Display form submission error here, if any */}
      {error && initialData && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
      {initialData && (
        <EventForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isEditMode={true}
          error={error} // Pass general form error to EventForm (might be redundant if displayed above too)
          loading={loading}
        />
      )}
      {/* Removed PDF export button from here, can be on detail page */}
    </Container>
  );
};

export default EditEventPage;
