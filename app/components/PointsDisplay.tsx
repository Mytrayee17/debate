'use client';

import { useUser } from '../contexts/UserContext';
import { Award } from 'lucide-react';

export const PointsDisplay = () => {
  const { points } = useUser();

  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 flex items-center space-x-2 z-50 border border-gray-200">
      <Award className="w-5 h-5 text-yellow-500" />
      <span className="font-semibold">{points} points</span>
    </div>
  );
};
