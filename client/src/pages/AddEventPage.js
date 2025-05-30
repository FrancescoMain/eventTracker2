import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // Import the configured Axios instance
import EventForm from "../components/Events/EventForm"; // Added import for EventForm
import { Container, Alert, Button } from "react-bootstrap"; // Added Button

// Debounce function (if still needed for position, otherwise can be removed)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const AddEventPage = () => {
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    date: "",
    eventName: "",
    description: "",
    position: "",
    contactName: "",
    contactNumber: "",
    images: [], // To store File objects
  });
  const [error, setError] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator

  // If using Nominatim for position, keep these, otherwise they can be removed.
  const [positionSuggestions, setPositionSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // If using Nominatim for position, keep this block
    if (name === "position") {
      if (value.trim() === "") {
        setPositionSuggestions([]);
      } else {
        // Assuming debouncedFetchSuggestions is defined if Nominatim is used
        // debouncedFetchSuggestions(value);
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit the number of images if necessary, e.g., to 5
    const currentImageCount = eventData.images.length;
    const remainingSlots = 5 - currentImageCount; // Example limit
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots && remainingSlots <= 0) {
      setError(
        `Puoi caricare un massimo di 5 immagini. ${
          remainingSlots === 0
            ? "Hai raggiunto il limite."
            : `Puoi aggiungerne altre ${remainingSlots}.`
        }`
      );
      // Clear the file input so the user can try again if they wish
      e.target.value = null;
      return;
    }
    if (files.length > remainingSlots && remainingSlots > 0) {
      setError(
        `Puoi caricare un massimo di 5 immagini. Sono state aggiunte solo le prime ${remainingSlots} immagini.`
      );
    } else {
      setError(""); // Clear error if selection is valid
    }

    setEventData((prevData) => ({
      ...prevData,
      images: [...prevData.images, ...filesToAdd],
    }));

    const newPreviews = [];
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === filesToAdd.length) {
          setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Clear the file input so the same file(s) can be re-selected if removed and added again
    e.target.value = null;
  };

  const removeImage = (indexToRemove) => {
    setEventData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, index) => index !== indexToRemove),
    }));
    setImagePreviews((prevPreviews) =>
      prevPreviews.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleClose = () => {
    navigate("/");
  };

  const handleSubmit = async (eventDataFromForm) => {
    // e.preventDefault(); // EventForm now handles its own submit event
    setError("");
    // Validation might be slightly different if EventForm passes structured data
    if (!eventDataFromForm.title || !eventDataFromForm.date) {
      setError("Titolo e Data sono obbligatori."); // Translated
      return;
    }

    setIsLoading(true); // Set loading to true before API call

    const formData = new FormData();
    formData.append("title", eventDataFromForm.title);
    formData.append("description", eventDataFromForm.description);
    formData.append("date", eventDataFromForm.date);
    if (eventDataFromForm.location) {
      formData.append("location", eventDataFromForm.location);
    }
    if (eventDataFromForm.contacts) {
      formData.append("contacts", eventDataFromForm.contacts);
    }

    // Append new image files from EventForm
    if (eventDataFromForm.newImageFiles) {
      eventDataFromForm.newImageFiles.forEach((file) => {
        formData.append("imageGallery", file);
      });
    }

    try {
      const response = await axiosInstance.post("/events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Evento aggiunto con successo:", response.data); // Translated
      alert("Evento aggiunto con successo!"); // Translated
      navigate("/");
    } catch (err) {
      console.error(
        "Errore nell'aggiunta dell'evento:", // Translated
        err.response ? err.response.data : err.message
      );
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          "Errore nell'aggiunta dell'evento. Riprova."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      {error && <Alert variant="danger">{error}</Alert>}
      <EventForm
        initialData={{
          title: "",
          description: "",
          date: new Date(), // EventForm expects a Date object
          location: "",
          contacts: "",
          imageGallery: [],
          newImageFiles: [],
        }}
        onSubmit={handleSubmit}
        isEditMode={false}
        error={error}
        loading={isLoading}
      />
      <Button
        variant="secondary"
        onClick={() => navigate("/")}
        className="mt-3 mb-3"
      >
        Indietro
      </Button>
      {isLoading && (
        <div className="text-center mt-3">
          <p>Caricamento in corso...</p>
        </div>
      )}
    </Container>
  );
};

export default AddEventPage;
