import React, { useState, useEffect, useRef } from 'react';
import socketIOClient from 'socket.io-client';
var serverUrl = process.env.NODE_ENV === 'production'
    ? window.location.origin // Use the current origin in production
    : 'http://localhost:3100'; // Use localhost in development


const ChatPage = ({ apiData, currentUser }) => {
    // console.log(apiData);
    // console.log(currentUser);
    const [savedMessages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const socketRef = useRef(); // Create a ref to store the socket instance


    useEffect(() => {

        // Initialize Socket.io client connection
        const socket = socketIOClient(serverUrl);
        socketRef.current = socket; // Store the socket instance in the ref

        // Join the chat room using the chat ID
        socket.emit('joinRoom', apiData.chat._id);

        // Listen for new messages sent by the server and update the messages state
        socket.on('message', (savedMessages) => {
            // console.log('Received message:', message);
            setMessages((prevMessages) => [...prevMessages, savedMessages]);
        });

        // Clean up the socket connection when the component unmounts
        return () => {
            socket.disconnect();
        };
    }, [apiData.chat._id]);
    useEffect(() => {
        // console.log(messages); // This will log the updated state when messages change
        scrollToBottom()
    }, [savedMessages]);
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    const handleSendMessage = async (event) => {
        event.preventDefault();

        // Send the message to the server
        const newMessage = {
            roomId: apiData.chat._id,
            message: messageInput,
            senderId: apiData.sender._id,
            receiverId: apiData.receiver._id,
        };

        // Emit the message event to the server using the socket ref
        socketRef.current.emit('message', newMessage);

        // Clear the message input field
        setMessageInput('');
    };
    const messageRows = (message, apiData) => {
        if (message.author == currentUser._id) {
            return (
                <div
                    key={message._id}
                    className={`chatSent d-flex flex-row justify-content-between align-items-center`}
                >
                    <span className="message col-8 text-break">
                        <img
                            // why not the thumbnail on apiData.sender.profilePicture.thumb ? because client side cannot access virtual function on server side (mongoose virtual), so i added thumb properties that filled whenever user registering or updating profile pic (just for the client side (and for dev purposes, not all user have thumb properties because some of em register account before the thumb prop declaration))
                            src={apiData.sender.profilePicture.thumb || apiData.sender.profilePicture.url}
                            className="rounded-circle object-fit-cover me-2"
                            width="40px"
                            height="40px"
                            alt=""
                        />
                        {message.message}
                    </span>
                    <span className="text-muted fw-light small fst-italic">
                        {message.dateCreated}
                    </span>
                </div>
            )
        } else {
            return (
                <div
                    key={message._id}
                    className={`chatRecieved d-flex flex-row justify-content-between align-items-center`}
                >
                    <span className="text-muted fw-light small fst-italic">
                        {message.dateCreated}
                    </span>
                    <span className="message col-8 text-break text-end">
                        {message.message}
                        <img
                            src={apiData.receiver.profilePicture.thumb || apiData.receiver.profilePicture.url}
                            className="rounded-circle object-fit-cover ms-2"
                            width="40px"
                            height="40px"
                            alt=""
                        />
                    </span>
                </div>
            )
        }
    }



    return (
        <div className="card chatboxContainer col-sm-6 offset-sm-3">
            <div className="card-header text-white">
                Chat with&nbsp;
                <a href={`/${apiData.receiver._id}`} className="text-decoration-none">
                    {apiData.receiver.name}
                </a>
            </div>
            {apiData.chat ? (
                <>
                    <div id="chatContainer" className="card-body py-0">
                        {apiData.chat.messages.map((message) => (
                            messageRows(message, apiData)
                        ))}
                        {savedMessages.map((message) => (
                            messageRows(message, apiData)
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="d-flex mt-auto">
                        <input
                            className="form-control"
                            name="message"
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)} />
                        <button type="submit" className="btn btn-socialize">
                            Send
                        </button>
                    </form>
                </>

            ) : (
                <form onSubmit={handleSendMessage} className="d-flex mt-auto">
                    <input
                        className="form-control"
                        name="message"
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-socialize">
                        Send
                    </button>
                </form>
            )}
            {/* {console.log('Current messages:', savedMessages)} */}
        </div>
    );
};

export default ChatPage;