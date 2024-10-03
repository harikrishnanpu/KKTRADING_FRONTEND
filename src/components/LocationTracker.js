import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const LocationSender = () => {
    const userSignin = useSelector((state) => state.userSignin);
    const { userInfo } = userSignin;
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const [tracking, setTracking] = useState(false);

    useEffect(() => {
        if (userInfo) {
            const newSocket = io('http://localhost:4000/'); // Replace with your server URL
            setSocket(newSocket);


            // Function to get and send the user's location
            const sendLocation = () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { longitude, latitude } = position.coords;

                            // Emit the user ID and coordinates to the server
                            newSocket.emit('update-location', {
                                userId: userInfo._id,
                                userName: userInfo.name,
                                longitude,
                                latitude,
                            });
                        },
                        (error) => {
                            setError("Error retrieving location. Please check your settings.");
                            switch (error.code) {
                                case error.PERMISSION_DENIED:
                                    console.error("User denied the request for Geolocation.");
                                    break;
                                case error.POSITION_UNAVAILABLE:
                                    console.error("Location information is unavailable.");
                                    break;
                                case error.TIMEOUT:
                                    console.error("The request to get user location timed out.");
                                    break;
                                case error.UNKNOWN_ERROR:
                                    console.error("An unknown error occurred.");
                                    break;
                            }
                        }
                    );
                } else {
                    setError("Geolocation is not supported by this browser.");
                }
            };

            // Send location every 3 seconds
            const intervalId = setInterval(() => {
                setTracking(true);
                sendLocation();
            }, 3000);

            // Cleanup function to clear the interval and socket on component unmount
            return () => {
                clearInterval(intervalId);
                newSocket.disconnect(); // Clean up the socket connection
            };
        }

        // Cleanup socket on user sign out
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [userInfo]);

    return (
        <div>
            {tracking ? <p>TRACKING...</p> : <p>NOT TRACKING</p>}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default LocationSender;
