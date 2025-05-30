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
          err.response?.data?.message || "Caricamento dettagli evento fallito."
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
      alert("Esportazione PDF fallita. Riprova.");
    }
  };

  const handleDeleteEvent = async () => {
    if (
      window.confirm(
        "Sei sicuro di voler eliminare questo evento? L'azione non può essere annullata."
      )
    ) {
      setIsDeleting(true);
      setError("");
      try {
        await axiosInstance.delete(`/events/${eventId}`);
        alert("Evento eliminato con successo.");
        navigate("/"); // Navigate to dashboard or another appropriate page
      } catch (err) {
        console.error("Failed to delete event:", err);
        setError(
          err.response?.data?.message || "Eliminazione evento fallita. Riprova."
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
    return (
      <div className="p-4 text-center">Caricamento dettagli evento...</div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!event) {
    return <div className="p-4 text-center">Evento non trovato.</div>;
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
              onClick={() => navigate("/")} // Go back to the previous page
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              &larr; Indietro
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600">
              <span className="font-semibold">Data:</span>{" "}
              {dayjs(event.date).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>

          {event.location && (
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Luogo:</span> {event.location}
              </p>
            </div>
          )}

          {event.contacts && (
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Contatti:</span>{" "}
                {event.contacts}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Descrizione
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {event.description || "No description provided."}
            </p>
          </div>

          {event.imageGallery && event.imageGallery.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">
                Galleria Immagini
              </h2>
              {event.imageGallery && event.imageGallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              ) : (
                <p className="text-gray-500">Nessuna immagine disponibile.</p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-start space-y-3 sm:space-y-0 sm:space-x-3">
            <Link
              to={`/events/${eventId}/edit`}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 text-center"
            >
              Modifica Evento
            </Link>
            <button
              onClick={handleExportPdf}
              className="px-6 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              Esporta in PDF
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-6 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminazione in corso..." : "Elimina Evento"}
            </button>
          </div>
        </div>
      </div>
      {/* Fullscreen Image Modal */}
      {showFullscreen && fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeFullscreen} // Close on overlay click
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            aria-label="Chiudi anteprima"
          >
            &times;
          </button>
          <img
            src={fullscreenImage}
            alt="Anteprima immagine ingrandita"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image itself
          />
        </div>
      )}
    </>
  );
};

export default EventDetailPage;
