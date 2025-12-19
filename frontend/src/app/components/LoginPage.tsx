import React, { useState } from 'react';
import { Mail, Lock, Shield, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginPageProps {
  onLogin: (userType: 'user' | 'authority', email?: string, password?: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedType, setSelectedType] = useState<'user' | 'authority' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType === 'user') {
      // Users don't need email/password - just generate ID
      onLogin('user');
    } else if (selectedType === 'authority' && email && password) {
      onLogin('authority', email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <Shield className="w-10 h-10 text-pink-500" />
          </div>
          <h1 className="text-white mb-2">Campus Safety</h1>
          <p className="text-white/80">Emergency Response Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="mb-6 text-center">Sign In</h2>

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setSelectedType('user')}
              className={`p-4 rounded-2xl border-2 transition-all ${
                selectedType === 'user'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className={`w-8 h-8 mx-auto mb-2 ${
                selectedType === 'user' ? 'text-pink-500' : 'text-gray-400'
              }`} />
              <div className={selectedType === 'user' ? 'text-pink-500' : 'text-gray-600'}>
                User
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('authority')}
              className={`p-4 rounded-2xl border-2 transition-all ${
                selectedType === 'authority'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Shield className={`w-8 h-8 mx-auto mb-2 ${
                selectedType === 'authority' ? 'text-purple-500' : 'text-gray-400'
              }`} />
              <div className={selectedType === 'authority' ? 'text-purple-500' : 'text-gray-600'}>
                Authority
              </div>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedType === 'authority' && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl"
                    required
                  />
                </div>
              </>
            )}

            {selectedType === 'user' && (
              <div className="p-4 bg-blue-50 rounded-xl text-center text-sm text-blue-800">
                <p className="mb-2">Privacy-First Access</p>
                <p className="text-xs">Click continue to get your unique anonymous ID. No personal information required.</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!selectedType}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              {selectedType === 'user' ? 'Continue' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 mt-6 text-sm">
          Privacy-Preserving Emergency Response
        </p>
      </div>
    </div>
  );
}
