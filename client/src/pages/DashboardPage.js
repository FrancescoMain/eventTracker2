import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { useNavigate, Link } from "react-router-dom"; // Added Link
import axiosInstance from "../api/axiosInstance";
import { Button, Container, Row, Col } from "react-bootstrap";

const daysShort = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthMatrix(year, month) {
  const firstDayOfMonth = dayjs(new Date(year, month, 1));
  const startDay = firstDayOfMonth.day(); // 0 (Sunday) to 6 (Saturday)
  const daysInMonth = firstDayOfMonth.daysInMonth();

  const matrix = [];
  let currentDay = 1 - startDay;

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      if (currentDay > 0 && currentDay <= daysInMonth) {
        week.push(currentDay);
      } else {
        week.push(null);
      }
      currentDay++;
    }
    matrix.push(week);
    if (
      currentDay > daysInMonth &&
      matrix[matrix.length - 1].every((d) => d === null) &&
      row < 5
    ) {
      // If the current day has passed the number of days in the month
      // and the last week added is all nulls (and it's not the 6th week potentially),
      // it means we might have added an unnecessary empty week if the month fits in 5 weeks.
      // However, standard calendars often show 6 weeks to maintain layout consistency.
      // For this implementation, we'll stick to 6 rows for simplicity unless further optimization is needed.
    }
  }
  return matrix;
}

const DashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Initialize with current day
  const navigate = useNavigate();

  const year = currentDate.year();
  const month = currentDate.month(); // 0-indexed
  const monthMatrix = getMonthMatrix(year, month);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get("/events");
        setEvents(response.data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  const eventDates = useMemo(() => {
    const datesWithEvents = new Set();
    events.forEach((event) => {
      datesWithEvents.add(dayjs(event.date).format("YYYY-MM-DD"));
    });
    return datesWithEvents;
  }, [events]);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) =>
      dayjs(event.date).isSame(selectedDate, "day")
    );
  }, [events, selectedDate]);

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, "month"));
  };

  const handleDateClick = (day) => {
    if (day) {
      setSelectedDate(dayjs(new Date(year, month, day)));
    }
  };

  const handleAddEventClick = () => {
    navigate("/events/new");
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden"
      style={{ fontFamily: "Inter, 'Noto Sans', sans-serif" }}
    >
      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto pb-20">
        {" "}
        {/* Added pb-20 for footer height */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <div
            className="text-[#0d141c] flex size-12 shrink-0 items-center"
            data-icon="ArrowLeft"
            data-size="24px"
            data-weight="regular"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
          </div>
          <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Calendar
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 p-4">
          {/* Dynamic Calendar */}
          <div className="flex min-w-72 max-w-[336px] flex-1 flex-col gap-0.5">
            <div className="flex items-center p-1 justify-between">
              <button onClick={handlePrevMonth}>
                <div
                  className="text-[#0d141c] flex size-10 items-center justify-center"
                  data-icon="CaretLeft"
                  data-size="18px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18px"
                    height="18px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                  </svg>
                </div>
              </button>
              <p className="text-[#0d141c] text-base font-bold leading-tight flex-1 text-center">
                {currentDate.format("MMMM YYYY")}
              </p>
              <button onClick={handleNextMonth}>
                <div
                  className="text-[#0d141c] flex size-10 items-center justify-center"
                  data-icon="CaretRight"
                  data-size="18px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18px"
                    height="18px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-7">
              {daysShort.map((dayName) => (
                <p
                  key={dayName}
                  className="text-[#0d141c] text-[13px] font-bold leading-normal tracking-[-0.015em] flex h-12 w-full items-center justify-center pb-0.5"
                >
                  {dayName}
                </p>
              ))}
              {monthMatrix.flat().map((day, index) => {
                const isSelected =
                  day &&
                  selectedDate.isSame(dayjs(new Date(year, month, day)), "day");
                const isCurrentMonthDay = day !== null;

                let dayFormatted = null;
                if (isCurrentMonthDay) {
                  dayFormatted = dayjs(new Date(year, month, day)).format(
                    "YYYY-MM-DD"
                  );
                }
                const hasEvent =
                  isCurrentMonthDay && eventDates.has(dayFormatted);

                let buttonClass =
                  "h-12 w-full text-sm font-medium leading-normal relative"; // Added relative for dot positioning
                if (!isCurrentMonthDay) {
                  buttonClass += " text-transparent";
                } else {
                  buttonClass += " text-[#0d141c]";
                }

                let divClass =
                  "flex size-full items-center justify-center rounded-full";
                if (isSelected) {
                  divClass += " bg-[#0c77f2] text-slate-50";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={buttonClass}
                    disabled={!isCurrentMonthDay}
                    style={{
                      gridColumnStart:
                        day === 1 && monthMatrix[0][index % 7] === 1
                          ? currentDate.date(1).day() + 1
                          : "auto",
                    }}
                  >
                    <div className={divClass}>
                      {isCurrentMonthDay ? day : ""}
                    </div>
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    )}
                    {hasEvent && isSelected && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Removed static November calendar */}
        </div>
        {/* Events for selected date */}
        {selectedDate && eventsForSelectedDate.length > 0 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-[#0d141c]">
              Events on {selectedDate.format("MMMM D, YYYY")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {eventsForSelectedDate.map((event) => (
                <div
                  key={event._id}
                  className="bg-white shadow-lg rounded-lg overflow-hidden"
                >
                  {event.imageGallery && event.imageGallery.length > 0 && (
                    <img
                      // Use the Cloudinary URL directly
                      src={event.imageGallery[0]}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="text-md font-bold text-gray-800 mb-1">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 truncate mb-3">
                      {event.description}
                    </p>
                    <div className="flex justify-start space-x-2">
                      {/* <Link
                        to={`/events/${event._id}/edit`}
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        Edit
                      </Link> */}
                      <Link
                        to={`/events/${event._id}`}
                        className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600"
                      >
                        Details
                      </Link>
                      {/* The "View" action can be similar to "Details" or a modal later */}
                      {/* <button
                        onClick={() => navigate(`/events/${event._id}`)} // Or a modal handler
                        className="px-3 py-1 text-xs font-semibold text-white bg-gray-500 rounded hover:bg-gray-600"
                      >
                        View
                      </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedDate &&
          eventsForSelectedDate.length === 0 &&
          eventDates.has(selectedDate.format("YYYY-MM-DD")) && (
            <div className="p-4 text-center text-gray-500">
              No events scheduled for {selectedDate.format("MMMM D, YYYY")}, but
              other events exist this month.
            </div>
          )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 w-full bg-slate-50">
        <div className="flex gap-2 border-t border-[#e7edf4] bg-slate-50 px-4 pb-3 pt-2">
          <a
            className="just flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0d141c]"
            href="#"
          >
            <div
              className="text-[#0d141c] flex h-8 items-center justify-center"
              data-icon="Calendar"
              data-size="24px"
              data-weight="fill"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM112,184a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm56-8a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136a23.76,23.76,0,0,1-4.84,14.45L152,176ZM48,80V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80Z"></path>
              </svg>
            </div>
          </a>
          <a
            className="just flex flex-1 flex-col items-center justify-end gap-1 text-[#49709c]"
            href="#"
            onClick={handleAddEventClick} // Add onClick handler
          >
            <div
              className="text-[#49709c] flex h-8 items-center justify-center"
              data-icon="Plus"
              data-size="24px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </div>
          </a>
          <a
            className="just flex flex-1 flex-col items-center justify-end gap-1 text-[#49709c]"
            href="#"
          >
            <div
              className="text-[#49709c] flex h-8 items-center justify-center"
              data-icon="User"
              data-size="24px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
            </div>
          </a>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
};

export default DashboardPage;
