import React, { useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
import { useSelector } from "react-redux";
import LoadingBox from "../components/LoadingBox";

let allUsers = [];
let allMessages = [];
let allSelectedUser = {};
const ENDPOINT = "https://kktrading-backend.onrender.com/";

export default function SupportScreen() {
  const [selectedUser, setSelectedUser] = useState({});
  const [socket, setSocket] = useState(null);
  const uiMessagesRef = useRef(null);
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null); // Reference for the bottom of the message list
  const [typing, setTyping] = useState(false); // Track if someone is typing
  const [isTyping, setIsTyping] = useState(false); // Display typing indicator

  useEffect(() => {
    if (uiMessagesRef.current) {
      uiMessagesRef.current.scrollBy({
        top: uiMessagesRef.current.clientHeight,
        left: 0,
        behavior: "smooth",
      });
    }

    const sk = socketIOClient(ENDPOINT);

    if (!socket) {
      setLoading(true);
      setSocket(sk);

      sk.emit("onLogin", {
        _id: userInfo._id,
        name: userInfo.name,
        isAdmin: userInfo.isAdmin,
      });

      sk.on("message", (data) => {
        if (allSelectedUser._id === data._id) {
          allMessages = [...allMessages, data];
        } else {
          const existUser = allUsers.find((user) => user._id === data._id);

          if (existUser) {
            allUsers = allUsers.map((user) =>
              user._id === existUser._id ? { ...user, unread: true } : user
            );
            setUsers(allUsers);
          }
        }

        setMessages(allMessages);
        setLoading(false);
      });

      sk.on("updateUser", (updatedUser) => {
        const existUser = allUsers.find((user) => user._id === updatedUser._id);
        if (existUser) {
          allUsers = allUsers.map((user) =>
            user._id === existUser._id ? updatedUser : user
          );
          setUsers(allUsers);
          setLoading(false);
        } else {
          allUsers = [...allUsers, updatedUser];
          setUsers(allUsers);
          setLoading(false);
        }
      });

      sk.on("listUsers", (updatedUsers) => {
        allUsers = updatedUsers;
        setUsers(allUsers);
        setLoading(false);
      });

      sk.on("selectUser", (user) => {
        allMessages = user.messages;
        setMessages(allMessages);
        setLoading(false);
      });

      sk.on("typing", (data) => {
        if (data.name !== userInfo.name) {
          setIsTyping(true); // Show typing indicator if another user is typing
        }
      });

      sk.on("stopTyping", (data) => {
        if (data.name !== userInfo.name) {
            setIsTyping(false); 
          // Hide typing indicator
        }
      });
    }
  }, [messages, socket, users, userInfo]);

  // Scroll to bottom when messages are updated
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages,isTyping]);

  const selectUser = (user) => {
    allSelectedUser = user;
    setSelectedUser(allSelectedUser);
    const existUser = allUsers.find((x) => x._id === user._id);
    if (existUser) {
      allUsers = allUsers.map((x) =>
        x._id === existUser._id ? { ...x, unread: false } : x
      );
      setUsers(allUsers);
    }
    socket.emit("onUserSelected", user);
  };

  const handleTyping = (e) => {
    setMessageBody(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit("typing", { name: userInfo.name });
    }

    // Debounce typing event
    setTimeout(() => {
      setTyping(false);
      socket.emit("stopTyping", { name: userInfo.name });
    }, 3000); // 1 second after stopping typing, stop sending typing notifications
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert("Error. Please type message.");
    } else {
      allMessages = [
        ...allMessages,
        { body: messageBody, name: userInfo.name },
      ];
      setMessages(allMessages);
      setMessageBody("");

      setTimeout(() => {
        socket.emit("onMessage", {
          body: messageBody,
          name: userInfo.name,
          isAdmin: userInfo.isAdmin,
          _id: selectedUser._id,
        });
      }, 1000);
    }

    socket.emit("stopTyping", { name: userInfo.name });
  };

  return (
    <div className="container mx-auto text-center">
      {loading === true && <p className="mt-10">{<LoadingBox />}</p>}
      {loading === false && !selectedUser._id && (
        <div className="flex justify-start">
          <a className="cursor-pointer text-blue-600" href="/">
            {" "}
            <i className="fa fa-angle-left" /> Back
          </a>
        </div>
      )}
      {loading === false && !selectedUser._id && (
        <div className="mx-auto text-center">
          <p className="font-bold text-red-600 text-2xl mb-5 mt-5">
            KK TRADING Inbox
          </p>
          <ul className="max-w-md mx-auto">
            {users && <p className="font-bold text-lg mb-5">Active Users</p>}
            {users.filter((x) => x._id !== userInfo._id).length === 0 && (
              <p className="text-lg text-red-400 border-t-2 p-5">
                No online users found
              </p>
            )}
            {users
              .filter((x) => x._id !== userInfo._id)
              .map((user) => (
                <>
                  <li
                    key={user._id}
                    className="px-2 py-3 my-2 hove:bg-gray-100 rounded text-center"
                  >
                    <div
                      onClick={() => selectUser(user)}
                      className="flex justify-between items-center space-x-4 rtl:space-x-reverse cursor-pointer"
                    >
                      <div className="m-0">
                        <i
                          style={{
                            fontSize: "16px",
                            backgroundColor: "#b6b5b533",
                          }}
                          className="p-3 mt-3 fa fa-user rounded-full"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {user._id}
                        </p>
                      </div>

                      <div className="items-center text-base font-semibold text-gray-900 dark:text-white p-3">
                        {user.unread ? (
                          <p className="pl-2 pt-1 pb-1 pr-2 text-white text-xs bg-red-500 rounded-full">
                            1
                          </p>
                        ) : user.online ? (
                          <i
                            style={{ color: "green" }}
                            className="fa fa-circle"
                          />
                        ) : (
                          <i
                            style={{ color: "#dc2626" }}
                            className="fa fa-circle"
                          />
                        )}
                      </div>
                    </div>
                  </li>
                  <hr />
                </>
              ))}
          </ul>
        </div>
      )}
      {!loading && (
        <div className="justify-center text-center">
          {!selectedUser._id ? (
            <p className="text-xs text-center text-gray-400 mt-9">
              {" "}
              Click chats to open messages
            </p>
          ) : (
            <>
              <div className="bg-white shadow-md p-4 fixed top-0 left-0 w-full z-10 flex justify-between items-center">
                <div className="fixed top-3 text-blue-500">
                  <p
                    className="cursor-pointer text-blue-600"
                    onClick={() => window.location.reload()}
                  >
                    {" "}
                    <i className="fa fa-angle-left" /> Back
                  </p>
                </div>

                <div className="flex-shrink-0 mt-8">
                  <i
                    style={{ fontSize: "16px", backgroundColor: "#b6b5b533" }}
                    className="p-3 mt-3 fa fa-user rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0  mt-8">
                  <p className="text-sm font-bold font-medium text-gray-800 truncate dark:text-white">
                    {selectedUser.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                    {selectedUser._id}
                  </p>
                </div>
                <div className="p-3  mt-8 inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                  {selectedUser.unread ? (
                    "unread"
                  ) : selectedUser.online ? (
                    <i style={{ color: "green" }} className="fa fa-circle" />
                  ) : (
                    <i style={{ color: "#dc2626" }} className="fa fa-circle" />
                  )}
                </div>
                <div className="text-blue-600">
                  {/* Extra content or empty div for alignment */}
                </div>
              </div>

              <div className="mb-10"></div>
              <ul
                className="flex-grow lg:w-1/2 lg:mx-auto overflow-y-auto pt-20 pb-24"
                ref={uiMessagesRef}
              >
                {messages.length === 0 && (
                  <li className="text-xs text-gray-400">No messages </li>
                )}
                {messages.map((msg, index) => (
                  <li
                    key={index}
                    className={`flex mb-4 ${
                      msg.name !== userInfo.name
                        ? "justify-start"
                        : "justify-end"
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

              <div className="fixed lg:w-1/2 lg:mx-auto bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-700 p-3">
                <form onSubmit={submitHandler} className="mx-auto">
                  <div className="flex items-center py-2 px-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <input
                      value={messageBody}
                      onChange={handleTyping}
                      id="chat"
                      rows="1"
                      className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Your message..."
                    ></input>
                    <button
                      type="submit"
                      className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600"
                    >
                      <svg
                        className="w-6 h-6 rotate-90"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
