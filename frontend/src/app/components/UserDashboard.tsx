import React, { useState, useRef } from 'react';
import { Bell, MapPin, AlertCircle, Phone, Clock, User, Shield, Activity, Mic, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

interface UserDashboardProps {
  userId: string;
  userName: string;
  onSendIncident: (type: string, message: string, isVoice: boolean) => void;
}

export function UserDashboard({ userId, userName, onSendIncident }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sos' | 'history' | 'profile'>('sos');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<string | null>(null);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 3000; // 3 seconds

  const handleSendIncident = (type: string) => {
    if (incidentMessage.trim()) {
      onSendIncident(type, incidentMessage, false);
      setIncidentMessage('');
    }
  };

  const handleVoiceInput = (type: string) => {
    // Simulate voice input - in production, this would use speech recognition API
    onSendIncident(type, 'Voice message recorded', true);
  };

  const handleMouseDown = (type: string) => {
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingType(type);
      // Start voice recording
      console.log('Started voice recording for:', type);
    }, longPressThreshold);
  };

  const handleMouseUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    
    if (isRecording && recordingType) {
      // Stop recording and send
      console.log('Stopped voice recording for:', recordingType);
      onSendIncident(recordingType, 'Voice emergency message recorded', true);
      setIsRecording(false);
      setRecordingType(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', color: 'bg-red-500', icon: Activity, authority: 'health' },
    { id: 'security', label: 'Security Threat', color: 'bg-orange-500', icon: Shield, authority: 'security' },
    { id: 'harassment', label: 'Harassment', color: 'bg-purple-500', icon: AlertCircle, authority: 'security' },
    { id: 'accident', label: 'Accident', color: 'bg-yellow-500', icon: AlertCircle, authority: 'health' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1>Campus Safety</h1>
          <p className="text-white/80 text-sm">Stay Safe, Stay Connected</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {/* User Info */}
            <Card className="p-4 bg-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Anonymous ID</p>
                  <p className="font-mono">{userId}</p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            {/* SOS Message Input */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Describe Your Emergency</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your emergency details here..."
                  value={incidentMessage}
                  onChange={(e) => setIncidentMessage(e.target.value)}
                  className="min-h-[100px] rounded-xl resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVoiceInput('general')}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Input
                  </Button>
                  <Button
                    onClick={() => handleSendIncident('general')}
                    disabled={!incidentMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Alert
                  </Button>
                </div>
              </div>
            </Card>

            {/* Emergency Buttons */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h2 className="mb-2">Quick Emergency SOS</h2>
              <p className="text-gray-600 text-sm mb-6">
                Tap to send alert | Hold for 3 seconds to record voice message
              </p>

              <div className="grid grid-cols-2 gap-4">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSendIncident(type.id)}
                    onMouseDown={() => handleMouseDown(type.id)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleMouseDown(type.id)}
                    onTouchEnd={handleMouseUp}
                    className={`${type.color} text-white p-6 rounded-2xl hover:opacity-90 transition-all flex flex-col items-center justify-center relative ${
                      isRecording && recordingType === type.id ? 'animate-pulse ring-4 ring-white' : ''
                    }`}
                  >
                    <type.icon className="w-8 h-8 mb-2" />
                    <span className="text-center">{type.label}</span>
                    {isRecording && recordingType === type.id && (
                      <div className="absolute top-2 right-2">
                        <Mic className="w-5 h-5 animate-pulse" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {isRecording && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-2xl animate-pulse">
                  <p className="text-red-700 text-center flex items-center justify-center">
                    <Mic className="w-5 h-5 mr-2" />
                    Recording... Release to send
                  </p>
                </div>
              )}
            </Card>

            {/* Emergency Contacts */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Emergency Contacts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <div>Campus Security</div>
                      <p className="text-sm text-gray-600">911</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-full">
                    Call
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <div>Medical Services</div>
                      <p className="text-sm text-gray-600">Emergency</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-full">
                    Call
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <h2 className="mb-4">Alert History</h2>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>Medical Emergency</div>
                  <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                </div>
                <p className="text-sm text-gray-600">Dec 15, 2025 • 10:30 AM</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>Security Alert</div>
                  <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                </div>
                <p className="text-sm text-gray-600">Dec 10, 2025 • 3:45 PM</p>
              </div>
            </div>
          </Card>
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
            className={`flex flex-col items-center ${
              activeTab === 'sos' ? 'text-pink-500' : 'text-gray-400'
            }`}
          >
            <AlertCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">SOS</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center ${
              activeTab === 'history' ? 'text-pink-500' : 'text-gray-400'
            }`}
          >
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center ${
              activeTab === 'profile' ? 'text-pink-500' : 'text-gray-400'
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
