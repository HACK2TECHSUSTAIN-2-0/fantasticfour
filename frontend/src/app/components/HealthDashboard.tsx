import React, { useState } from 'react';
import { Activity, AlertCircle, Clock, MapPin, Phone, LogOut, CheckCircle, User, Ambulance } from 'lucide-react';
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

interface HealthDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
  incidents: Incident[];
  onUpdateStatus: (id: string, status: 'responding' | 'resolved') => void;
  onUpdatePriority: (id: string, sev: 'low' | 'medium' | 'critical') => void;
  onFalseAlarm: (id: string) => void;
}

export function HealthDashboard({ staffId, staffName, onLogout, incidents, onUpdateStatus, onUpdatePriority, onFalseAlarm }: HealthDashboardProps) {
  const now = new Date().toLocaleString();
  const [priorityDraft, setPriorityDraft] = useState<Record<string, string>>({});
  const normalizeSeverity = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'medium') return 'medium';
    return 'low';
  };
  // Local state for UI only, logic handled by polling in App.tsx
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'critical').length;
  const mediumCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'medium').length;
  const lowCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'low').length;

  const getPriorityColor = (priority: string) => {
    const p = normalizeSeverity(priority);
    if (p === 'critical') return 'bg-red-500';
    if (p === 'medium') return 'bg-yellow-500';
    if (p === 'low') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'responding': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>Health Services Dashboard</h1>
            <p className="text-white/80 text-sm">Medical Emergency Response • {now}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <div className="text-sm">{staffName}</div>
              <p className="text-xs text-white/70">Health Staff ID: {staffId}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Cases</p>
                <div className="text-red-500">{activeIncidents.length}</div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Critical</p>
                <div className="text-red-500">{criticalCount}</div>
              </div>
              <Activity className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Medium</p>
                <div className="text-yellow-500">{mediumCount}</div>
              </div>
              <Ambulance className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Low</p>
                <div className="text-green-500">{lowCount}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Responding</p>
                <div className="text-blue-500">
                  {incidents.filter(i => i.status === 'responding').length}
                </div>
              </div>
              <Ambulance className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Resolved</p>
                <div className="text-green-500">{resolvedIncidents.length}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Active Incidents</TabsTrigger>
            <TabsTrigger value="triage">Triage Center</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeIncidents.length === 0 ? (
              <Card className="p-12 bg-white rounded-2xl shadow-sm text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="mb-2">No Active Incidents</h3>
                <p className="text-gray-600">All medical emergencies have been addressed</p>
              </Card>
            ) : (
              activeIncidents.map((incident) => (
                <Card key={incident.id} className="p-6 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`${incident.final_severity === 'HIGH' ? 'bg-red-500' : 'bg-yellow-500'
                        } w-2 h-full rounded-full`} />
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3>{incident.type}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          {incident.final_severity && (
                            <Badge
                              className={`${normalizeSeverity(incident.final_severity) === 'critical'
                                ? 'bg-red-500'
                                : normalizeSeverity(incident.final_severity) === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                                } text-white`}
                            >
                              {normalizeSeverity(incident.final_severity).toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl mb-3">
                          <p className="text-gray-800 font-medium mb-2">{incident.message}</p>
                          {incident.isVoice && <Badge variant="outline" className="text-xs">Voice Message</Badge>}

                          {incident.officer_message && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                AI Response Guidance:
                              </p>
                              <p className="text-sm text-red-900 mt-1">{incident.officer_message}</p>
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
                                href={`https://www.google.com/maps?q=&layer=c&cbll=${incident.latitude},${incident.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-sm underline"
                              >
                                Street View
                              </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(incident.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {incident.user_name ? `${incident.user_name}${incident.user_phone ? ` (${incident.user_phone})` : ''}` : incident.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
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
                <Button
                  onClick={() => onFalseAlarm(incident.id)}
                  className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-xl border border-gray-300"
                >
                  False Alarm
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact User
                </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`, '_blank', 'noopener')} className="rounded-xl flex-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      View Location
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="triage" className="space-y-4">
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Triage Priority System</h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                    <span>Critical - Immediate Response Required</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Life-threatening conditions: cardiac arrest, severe bleeding, major trauma
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3" />
                    <span>Medium - Standard Response</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Minor injuries, moderate pain, non-emergency conditions
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                    <span>Low - Routine Care</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Minor ailments, consultation needed, preventive care
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Quick Assessment Guide</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-2 text-sm">Airway & Breathing</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check for obstruction</li>
                    <li>• Assess breathing rate</li>
                    <li>• Look for respiratory distress</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="mb-2 text-sm">Circulation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check pulse</li>
                    <li>• Look for bleeding</li>
                    <li>• Assess skin color</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          
        </Tabs>
      </div>
    </div>
  );
}
