import React, { useState } from 'react';
import { Activity, AlertCircle, Clock, MapPin, Phone, LogOut, CheckCircle, User, Ambulance } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface HealthDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
}

interface MedicalIncident {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  reportedAt: string;
  status: 'pending' | 'responding' | 'resolved';
  userId: string;
  description: string;
}

export function HealthDashboard({ staffId, staffName, onLogout }: HealthDashboardProps) {
  const [incidents, setIncidents] = useState<MedicalIncident[]>([
    {
      id: 'MED-001',
      type: 'Cardiac Emergency',
      priority: 'critical',
      location: 'Library Building, 3rd Floor',
      reportedAt: '2 min ago',
      status: 'responding',
      userId: 'USR-1234',
      description: 'Student collapsed, chest pain reported'
    },
    {
      id: 'MED-002',
      type: 'Minor Injury',
      priority: 'medium',
      location: 'Sports Complex',
      reportedAt: '15 min ago',
      status: 'pending',
      userId: 'USR-5678',
      description: 'Ankle sprain during basketball game'
    },
    {
      id: 'MED-003',
      type: 'Allergic Reaction',
      priority: 'high',
      location: 'Cafeteria',
      reportedAt: '5 min ago',
      status: 'pending',
      userId: 'USR-9012',
      description: 'Severe food allergy reaction'
    }
  ]);

  const handleStatusChange = (incidentId: string, newStatus: 'pending' | 'responding' | 'resolved') => {
    setIncidents(incidents.map(inc => 
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'responding': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>Health Services Dashboard</h1>
            <p className="text-white/80 text-sm">Medical Emergency Response</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="text-red-500">
                  {incidents.filter(i => i.priority === 'critical').length}
                </div>
              </div>
              <Activity className="w-8 h-8 text-red-500" />
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
                <p className="text-gray-600 text-sm mb-1">Resolved Today</p>
                <div className="text-green-500">{resolvedIncidents.length}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">Active Incidents</TabsTrigger>
            <TabsTrigger value="triage">Triage Center</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
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
                      <div className={`${getPriorityColor(incident.priority)} w-2 h-full rounded-full`} />
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3>{incident.type}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(incident.priority)} text-white`}>
                            {incident.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{incident.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {incident.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {incident.reportedAt}
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {incident.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(incident.id, 'responding')}
                        className="bg-blue-500 hover:bg-blue-600 rounded-xl"
                        disabled={incident.status === 'responding'}
                      >
                        Respond
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
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Patient
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Ambulance className="w-4 h-4 mr-2" />
                      Dispatch Ambulance
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
                <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
                    <span>High - Urgent Care Needed</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Serious injuries, severe allergic reactions, respiratory distress
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

          <TabsContent value="resources" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white rounded-2xl shadow-sm">
                <h3 className="mb-4">Medical Equipment Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span>Ambulances Available</span>
                    <Badge className="bg-green-500 text-white">3/3</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span>AED Units</span>
                    <Badge className="bg-green-500 text-white">12/12</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                    <span>First Aid Kits</span>
                    <Badge className="bg-yellow-500 text-white">15/18</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span>Medical Staff On Duty</span>
                    <Badge className="bg-green-500 text-white">8/8</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white rounded-2xl shadow-sm">
                <h3 className="mb-4">Emergency Contacts</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div>Campus Medical Center</div>
                      <p className="text-sm text-gray-600">Main Facility</p>
                    </div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-full">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div>City Hospital</div>
                      <p className="text-sm text-gray-600">Emergency Room</p>
                    </div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-full">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div>Poison Control</div>
                      <p className="text-sm text-gray-600">24/7 Hotline</p>
                    </div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-full">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-none">
              <h3 className="mb-3">Response Time Target</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-red-500 mb-1">Critical</div>
                  <p className="text-sm text-gray-600">&lt; 2 minutes</p>
                </div>
                <div className="text-center">
                  <div className="text-orange-500 mb-1">High</div>
                  <p className="text-sm text-gray-600">&lt; 5 minutes</p>
                </div>
                <div className="text-center">
                  <div className="text-yellow-500 mb-1">Medium</div>
                  <p className="text-sm text-gray-600">&lt; 10 minutes</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
