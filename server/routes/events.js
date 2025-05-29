const express = require('express');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const Event = require('../models/Event'); // Assuming your Event model is in ../models/Event.js
const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    // Allow GET requests to pass through without a token
    if (req.method === 'GET') {
      return next();
    }
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token (replace 'yourSecretKey' with your actual secret from environment variable)
    const decoded = jwt.verify(token, 'yourSecretKey'); // Use the same secret key as in auth.js
    req.user = decoded.user; // Add user from payload to request object
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    // Allow GET requests to pass through even if token is invalid or expired
    if (req.method === 'GET') {
      return next();
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// POST /api/events - Create a new event
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, imageGallery, location, contacts, date } = req.body;

  try {
    const newEvent = new Event({
      title,
      description,
      imageGallery,
      location,
      contacts,
      date,
      // user: req.user.id // If you add user association
    });

    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
});

// GET /api/events - Get all events (publicly accessible)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // Sort by date, newest first
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// GET /api/events/:id - Get a single event by ID (publicly accessible)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while fetching event' });
  }
});

// PUT /api/events/:id - Update an event by ID
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, imageGallery, location, contacts, date } = req.body;
  const eventId = req.params.id;

  try {
    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add authorization check: Ensure the user updating the event is the one who created it (if applicable)
    // if (event.user.toString() !== req.user.id) {
    //   return res.status(401).json({ message: 'User not authorized to update this event' });
    // }

    event.title = title || event.title;
    event.description = description || event.description;
    event.imageGallery = imageGallery || event.imageGallery;
    event.location = location || event.location;
    event.contacts = contacts || event.contacts;
    event.date = date || event.date;

    event = await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while updating event' });
  }
});

// DELETE /api/events/:id - Delete an event by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  const eventId = req.params.id;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add authorization check here as well
    // if (event.user.toString() !== req.user.id) {
    //   return res.status(401).json({ message: 'User not authorized to delete this event' });
    // }

    await Event.deleteOne({ _id: eventId }); // Using deleteOne instead of remove
    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

// PDF Export
const PdfPrinter = require('pdfmake');
const fs = require('fs'); // Required for font definitions

// Define fonts (required by pdfmake)
const fonts = {
  Roboto: {
    normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64'),
  }
};

const printer = new PdfPrinter(fonts);

// GET /api/events/:id/export-pdf - Export an event as PDF
router.get('/:id/export-pdf', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // For image URLs, pdfmake can fetch them if they are http/https URLs.
    // If they are local paths or require special handling, more setup is needed.
    // For now, we'll assume they are accessible URLs or just list them as text.
    const imageContent = event.imageGallery && event.imageGallery.length > 0
      ? event.imageGallery.map(imgUrl => ({ text: `Image: ${imgUrl}`, link: imgUrl, style: 'link' }))
      : [{ text: 'No images available for this event.' }];

    const documentDefinition = {
      content: [
        { text: 'Event Details', style: 'header' },
        { text: `Date: ${new Date(event.date).toLocaleDateString()}`, style: 'subheader' },
        { text: `Event: ${event.title}`, style: 'subheader' },
        { text: 'Description:', style: 'subheader' },
        { text: event.description || 'No description provided.' },
        { text: 'Images:', style: 'subheader', marginTop: 10 },
        ...imageContent,
        { text: 'Contacts:', style: 'subheader', marginTop: 10 },
        { text: event.contacts || 'No contact information provided.' },
        { text: 'Location:', style: 'subheader', marginTop: 10 },
        event.location
          ? { text: event.location, link: `https://www.google.com/maps?q=${encodeURIComponent(event.location)}`, style: 'link' }
          : { text: 'No location provided.' },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        link: {
          color: 'blue',
          decoration: 'underline',
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=event_${event._id}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Error exporting event to PDF:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error while exporting event to PDF' });
  }
});

module.exports = router;
