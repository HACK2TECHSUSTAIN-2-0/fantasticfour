import React from 'react';
import { Shield, Activity, UserCog } from 'lucide-react';

interface AuthoritySelectorProps {
  onSelectDivision: (division: 'admin' | 'health' | 'security') => void;
  onBack: () => void;
}

export function AuthoritySelector({ onSelectDivision, onBack }: AuthoritySelectorProps) {
  const divisions = [
    {
      id: 'admin' as const,
      name: 'Admin',
      description: 'System Administration',
      icon: UserCog,
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'health' as const,
      name: 'Health Services',
      description: 'Medical Emergency Response',
      icon: Activity,
      gradient: 'from-red-500 to-pink-600',
    },
    {
      id: 'security' as const,
      name: 'Security',
      description: 'Campus Security Operations',
      icon: Shield,
      gradient: 'from-orange-500 to-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2">Select Division</h1>
          <p className="text-white/80">Choose your authority division</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {divisions.map((division) => (
            <button
              key={division.id}
              onClick={() => onSelectDivision(division.id)}
              className="bg-white rounded-3xl p-8 hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${division.gradient} rounded-2xl flex items-center justify-center`}>
                <division.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2">{division.name}</h3>
              <p className="text-sm text-gray-600">{division.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="w-full text-center text-white hover:opacity-80"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
