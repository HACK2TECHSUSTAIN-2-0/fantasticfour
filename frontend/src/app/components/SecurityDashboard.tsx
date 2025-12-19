import React, { useState } from 'react';
import { Shield, AlertTriangle, MapPin, Clock, Phone, LogOut, Eye, CheckCircle, Radio, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SecurityDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
}

interface SecurityIncident {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  reportedAt: string;
  status: 'active' | 'investigating' | 'resolved';
  userId: string;
  description: string;
}

export function SecurityDashboard({ staffId, staffName, onLogout }: SecurityDashboardProps) {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: 'SEC-001',
      type: 'Suspicious Activity',
      severity: 'high',
      location: 'Parking Lot B',
      reportedAt: '5 min ago',
      status: 'investigating',
      userId: 'USR-3456',
      description: 'Unknown person trying to access restricted area'
    },
    {
      id: 'SEC-002',
      type: 'Harassment Report',
      severity: 'critical',
      location: 'Student Center',
      reportedAt: '3 min ago',
      status: 'active',
      userId: 'USR-7890',
      description: 'Student reporting harassment incident'
    },
    {
      id: 'SEC-003',
      type: 'Property Damage',
      severity: 'medium',
      location: 'Dormitory C',
      reportedAt: '20 min ago',
      status: 'active',
      userId: 'USR-2345',
      description: 'Vandalism reported in common area'
    }
  ]);

  const [patrols] = useState([
    { id: 'P1', officer: 'Officer Johnson', zone: 'North Campus', status: 'active' },
    { id: 'P2', officer: 'Officer Smith', zone: 'South Campus', status: 'active' },
    { id: 'P3', officer: 'Officer Davis', zone: 'Central Campus', status: 'break' },
    { id: 'P4', officer: 'Officer Wilson', zone: 'East Campus', status: 'active' },
  ]);

  const handleStatusChange = (incidentId: string, newStatus: 'active' | 'investigating' | 'resolved') => {
    setIncidents(incidents.map(inc => 
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-700';
      case 'investigating': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>Security Operations Center</h1>
            <p className="text-white/80 text-sm">Campus Security & Safety</p>
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
                <p className="text-gray-600 text-sm mb-1">Active Patrols</p>
                <div className="text-green-500">
                  {patrols.filter(p => p.status === 'active').length}
                </div>
              </div>
              <Radio className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">CCTV Active</p>
                <div className="text-blue-500">48/50</div>
              </div>
              <Camera className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Critical</p>
                <div className="text-red-500">
                  {incidents.filter(i => i.severity === 'critical').length}
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
            <TabsTrigger value="patrols">Patrol Management</TabsTrigger>
            <TabsTrigger value="map">Campus Map</TabsTrigger>
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
                      <div className={`${getSeverityColor(incident.severity)} w-2 h-full rounded-full`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3>{incident.type}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge className={`${getSeverityColor(incident.severity)} text-white`}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{incident.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {incident.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {incident.reportedAt}
                          </div>
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            {incident.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(incident.id, 'investigating')}
                        className="bg-blue-500 hover:bg-blue-600 rounded-xl whitespace-nowrap"
                        disabled={incident.status === 'investigating'}
                      >
                        Investigate
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(incident.id, 'resolved')}
                        className="bg-green-500 hover:bg-green-600 rounded-xl"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact User
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Radio className="w-4 h-4 mr-2" />
                      Dispatch Unit
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Camera className="w-4 h-4 mr-2" />
                      View CCTV
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <MapPin className="w-4 h-4 mr-2" />
                      View Location
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="patrols" className="space-y-4">
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Active Patrol Units</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {patrols.map((patrol) => (
                  <div key={patrol.id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          patrol.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div>{patrol.officer}</div>
                          <p className="text-sm text-gray-600">{patrol.id}</p>
                        </div>
                      </div>
                      <Badge className={patrol.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {patrol.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      {patrol.zone}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                        <Radio className="w-4 h-4 mr-2" />
                        Radio
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                        <MapPin className="w-4 h-4 mr-2" />
                        Track
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Patrol Schedule</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span>Morning Shift (06:00 - 14:00)</span>
                  <Badge className="bg-blue-500 text-white">4 Officers</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <span>Evening Shift (14:00 - 22:00)</span>
                  <Badge className="bg-orange-500 text-white">6 Officers</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span>Night Shift (22:00 - 06:00)</span>
                  <Badge className="bg-purple-500 text-white">5 Officers</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="mb-4">Live Campus Map</h3>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="mb-2">Interactive Campus Map</h3>
                  <p className="text-gray-600 mb-4">Real-time incident tracking and patrol monitoring</p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                      <span className="text-sm">Active Incidents</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                      <span className="text-sm">Patrol Units</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                      <span className="text-sm">CCTV Cameras</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span>North Campus</span>
                  <Badge className="bg-green-100 text-green-700">Clear</Badge>
                </div>
              </Card>
              <Card className="p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span>Central Campus</span>
                  <Badge className="bg-red-100 text-red-700">2 Incidents</Badge>
                </div>
              </Card>
              <Card className="p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span>South Campus</span>
                  <Badge className="bg-green-100 text-green-700">Clear</Badge>
                </div>
              </Card>
            </div>
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
