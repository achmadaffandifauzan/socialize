import React, { useState, useEffect } from 'react';
import ChatPage from './ChatPage';
import axios from 'axios';

const App = () => {
  const [apiData, setApiData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const api = axios.create({
    baseURL: 'http://localhost:3100', // Your backend URL
    withCredentials: true, // Include credentials (session cookie)
  });
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/api/currentuser');
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
        const response = await api.get(window.location.pathname);
        // console.log("RES IS :::::::::::::::::::::::", response.data)
        setApiData(response.data);
      } catch (error) {
        console.error('Error fetching chat data:', error);
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
