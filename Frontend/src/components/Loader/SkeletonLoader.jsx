import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-8">
      {/* First Section */}
      <div role="status" className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded-md dark:bg-gray-700 w-1/2"></div>
        
        <div className="space-y-2.5">
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-11/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-10/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-9/12"></div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/4"></div>
          <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-2/3"></div>
          <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-1/2"></div>
        </div>
      </div>

      {/* Second Section */}
      <div role="status" className="animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded-md dark:bg-gray-700 w-1/2"></div>
        
        <div className="space-y-2.5">
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-11/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-10/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-9/12"></div>
        </div>

        <div className="space-y-2.5">
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-11/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-10/12"></div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/4"></div>
          <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-2/3"></div>
        </div>
        
        <div className="h-5 bg-gray-200 rounded-md dark:bg-gray-700 w-1/2 mt-6"></div>
        
        <div className="space-y-2.5">
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-11/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-10/12"></div>
          <div className="h-3.5 bg-gray-200 rounded-full dark:bg-gray-700 w-9/12"></div>
        </div>
      </div>
      
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default SkeletonLoader;