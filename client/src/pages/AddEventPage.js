import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // Import the configured Axios instance
// EventForm import is not used in this component.
// import EventForm from "../components/Events/EventForm";
import { Container, Alert } from "react-bootstrap";

// Debounce function (if still needed for position, otherwise can be removed if position is not using Nominatim)
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
        `You can upload a maximum of 5 images. ${
          remainingSlots === 0
            ? "You have reached the limit."
            : `You can add ${remainingSlots} more.`
        }`
      );
      // Clear the file input so the user can try again if they wish
      e.target.value = null;
      return;
    }
    if (files.length > remainingSlots && remainingSlots > 0) {
      setError(
        `You can upload a maximum of 5 images. Only the first ${remainingSlots} files were added.`
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!eventData.eventName || !eventData.date) {
      setError("Event Name and Date are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", eventData.eventName);
    formData.append("description", eventData.description);
    formData.append("date", eventData.date);
    formData.append("location", eventData.position);
    // Combining contactName and contactNumber into a single 'contacts' string for simplicity,
    // as the model has a single 'contacts' field. Adjust if backend handles them separately.
    formData.append(
      "contacts",
      `${eventData.contactName}${
        eventData.contactNumber ? " - " + eventData.contactNumber : ""
      }`
    );

    // Append images. The backend (e.g., using multer) should be configured
    // to look for files under the field name 'imageGallery' or whatever you set up.
    eventData.images.forEach((imageFile) => {
      formData.append("imageGallery", imageFile); // 'imageGallery' should match backend (multer fieldname)
    });

    try {
      // Use axiosInstance for the API call
      const response = await axiosInstance.post(
        "/events", // Base URL is already set in axiosInstance
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Authorization header is now automatically added by the interceptor
          },
        }
      );
      console.log("Event added successfully:", response.data);
      alert("Event added successfully!");
      navigate("/"); // Navigate to dashboard or event list page
    } catch (err) {
      console.error(
        "Failed to add event:",
        err.response ? err.response.data : err.message
      );
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          "Failed to add event. Please try again."
      );
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between group/design-root overflow-x-hidden"
      style={{ fontFamily: "Inter, 'Noto Sans', sans-serif" }}
    >
      <form onSubmit={handleSubmit}>
        <div>
          {/* ... existing header, error alert, Date, Event Name, Description, Position, Contact fields ... */}
          <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
            <div
              className="text-[#0d141c] flex size-12 shrink-0 items-center cursor-pointer"
              data-icon="X"
              data-size="24px"
              data-weight="regular"
              onClick={handleClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </div>
            <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
              Add Event
            </h2>
          </div>
          {error && (
            <Alert variant="danger" className="mx-4">
              {error}
            </Alert>
          )}
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Date
              </p>
              <div className="flex w-full flex-1 items-stretch rounded-xl">
                <input
                  type="date"
                  name="date"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                  value={eventData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Event Name
              </p>
              <input
                placeholder="Event Name"
                name="eventName"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                value={eventData.eventName}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Description
              </p>
              <textarea
                placeholder="Description"
                name="description"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none min-h-36 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                value={eventData.description}
                onChange={handleInputChange}
              ></textarea>
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1 relative">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Position
              </p>
              <input
                placeholder="Position"
                name="position"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                value={eventData.position}
                onChange={handleInputChange}
                autoComplete="off"
              />
              {/* Suggestions list for position (if using Nominatim) would go here */}
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Contact Name
              </p>
              <input
                placeholder="Contact Name"
                name="contactName"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                value={eventData.contactName}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-[#0d141c] text-base font-medium leading-normal pb-2">
                Contact Number
              </p>
              <input
                placeholder="Contact Number"
                name="contactNumber"
                type="tel"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49719c] p-4 text-base font-normal leading-normal"
                value={eventData.contactNumber}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
            Photo Gallery (Max 5 images)
          </h3>
          <div className="p-4">
            <input
              type="file"
              id="imageUpload"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden" // Hide the default input
            />
            <label
              htmlFor="imageUpload"
              className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-slate-100 p-6 text-center hover:border-gray-400 hover:bg-slate-200"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Click to upload images
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </span>
            </label>

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="h-32 w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex px-4 py-3">
            <button
              type="submit"
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 bg-[#0b79ee] text-slate-50 text-base font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">Add Event</span>
            </button>
          </div>
          <div className="h-5 bg-slate-50"></div>
        </div>
      </form>
    </div>
  );
};

export default AddEventPage;
