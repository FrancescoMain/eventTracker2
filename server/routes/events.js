const express = require("express");
const jwt = require("jsonwebtoken");
const Event = require("../models/Event");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const axios = require("axios"); // Ensure axios is imported

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event_tracker_uploads", // Optional: folder in Cloudinary
    format: async (req, file) => "jpg", // supports promises as well
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`, //Saves files in Cloudinary with names like 'imageGallery-1629876543210'
  },
});

// File filter to accept only images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

// Initialize multer upload instance
// 'imageGallery' is the field name from the client's FormData
// 5 is the maximum number of files allowed, matching client-side
const upload = multer({
  storage: storage, // Using Cloudinary storage
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB file size limit
}).array("imageGallery", 5); // Expect an array of files from 'imageGallery' field, max 5 files

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    // Allow GET requests to pass through without a token
    if (req.method === "GET") {
      return next();
    }
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token (replace 'yourSecretKey' with your actual secret from environment variable)
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use the same secret key as in auth.js
    req.user = decoded.user; // Add user from payload to request object
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    // Allow GET requests to pass through even if token is invalid or expired
    if (req.method === "GET") {
      return next();
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

// POST /api/events - Create a new event
router.post("/", authMiddleware, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error("Multer error:", err);
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error("Unknown upload error:", err);
      return res
        .status(400)
        .json({ message: err.message || "File upload error" });
    }

    // Everything went fine with the upload.
    const { title, description, location, contacts, date } = req.body;
    let imagePaths = [];

    if (req.files && req.files.length > 0) {
      // Construct paths to be stored in DB. These will be URLs from Cloudinary.
      imagePaths = req.files.map((file) => file.path); // file.path contains the Cloudinary URL
    }

    try {
      const newEvent = new Event({
        title,
        description,
        imageGallery: imagePaths, // Save the array of image paths
        location,
        contacts,
        date,
        // user: req.user.id // If you add user association
      });

      const event = await newEvent.save();
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      // If files were uploaded but DB save failed, you might want to delete them.
      // For simplicity, this is not handled here but is a consideration for robust systems.
      res.status(500).json({ message: "Server error while creating event" });
    }
  });
});

// GET /api/events - Get all events (publicly accessible)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // Sort by date, newest first
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});

// GET /api/events/:id - Get a single event by ID (publicly accessible)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Event not found (invalid ID format)" });
    }
    res.status(500).json({ message: "Server error while fetching event" });
  }
});

// PUT /api/events/:id - Update an event by ID
router.put("/:id", authMiddleware, (req, res) => {
  // For updates, we'll use the same upload middleware.
  // If new files are provided, they will be uploaded to Cloudinary.
  // Existing images to keep will be sent in the body, and images not in that list will be (optionally) deleted.
  upload(req, res, async function (err) {
    // Changed updateUpload to upload
    if (err instanceof multer.MulterError) {
      console.error("Multer error on PUT:", err);
      return res.status(400).json({ message: err.message });
    } else if (err) {
      console.error("Unknown upload error on PUT:", err);
      return res
        .status(400)
        .json({ message: err.message || "File upload error during update" });
    }

    const { title, description, location, contacts, date } = req.body;
    // existingImageUrls will be an array of URLs/paths sent from client
    // If client sends it as 'existingImageUrls[]', req.body.existingImageUrls will be an array.
    // If client sends it as a JSON string, parse it. For simplicity, assume it's an array.
    let existingImageUrlsToKeep = req.body.existingImageUrls || [];
    if (
      typeof existingImageUrlsToKeep === "string" &&
      existingImageUrlsToKeep
    ) {
      try {
        existingImageUrlsToKeep = JSON.parse(existingImageUrlsToKeep);
      } catch (parseError) {
        // If it's a single string URL and not JSON, wrap it in an array
        existingImageUrlsToKeep = [existingImageUrlsToKeep];
      }
    }
    if (!Array.isArray(existingImageUrlsToKeep)) {
      // Ensure it's an array
      existingImageUrlsToKeep = [];
    }

    const eventId = req.params.id;

    try {
      let event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // --- Image Deletion Logic (from Cloudinary) ---
      const imagesToDeleteFromCloudinary = event.imageGallery.filter(
        (imgUrl) => !existingImageUrlsToKeep.includes(imgUrl)
      );

      for (const imgUrlToDelete of imagesToDeleteFromCloudinary) {
        try {
          const publicId = path.parse(imgUrlToDelete).name; // Extract public_id from URL
          await cloudinary.uploader.destroy(publicId);
          console.log(`Successfully deleted ${publicId} from Cloudinary.`);
        } catch (deleteError) {
          console.error(
            `Failed to delete ${imgUrlToDelete} from Cloudinary:`,
            deleteError
          );
          // Log error but don't stop the update process
        }
      }

      // --- New Image Upload Logic ---
      let newUploadedImagePaths = [];
      if (req.files && req.files.length > 0) {
        newUploadedImagePaths = req.files.map(
          (file) => file.path // Use file.path which contains the Cloudinary URL
        );
      }

      // Combine kept existing images with new ones
      const finalImageGallery = [
        ...existingImageUrlsToKeep,
        ...newUploadedImagePaths,
      ];

      // Limit total images to 5 (optional, client should also enforce this)
      if (finalImageGallery.length > 5) {
        // This case should ideally be prevented by client-side validation
        // If it happens, decide how to handle: error or truncate
        // For now, let's assume client handles it. If not, add error or truncation.
      }

      // Update event fields
      event.title = title || event.title;
      event.description = description || event.description;
      event.location = location || event.location;
      event.contacts = contacts || event.contacts;
      event.date = date || event.date;
      event.imageGallery = finalImageGallery; // Set the updated image gallery

      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      // If new files were uploaded but DB save failed, you might want to delete them.
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const tempPath = path.join(
            __dirname,
            "..",
            "uploads",
            "events",
            file.filename
          );
          fs.unlink(tempPath, (err) => {
            if (err)
              console.error(
                "Error deleting temp uploaded file on update failure:",
                err
              );
          });
        });
      }
      if (error.kind === "ObjectId") {
        return res
          .status(404)
          .json({ message: "Event not found (invalid ID format)" });
      }
      res.status(500).json({ message: "Server error while updating event" });
    }
  });
});

// DELETE /api/events/:id - Delete an event by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // --- Delete images from Cloudinary ---
    if (event.imageGallery && event.imageGallery.length > 0) {
      for (const imgUrl of event.imageGallery) {
        try {
          const publicId = path.parse(imgUrl).name; // Extract public_id from URL
          await cloudinary.uploader.destroy(publicId);
          console.log(
            `Successfully deleted ${publicId} from Cloudinary during event deletion.`
          );
        } catch (deleteError) {
          console.error(
            `Failed to delete ${imgUrl} from Cloudinary:`,
            deleteError
          );
          // Log error but continue with event deletion from DB
        }
      }
    }

    await Event.findByIdAndDelete(req.params.id); // Corrected method
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Event not found (invalid ID format)" });
    }
    res.status(500).json({ message: "Server error while deleting event" });
  }
});

const PdfPrinter = require("pdfmake");
const pdfFonts = {
  // Renamed to avoid conflict with fs
  Roboto: {
    normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
  },
};
const printer = new PdfPrinter(pdfFonts);

router.get("/:id/export-pdf", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const imageContentPromises =
      event.imageGallery && event.imageGallery.length > 0
        ? event.imageGallery.map(async (imgUrlOrPath) => {
            if (imgUrlOrPath.startsWith("/uploads/")) {
              // Local file handling (legacy)
              const imagePath = path.join(
                __dirname,
                "..",
                imgUrlOrPath.substring(1)
              );
              try {
                const imageAsBase64 = fs.readFileSync(imagePath, "base64");
                const mimeType =
                  path.extname(imagePath).toLowerCase() === ".png"
                    ? "image/png"
                    : "image/jpeg";
                return {
                  image: `data:${mimeType};base64,${imageAsBase64}`,
                  width: 150,
                };
              } catch (imgErr) {
                console.error(
                  `Error reading local image for PDF: ${imagePath}`,
                  imgErr
                );
                return { text: `Local image not found: ${imgUrlOrPath}` };
              }
            } else if (imgUrlOrPath.startsWith("http")) {
              // Cloudinary URL handling
              try {
                const imageResponse = await axios.get(imgUrlOrPath, {
                  responseType: "arraybuffer",
                });
                const imageAsBase64 = Buffer.from(
                  imageResponse.data,
                  "binary"
                ).toString("base64");
                let mimeType = "image/jpeg"; // Default
                if (imageResponse.headers["content-type"]) {
                  mimeType = imageResponse.headers["content-type"];
                } else {
                  // Fallback: Guess from URL extension if content-type is not available
                  if (imgUrlOrPath.toLowerCase().includes(".png"))
                    mimeType = "image/png";
                  else if (imgUrlOrPath.toLowerCase().includes(".gif"))
                    mimeType = "image/gif";
                }
                return {
                  image: `data:${mimeType};base64,${imageAsBase64}`,
                  width: 150,
                };
              } catch (imgErr) {
                console.error(
                  `Error fetching image from URL ${imgUrlOrPath} for PDF:`,
                  imgErr.message
                );
                return {
                  text: `Image not loadable: ${imgUrlOrPath.substring(
                    0,
                    50
                  )}...`,
                };
              }
            }
            return {
              text: `Unsupported image source: ${imgUrlOrPath.substring(
                0,
                50
              )}...`,
            }; // Fallback
          })
        : [{ text: "No images available for this event." }];

    const imageContent = await Promise.all(imageContentPromises);

    const documentDefinition = {
      content: [
        { text: "Event Details", style: "header" },
        {
          text: `Date: ${new Date(event.date).toLocaleDateString()}`,
          style: "subheader",
        },
        { text: `Event: ${event.title}`, style: "subheader" },
        { text: "Description:", style: "subheader" },
        { text: event.description || "No description provided." },
        { text: "Images:", style: "subheader", marginTop: 10 },
        ...imageContent, // Spread the processed image content here
        { text: "Contacts:", style: "subheader", marginTop: 10 },
        { text: event.contacts || "No contact information provided." },
        { text: "Location:", style: "subheader", marginTop: 10 },
        event.location
          ? {
              text: event.location,
              link: `https://www.google.com/maps?q=${encodeURIComponent(
                event.location
              )}`,
              style: "link",
            }
          : { text: "No location provided." },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        link: { color: "blue", decoration: "underline" },
      },
      defaultStyle: { font: "Roboto" },
    };

    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=event_${event._id}.pdf`
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Error exporting event to PDF:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Event not found (invalid ID format)" });
    }
    res
      .status(500)
      .json({ message: "Server error while exporting event to PDF" });
  }
});

module.exports = router;
