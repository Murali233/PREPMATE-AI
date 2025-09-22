import React from 'react';
import Button from './Button';

const DeleteAlertContent = ({ content, onCancel, onDelete }) => {
  return (
    <div className="p-5">
      <p className="text-[14px] text-gray-700 mb-4">{content}</p>
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-4 py-2 text-sm"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          className="px-4 py-2 text-sm"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default DeleteAlertContent;