import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'https://kktrading-backend.onrender.com/' // https://dhanyabuilders-backend.onrender.com/

export default function ChatBox(props) {
  const { userInfo } = props;
  const [socket, setSocket] = useState(null);
  const uiMessagesRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : [
      { name: 'Admin', body: 'Hello there, Please ask your question.' }
    ]
  });

  useEffect(() => {
    if (uiMessagesRef.current) {
      uiMessagesRef.current.scrollBy({
        top: uiMessagesRef.current.clientHeight,
        left: 0,
        behavior: 'smooth',
      });
    }
    if (socket) {
      socket.emit('onLogin', {
        _id: userInfo._id,
        name: userInfo.name,
        isAdmin: userInfo.isAdmin,
      });
      socket.on('message', (data) => {
        setMessages([...messages, { body: data.body, name: data.name }]);
      });
    }
  }, [messages, isOpen, socket, userInfo]);

  const supportHandler = () => {
    setIsOpen(true);
    console.log(ENDPOINT);
    const sk = socketIOClient(ENDPOINT);
    setSocket(sk);
  };
  const submitHandler = (e) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert('Error. Please type message.');
    } else {
      setMessages([...messages, { body: messageBody, name: userInfo.name }]);
      setMessageBody('');
      setTimeout(() => {
        socket.emit('onMessage', {
          body: messageBody,
          name: userInfo.name,
          isAdmin: userInfo.isAdmin,
          _id: userInfo._id,
        });
      }, 1000);
    }
  };
  

  return (
    <div className="chatbox">
      {!isOpen ? (
        <button type="button" onClick={supportHandler}>
          <i className="fa fa-support" />
        </button>
      ) : (
        <div className="card card-body">
          <div className="text-center">
          <p className='font-bold text-red-600 text-lg mb-5 mt-5'>KK TRADING INBOX</p>
          </div>

          <ul ref={uiMessagesRef}>

            {messages.map((msg, index) => (
                   <li key={index}>
                   <>
                   
 <div className={msg.name !== userInfo.name ? "flex ml-5 m-2 gap-2.5 rounded" : "flex justify-end  m-2  gap-2.5 rounded"}>
    {msg.name !== userInfo.name   && <i className="fa fa-user mt-2 rounded-full" /> }
    <div className="flex flex-col w-2/3 lg:w-1/3 leading-1.5 p-4 border-gray-200 bg-gray-100 lg:rounded-2xl rounded-3xl dark:bg-gray-700">
       <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{msg.name}{msg.name === userInfo.name  && ' (You) ' }</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400"></span>
       </div>
       <p className="text-sm mr-auto font-normal text-gray-900 dark:text-white">{msg.body}</p>
       <span className="text-sm ml-auto font-normal text-gray-300 dark:text-gray-400"></span>
    </div>
 </div>
                   </>
                 </li>
            ))}

          </ul>


          <div className="mx-auto text-center">
	<form onSubmit={submitHandler}  className='mx-auto bottom-0 left-0 right-0 '>
    <div className="flex items-center py-2 px-3 bg-gray-50 rounded-lg dark:bg-gray-700">
        <input 
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          id="chat" rows="1" className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Your message..."></input>
            <button type="submit" className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
            <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
        </button>
    </div>
</form>
<a href='/chat' className='text-xs text-center mt-5 text-blue-500 cursor-pointer'>Go to Meesage Inbox</a>
</div>

        </div>
      )}
    </div>
  );
}
