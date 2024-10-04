import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'https://kktrading-backend.onrender.com/';

export default function Chatscreen() {
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const [socket, setSocket] = useState(null);
  const uiMessagesRef = useRef(null);
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : [
      { name: 'Admin', body: 'Hello there, Please ask your question.' }
    ]
  });
  const bottomRef = useRef(null); // Reference for the bottom of the message list
  const [typing, setTyping] = useState(false); // Track if someone is typing
  const [isTyping, setIsTyping] = useState(false); // Display typing indicator

  useEffect(() => {

    const sk = socketIOClient(ENDPOINT);
    setSocket(sk);

    sk.emit('onLogin', {
      _id: userInfo._id,
      name: userInfo.name,
      isAdmin: userInfo.isAdmin,
    });

    sk.on('message', (data) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, data];
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    sk.on('typing', (data) => {
      if (data.name !== userInfo.name) {
        setIsTyping(true); // Show typing indicator if another user is typing
      }
    });

    sk.on('stopTyping', (data) => {
      if (data.name !== userInfo.name) {
          setIsTyping(false); 
      }
    });

    return () => {
      sk.disconnect();
      sk.off('message');
      sk.off('typing');
      sk.off('stopTyping');
    };
  }, [userInfo]);

  const handleTyping = (e) => {
    setMessageBody(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit('typing', { name: userInfo.name });
    }

    // Debounce typing event
    setTimeout(() => {
      setTyping(false);
      socket.emit('stopTyping', { name: userInfo.name });
    }, 3000); // 1 second after stopping typing, stop sending typing notifications
  };



  useEffect(() => {
    if (uiMessagesRef.current) {
      uiMessagesRef.current.scrollTop = uiMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert('Error. Please type a message.');
      return;
    }

    const newMessage = { body: messageBody, name: userInfo.name };
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    setMessageBody('');

    socket.emit('onMessage', {
      body: messageBody,
      name: userInfo.name,
      isAdmin: userInfo.isAdmin,
      _id: userInfo._id,
    });

    socket.emit('stopTyping', { name: userInfo.name });

  };

      // Scroll to bottom when messages are updated
      useEffect(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, [messages,isTyping]);

  return (
<div className="container mx-auto text-center mt-10">
  {/* Fixed Header */}
  <div className="bg-white shadow-md p-4 fixed top-0 left-0 w-full z-10 flex justify-center items-center">
    <a href='/' className="text-blue-600 fixed top-5 left-5">
      <i className='fa fa-angle-left' /> Back
    </a>
    <div className="text-center flex flex-col">
      <p className='font-bold text-red-600 text-xl mb-5'>KK TRADING Inbox</p>
      <p className='text-gray-600 text-sm font-bold'>{userInfo.name} (You)</p>
      <p className='text-xs mt-1 text-gray-300'><i className='fa fa-lock' /> All the messages are visible to admins only and are not saved</p>
    </div>
    <div></div> {/* Empty div for alignment */}
  </div>

  {/* Messages Area */}
  <ul className='flex-grow lg:w-1/2 lg:mx-auto overflow-y-auto pt-20 pb-24' ref={uiMessagesRef}>
              {messages.length === 0 && <li className='text-xs text-gray-400'>No messages </li>}
              {messages.map((msg, index) => (
          <li
          key={index}
          className={`flex mb-4 ${
            msg.name !== userInfo.name ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`${
              msg.name !== userInfo.name
                ? "bg-gray-200 text-gray-900"
                : "bg-blue-500 text-white"
            } p-3 rounded-lg max-w-xs break-words shadow-lg`}
          >
            <p className="text-sm">{msg.body}</p>
          </div>
        </li>
              ))}

                      {/* Bottom Ref for scrolling */}
          <div ref={bottomRef} />

          {isTyping && (
    <div className="flex justify-start mb-4">
    <div className="bg-gray-200 px-3 py-1 rounded-lg max-w-xs break-words shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="rounded-full text-gray-500  animate-bounce"><i style={{fontSize: '10px'}} className='fa fa-circle' /></div>
          <div className="rounded-full text-gray-500  animate-bounce delay-200"><i style={{fontSize: '10px'}} className='fa fa-circle' /></div>
          <div className="rounded-full text-gray-500  animate-bounce delay-400"><i style={{fontSize: '10px'}} className='fa fa-circle' /></div>
        </div>
      </div>
    </div>
  </div>
        )}

            </ul>

  {/* Fixed Input Form */}
  <div className="fixed lg:w-1/2 lg:mx-auto bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-700 p-3">
    <form onSubmit={submitHandler} className='mx-auto'>
      <div className="flex items-center">
        <input
          value={messageBody}
           onChange={handleTyping}
          id="chat"
          rows="1"
          className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Your message..."
        />
        <button type="submit" className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
          <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
        </button>
      </div>
    </form>
  </div>
</div>



  );
}
