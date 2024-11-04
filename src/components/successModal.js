import React from 'react';

const SuccessModal = ({ showModal, closeModal, message }) => {
  return (
    <div className={`modal ${showModal ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={closeModal}></div>
      <div className="modal-content">
        <div className="box">
          <p>{message}</p>
          <button className="button is-primary" onClick={closeModal}>
            OK
          </button>
        </div>
      </div>
      <button className="modal-close is-large" aria-label="close" onClick={closeModal}></button>
    </div>
  );
};

export default SuccessModal;
