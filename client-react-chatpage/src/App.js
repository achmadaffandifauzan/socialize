import React, { useState, useEffect } from "react";
import ChatPage from "./ChatPage";
import axios from "axios";

const App = () => {
  const [apiData, setApiData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const baseURL =
    process.env.NODE_ENV === "production"
      ? window.location.origin // Use the current origin in production
      : "http://localhost:3100"; // Use localhost in development
  const api = axios.create({
    baseURL: baseURL, // Your backend URL
    withCredentials: true, // Include credentials (session cookie)
  });
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/api/currentuser");
        // console.log("USER IS :::::::::::::::::::::::", response)
        setCurrentUser(response.data.user);
      } catch (error) {
        // Handle errors or set currentUser to null if the user is not authenticated
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
    const fetchChatData = async () => {
      try {
        var response =
          process.env.NODE_ENV === "production"
            ? await api.get(`/api${window.location.pathname}`) // Use the current origin in production
            : await api.get(window.location.pathname); // Use localhost in development

        // console.log(`/api${window.location.pathname}`)
        // console.log("RES IS :::::::::::::::::::::::", response.data)
        setApiData(response.data);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };
    fetchChatData();
  }, []);
  return (
    <div>
      {/* Conditional rendering of ChatPage when apiData is available */}
      {apiData && currentUser ? (
        <ChatPage apiData={apiData} currentUser={currentUser} />
      ) : (
        <div>Loading...</div> // Display a loading message or spinner while fetching data
      )}
    </div>
  );
};

export default App;
