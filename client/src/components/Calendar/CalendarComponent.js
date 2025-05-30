import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        // Although GET /api/events is public, sending the token if available
        // might be useful for future personalized event features.
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        const response = await axios.get('/api/events', config);
        
        const transformedEvents = response.data.map(event => ({
          title: event.title,
          start: moment(event.date).toDate(),
          end: moment(event.date).toDate(), // Assuming single-day events for now
          allDay: true, // Assuming all events are all-day for now
          resource: event, // Store original event data
        }));
        
        setEvents(transformedEvents);
        setError('');
      } catch (err) {
        console.error('Error fetching events:', err.response ? err.response.data : err.message);
        setError(err.response && err.response.data.message ? err.response.data.message : 'Failed to load events.');
        // Optionally clear events if fetch fails
        // setEvents([]); 
      }
    };

    fetchEvents();
  }, []); // Empty dependency array ensures this runs once on mount

  if (error) {
    return <div className="alert alert-danger">Error loading events: {error}</div>;
  }

  const handleSelectEvent = (event) => {
    if (event && event.resource && event.resource._id) {
      navigate(`/events/${event.resource._id}/edit`);
    } else {
      console.warn('Selected event does not have a valid resource ID:', event);
    }
  };

  return (
    <div style={{ height: '70vh', marginTop: '20px' }}> {/* Adjusted height and added margin */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }} // Calendar takes full height of its container
        onSelectEvent={handleSelectEvent} // Add event selection handler
        // Default views and navigation are usually enabled
      />
    </div>
  );
};

export default CalendarComponent;
