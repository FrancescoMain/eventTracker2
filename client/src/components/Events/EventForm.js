import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Alert,
  Image,
} from "react-bootstrap"; // Added Image
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const EventForm = ({
  initialData,
  onSubmit,
  isEditMode = false,
  error,
  loading,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [contacts, setContacts] = useState("");

  // New state for image handling
  const [existingImages, setExistingImages] = useState([]); // URLs from Cloudinary
  const [newImageFiles, setNewImageFiles] = useState([]); // File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState([]); // For new image local previews
  const [imagesToRemove, setImagesToRemove] = useState([]); // URLs of existing images to delete

  useEffect(() => {
    if (isEditMode && initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDate(
        initialData.date ? moment(initialData.date).toDate() : new Date()
      );
      setLocation(initialData.location || "");
      setContacts(initialData.contacts || "");
      setExistingImages(initialData.imageGallery || []);
      // Clear out any previous new files or previews when initialData changes
      setNewImageFiles([]);
      setImagePreviews([]);
      setImagesToRemove([]);
    } else if (!isEditMode) {
      // Reset form for create mode
      setTitle("");
      setDescription("");
      setDate(new Date());
      setLocation("");
      setContacts("");
      setExistingImages([]);
      setNewImageFiles([]);
      setImagePreviews([]);
      setImagesToRemove([]);
    }
  }, [initialData, isEditMode]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prevFiles) => [...prevFiles, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    e.target.value = null; // Allow selecting the same file again if removed
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      // Revoke object URL for the removed preview
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  };

  const toggleRemoveExistingImage = (imageUrl) => {
    setImagesToRemove((prev) =>
      prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Note: onSubmit will now receive newImageFiles and imagesToRemove
    // The parent component (AddEventPage/EditEventPage) will need to handle FormData
    onSubmit({
      title,
      description,
      date: moment(date).toISOString(),
      location,
      contacts,
      newImageFiles, // Pass new files to be uploaded
      imagesToRemove, // Pass URLs of existing images to be removed
      // Pass existing images that are NOT marked for removal, to help parent component reconstruct the gallery if needed
      existingImages: existingImages.filter(
        (url) => !imagesToRemove.includes(url)
      ),
    });
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2>{isEditMode ? "Edit Event" : "Create New Event"}</h2>
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

            {/* Image Gallery Management */}
            <Form.Group className="mb-3" controlId="eventImageGalleryUpload">
              <Form.Label>Add New Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*"
              />
            </Form.Group>

            {/* Previews for New Images */}
            {imagePreviews.length > 0 && (
              <div className="mb-3">
                <h5>New Images Preview:</h5>
                <Row>
                  {imagePreviews.map((previewUrl, index) => (
                    <Col
                      key={`new-${index}`}
                      xs={6}
                      md={4}
                      lg={3}
                      className="mb-3 position-relative"
                    >
                      <Image src={previewUrl} thumbnail fluid />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeNewImage(index)}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "15px",
                        }}
                      >
                        X
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Display Existing Images (from Cloudinary) */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-3">
                <h5>Existing Images:</h5>
                <Row>
                  {existingImages.map((imageUrl, index) => (
                    <Col
                      key={`existing-${index}`}
                      xs={6}
                      md={4}
                      lg={3}
                      className="mb-3 position-relative"
                    >
                      <Image
                        src={imageUrl}
                        thumbnail
                        fluid
                        style={{
                          opacity: imagesToRemove.includes(imageUrl) ? 0.5 : 1,
                        }}
                      />
                      <Button
                        variant={
                          imagesToRemove.includes(imageUrl)
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        onClick={() => toggleRemoveExistingImage(imageUrl)}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "15px",
                        }}
                      >
                        {imagesToRemove.includes(imageUrl) ? "Undo" : "Remove"}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
            <Button variant="primary" type="submit" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Event"
                : "Create Event"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default EventForm;
