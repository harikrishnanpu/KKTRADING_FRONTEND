import React, { useEffect, useState } from "react";

export default function ErrorModal({ message, onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration - 500); // Start fade-out animation slightly before removing

    const removeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onClose, duration]);

  return (
    isVisible && (
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`bg-red-500 text-white px-4 py-2 rounded-md shadow-lg text-xs font-medium animate-slide-in-right transition-opacity duration-500 ${
            !isVisible ? "opacity-0" : ""
          }`}
        >
          {message}
        </div>
      </div>
    )
  );
}
