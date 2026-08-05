import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <h1 className="font-serif-title text-7xl font-extrabold text-amber-900">404</h1>
      <h2 className="font-serif-title text-2xl font-bold text-gray-900">Page Not Found</h2>
      <p className="text-sm text-gray-500">
        The page or artisan collection you are searching for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-block px-8 py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl hover:bg-amber-900 shadow-md"
      >
        Return to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
