import React from 'react';
import PropTypes from 'prop-types';

const Modal = ({ children, isOpen, onClose, title, hideHeader }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start w-full h-full bg-black/40 p-4 overflow-y-auto">
      {/* Modal Content */}
      <div className="relative flex flex-col bg-white shadow-xl rounded-xl w-full max-w-md my-8 max-h-[90vh] overflow-hidden">
        {/* Close Button (Top Right) */}
        <button
          type="button"
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Header */}
        {!hideHeader && title && (
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  hideHeader: PropTypes.bool,
};

Modal.defaultProps = {
  title: '',
  hideHeader: false,
};

export default Modal;
