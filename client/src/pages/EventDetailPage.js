import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null); // State for fullscreen image URL
  const [showFullscreen, setShowFullscreen] = useState(false); // State for fullscreen visibility
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/events/${eventId}`);
        setEvent(response.data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch event details:", err);
        setError(
          err.response?.data?.message || "Failed to load event details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleExportPdf = async () => {
    try {
      const response = await axiosInstance.get(
        `/events/${eventId}/export-pdf`,
        {
          responseType: "blob", // Important for file download
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `event_${event?.title || eventId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href); // Clean up
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleDeleteEvent = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      setIsDeleting(true);
      setError("");
      try {
        await axiosInstance.delete(`/events/${eventId}`);
        alert("Event deleted successfully.");
        navigate("/"); // Navigate to dashboard or another appropriate page
      } catch (err) {
        console.error("Failed to delete event:", err);
        setError(
          err.response?.data?.message ||
            "Failed to delete event. Please try again."
        );
        setIsDeleting(false);
      }
    }
  };

  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
    setShowFullscreen(true);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
    setFullscreenImage(null);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading event details...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!event) {
    return <div className="p-4 text-center">Event not found.</div>;
  }

  return (
    <>
      {" "}
      {/* Use Fragment to allow sibling elements for fullscreen overlay */}
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {event.title}
            </h1>
            <button
              onClick={() => navigate(-1)} // Go back to the previous page
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              &larr; Back
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600">
              <span className="font-semibold">Date:</span>{" "}
              {dayjs(event.date).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>

          {event.location && (
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Location:</span>{" "}
                {event.location}
              </p>
            </div>
          )}

          {event.contacts && (
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Contacts:</span>{" "}
                {event.contacts}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Description
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {event.description || "No description provided."}
            </p>
          </div>

          {event.imageGallery && event.imageGallery.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">
                Photo Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {event.imageGallery.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden shadow cursor-pointer"
                    onClick={
                      () => openFullscreen(imageUrl) // Use Cloudinary URL directly
                    }
                  >
                    <img
                      src={imageUrl} // Use Cloudinary URL directly
                      alt={`Event gallery ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-3">
            <Link
              to={`/events/${event._id}/edit`}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 text-center"
            >
              Edit Event
            </Link>
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              Export to PDF
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>
      </div>
      {showFullscreen && fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeFullscreen} // Close on clicking the background
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          >
            <img
              src={fullscreenImage}
              alt="Fullscreen event"
              className="block max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={closeFullscreen}
              className="absolute top-2 right-2 md:top-4 md:right-4 bg-white text-black rounded-full p-2 text-lg leading-none hover:bg-gray-200"
              aria-label="Close fullscreen"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventDetailPage;
