import React, { useState } from 'react';
import { Shield, AlertTriangle, MapPin, Clock, Phone, LogOut, Eye, CheckCircle, Radio, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Incident {
  id: string;
  userId: string;
  type: string;
  message: string;
  isVoice: boolean;
  timestamp: string;
  status: 'pending' | 'responding' | 'resolved';
  authority: 'health' | 'security';
  officer_message?: string;
  final_severity?: string;
  reasoning?: string;
  user_name?: string;
  user_phone?: string;
  latitude?: number;
  longitude?: number;
}

interface SecurityDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
  incidents: Incident[];
  onUpdateStatus: (id: string, status: 'responding' | 'resolved') => void;
  onUpdatePriority: (id: string, sev: 'low' | 'medium' | 'critical') => void;
}

export function SecurityDashboard({ staffId, staffName, onLogout, incidents, onUpdateStatus, onUpdatePriority }: SecurityDashboardProps) {
  const now = new Date().toLocaleString();
  // Local state for UI only, logic handled by polling in App.tsx
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const normalizeSeverity = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'medium') return 'medium';
    return 'low';
  };

  const [patrols] = useState([
    { id: 'P1', officer: 'Officer Johnson', zone: 'North Campus', status: 'active' },
    { id: 'P2', officer: 'Officer Smith', zone: 'South Campus', status: 'active' },
    { id: 'P3', officer: 'Officer Davis', zone: 'Central Campus', status: 'break' },
    { id: 'P4', officer: 'Officer Wilson', zone: 'East Campus', status: 'active' },
  ]);
  const [priorityDraft, setPriorityDraft] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>Security Operations Center</h1>
            <p className="text-white/80 text-sm">Campus Security & Safety • {now}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <div className="text-sm">{staffName}</div>
              <p className="text-xs text-white/70">Security ID: {staffId}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Threats</p>
                <div className="text-red-500">{activeIncidents.length}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Low Severity</p>
                <div className="text-green-500">
                  {activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'low').length}
                </div>
              </div>
              <Radio className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Medium Severity</p>
                <div className="text-blue-500">
                  {activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'medium').length}
                </div>
              </div>
              <Camera className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Critical Severity</p>
                <div className="text-red-500">
                  {activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'critical').length}
                </div>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Resolved</p>
                <div className="text-green-500">
                  {incidents.filter(i => i.status === 'resolved').length}
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
            <TabsTrigger value="protocols">Response Protocols</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-4">
            {activeIncidents.length === 0 ? (
              <Card className="p-12 bg-white rounded-2xl shadow-sm text-center">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="mb-2">All Clear</h3>
                <p className="text-gray-600">No active security incidents at this time</p>
              </Card>
            ) : (
              activeIncidents.map((incident) => (
                <Card key={incident.id} className="p-6 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-1`}>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold">{incident.type}</h3>
                          <Badge className={`${incident.status === 'responding' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {incident.status.toUpperCase()}
                          </Badge>
                          {incident.final_severity && (
                            <Badge className={`${(incident.final_severity || '').toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                              } text-white`}>
                              {(incident.final_severity || '').toUpperCase() === 'HIGH' ? 'CRITICAL' : incident.final_severity}
                            </Badge>
                          )}
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl mb-3">
                          <p className="text-gray-800 font-medium mb-2">{incident.message}</p>
                          {incident.isVoice && <Badge variant="outline" className="text-xs">Voice Message</Badge>}

                          {incident.officer_message && (
                            <div className="mt-3 pt-3 border-t border-orange-200">
                              <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                AI Officer Guidance:
                              </p>
                              <p className="text-sm text-blue-900 mt-1">{incident.officer_message}</p>
                            </div>
                          )}
                          <div className="mt-3">
                            <label className="text-xs text-gray-600">Priority</label>
                            <select
                              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                              value={normalizeSeverity(priorityDraft[incident.id] || incident.final_severity || 'low')}
                              onChange={(e) =>
                                setPriorityDraft((prev) => ({ ...prev, [incident.id]: e.target.value }))
                              }
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="critical">Critical</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 rounded-xl"
                              onClick={() =>
                                onUpdatePriority(
                                  incident.id,
                                  normalizeSeverity(priorityDraft[incident.id] || incident.final_severity || 'low') as 'low' | 'medium' | 'critical'
                                )
                              }
                            >
                              Change Priority
                            </Button>
                          </div>
                          {incident.latitude && incident.longitude && (
                            <div className="mt-3 space-y-2">
                              <div className="text-sm text-gray-600">Location:</div>
                              <div className="w-full h-56 rounded-xl overflow-hidden border border-gray-200 pointer-events-none">
                                <iframe
                                  title={`map-${incident.id}`}
                                  src={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=15&output=embed`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 text-sm underline"
                                >
                                  Open in Google Maps
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`, '_blank', 'noopener')}
                                  className="rounded-xl"
                                >
                                  View Location
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(incident.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            User: {incident.user_name ? `${incident.user_name}${incident.user_phone ? ` (${incident.user_phone})` : ''}` : incident.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200 flex-wrap">
                    {incident.status === 'pending' && (
                      <Button
                        onClick={() => onUpdateStatus(incident.id, 'responding')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      >
                        Respond
                      </Button>
                    )}
                    <Button
                      onClick={() => onUpdateStatus(incident.id, 'resolved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                    >
                      Resolve
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact User
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl flex-1"
                      disabled={!incident.latitude || !incident.longitude}
                      onClick={() => {
                        if (incident.latitude && incident.longitude) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`,
                            '_blank',
                            'noopener'
                          );
                        }
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View Location
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          

          <TabsContent value="protocols" className="space-y-4">
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Security Threat Levels</h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                    <span>Critical - Immediate Action</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Active threats, violence, weapons on campus. Deploy all available units.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
                    <span>High - Priority Response</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Harassment, suspicious activity, unauthorized access. Respond within 5 minutes.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3" />
                    <span>Medium - Standard Response</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Property damage, minor disturbances. Respond within 15 minutes.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Emergency Response Procedures</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-3 text-sm">Active Shooter Protocol</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. Lockdown campus immediately</li>
                    <li>2. Alert all units and law enforcement</li>
                    <li>3. Evacuate safe zones</li>
                    <li>4. Coordinate with police</li>
                  </ol>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-3 text-sm">Harassment Response</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. Respond to location immediately</li>
                    <li>2. Separate involved parties</li>
                    <li>3. Document incident details</li>
                    <li>4. Provide victim support</li>
                  </ol>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-3 text-sm">Medical Emergency</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. Secure the scene</li>
                    <li>2. Call health services</li>
                    <li>3. Provide first aid if trained</li>
                    <li>4. Control crowd and traffic</li>
                  </ol>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-3 text-sm">Fire/Evacuation</h4>
                  <ol className="text-sm text-gray-600 space-y-2">
                    <li>1. Activate fire alarm</li>
                    <li>2. Guide evacuation routes</li>
                    <li>3. Account for all personnel</li>
                    <li>4. Coordinate with fire dept</li>
                  </ol>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-none">
              <h3 className="mb-3">Response Time Standards</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-red-500 mb-1">Critical</div>
                  <p className="text-sm text-gray-600">&lt; 3 minutes</p>
                </div>
                <div className="text-center">
                  <div className="text-orange-500 mb-1">High</div>
                  <p className="text-sm text-gray-600">&lt; 5 minutes</p>
                </div>
                <div className="text-center">
                  <div className="text-yellow-500 mb-1">Medium</div>
                  <p className="text-sm text-gray-600">&lt; 15 minutes</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
