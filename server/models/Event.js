const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageGallery: {
    type: [String], // Array of strings (URLs or paths to images)
    default: [],
  },
  location: {
    type: String,
  },
  contacts: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  // Optional: Add a user field to link events to the user who created them
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('Event', eventSchema);
