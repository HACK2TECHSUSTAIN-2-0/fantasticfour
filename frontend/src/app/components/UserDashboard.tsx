import React, { useState, useRef } from 'react';
import { Bell, MapPin, AlertCircle, Phone, Clock, User, Shield, Activity, Mic, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

interface UserDashboardProps {
  userId: string;
  userName: string;
  onSendIncident: (type: string, message: string, isVoice: boolean, latitude?: number, longitude?: number) => void;
  apiBaseUrl: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function UserDashboard({ userId, userName, onSendIncident, apiBaseUrl }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sos' | 'profile'>('sos');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const recognitionRef = useRef<any>(null);

  const translateText = async (text: string) => {
    setIncidentMessage(text);
    try {
      const res = await fetch(`${apiBaseUrl}/translate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source_lang: 'auto' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.translated_text) {
        setIncidentMessage(data.translated_text);
      }
    } catch {
      // Ignore translation errors and keep original text
    }
  };

  const handleSendIncident = (type: string, overrideMsg?: string) => {
    const msg = overrideMsg || incidentMessage.trim();
    if (!msg && type === 'general') return;
    onSendIncident(type, msg || `SOS: ${type.toUpperCase()} ALERT`, false, coords.lat, coords.lng);
    if (!overrideMsg) setIncidentMessage('');
  };

  const handleVoiceInput = (type: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
      translateText(transcript || '');
    };
    recognition.onerror = () => recognition.stop();
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSos = () => {
    const msg = incidentMessage.trim();
    if (!msg) {
      handleSendIncident('general', 'HIGH PRIORITY SOS');
    } else {
      handleSendIncident('general', msg);
    }
  };

  // Fetch geolocation once on mount
  React.useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1>Welcome, {userName}</h1>
          <p className="text-white/80 text-sm">Stay Safe, Stay Connected</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {/* SOS Message Input + Voice */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="mb-2">Describe Your Emergency</h3>
                <Textarea
                  placeholder="Type your emergency details here..."
                  value={incidentMessage}
                  onChange={(e) => setIncidentMessage(e.target.value)}
                  className="min-h-[100px] rounded-xl resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleVoiceInput('general')}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Input
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Medical', color: 'bg-red-50', type: 'medical' },
                  { label: 'Security', color: 'bg-blue-50', type: 'security' },
                  { label: 'Harassment', color: 'bg-orange-50', type: 'harassment' },
                  { label: 'Accident', color: 'bg-purple-50', type: 'accident' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleSendIncident(item.type)}
                    className={`p-4 rounded-xl border border-gray-200 text-left transition hover:-translate-y-0.5 ${item.color}`}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">Tap to send</div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleSos}
                  className="w-28 h-28 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                >
                  <span className="text-2xl font-bold">SOS</span>
                  <span className="text-xs opacity-80">Tap to send</span>
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Empty text = HIGH PRIORITY. Otherwise uses your message.
                </p>
              </div>
            </Card>

          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="mb-1">{userName}</h2>
                <p className="text-gray-600 font-mono text-sm">{userId}</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Account Type</p>
                  <div>Anonymous User</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Privacy Status</p>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-500 mr-2" />
                    <span>Protected</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    No continuous tracking • No personal data stored • Privacy-first
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800 mb-1">Session Status</p>
                  <p className="text-xs text-blue-600">
                    You will remain logged in until an administrator removes your access.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around">
          <button
            onClick={() => setActiveTab('sos')}
            className={`flex flex-col items-center ${activeTab === 'sos' ? 'text-pink-500' : 'text-gray-400'
              }`}
          >
            <AlertCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">SOS</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-pink-500' : 'text-gray-400'
              }`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
