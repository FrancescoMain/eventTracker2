import axios from "axios";

// Determine the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // Replace with your actual deployed backend URL
    return "https://your-deployed-backend.onrender.com/api"; // Example for Render
  } else {
    // Development URL, ensure your server is running on port 5001 or the one in your server/.env
    return "http://localhost:5001/api";
  }
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(), // Use the dynamic base URL
});

// Request interceptor to add the token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if the current path is not already /login to avoid redirect loops
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token"); // Clear token
        // Redirect to login page
        // Using window.location.href for simplicity here.
        // If using a router history object outside a component, that would be another way.
        window.location.href = "/login";
        // Optionally, display a message to the user
        alert("Your session has expired. Please log in again.");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
