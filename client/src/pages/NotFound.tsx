import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-soil-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-leaf-100 text-leaf-700 flex items-center justify-center mb-4">
        <Sprout className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-black text-stone-900 font-display tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-stone-800 font-display mt-2">Page Not Found</h2>

      <p className="text-sm text-stone-600 max-w-sm mt-2 mb-8">
        The agricultural advisory page or record you are searching for does not exist or has been
        moved.
      </p>

      <Link to="/dashboard">
        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
