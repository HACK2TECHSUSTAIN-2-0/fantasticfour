import React, { useState } from 'react';
import { UserPlus, Users, Activity, Shield, LogOut, Settings, Bell, TrendingUp, Trash2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_URL } from '../../config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface Incident {
  id: string;
  userId: string;
  type: string;
  message: string;
  isVoice: boolean;
  timestamp: string;
  status: 'pending' | 'responding' | 'resolved';
  authority: 'health' | 'security' | 'general';
  officer_message?: string;
  final_severity?: string;
  reasoning?: string;
  user_name?: string;
  user_phone?: string;
  latitude?: number;
  longitude?: number;
  audio_evidence?: string;
  report_count?: number;
}

interface AdminDashboardProps {
  adminId: string;
  adminName: string;
  onLogout: () => void;
  onAddMember: (role: 'admin' | 'health' | 'security', email: string, name: string, password: string) => void;
  onRemoveUser: (userId: string) => void;
  members: Array<{ id: string; name: string; email: string; role: string }>;
  users: Array<{ id: string; name: string }>;
  incidents: Incident[];
  onUpdatePriority: (id: string, sev: 'low' | 'medium' | 'critical') => void;
  onUpdateAuthority: (id: string, authority: 'health' | 'security') => void;
}

export function AdminDashboard({ adminId, adminName, onLogout, onAddMember, onRemoveUser, members, users, incidents, onUpdatePriority, onUpdateAuthority }: AdminDashboardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'health' | 'security'>('health');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const now = new Date().toLocaleString();
  const normalizeSeverity = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'medium') return 'medium';
    return 'low';
  };
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'critical').length;
  const mediumCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'medium').length;
  const lowCount = activeIncidents.filter(i => normalizeSeverity(i.final_severity) === 'low').length;
  const [priorityDraft, setPriorityDraft] = useState<Record<string, string>>({});

  // rest of state logic...

  // Re-strategizing: Update everything from signature down to before `const stats`.
  const handleAddMember = () => {
    if (newMemberName && newMemberEmail && newMemberPassword) {
      onAddMember(newMemberRole, newMemberEmail, newMemberName, newMemberPassword);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveUser = () => {
    if (userToDelete) {
      onRemoveUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: Users, color: 'text-blue-500' },
    { label: 'Active Incidents', value: incidents.filter(i => i.status !== 'resolved').length.toString(), icon: Bell, color: 'text-red-500' },
    { label: 'Critical Severity', value: criticalCount.toString(), icon: AlertCircle, color: 'text-red-600' },
    { label: 'Medium Severity', value: mediumCount.toString(), icon: Clock, color: 'text-yellow-600' },
    { label: 'Low Severity', value: lowCount.toString(), icon: Users, color: 'text-green-600' },
    { label: 'Team Members', value: members.length.toString(), icon: Activity, color: 'text-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-white/80 text-sm">System Administration</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <div className="text-sm">{adminName}</div>
              <p className="text-xs text-white/70">Admin ID: {adminId}</p>
              <p className="text-xs text-white/60">Now: {now}</p>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <div className={stat.color}>{stat.value}</div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-between items-center">
            <h2>Add Member</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-xl">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="health">Health Services</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                  <Button
                    onClick={handleAddMember}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500"
                  >
                    Add Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Users List */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-4">Active Users</h2>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active users</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div>{user.name}</div>
                      <p className="text-sm text-gray-600">ID: {user.id}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl"
                    onClick={() => setUserToDelete(user)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-4">Team Members</h2>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No team members added yet</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      member.role === 'health' ? 'bg-red-100 text-red-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                      {member.role === 'admin' ? <UserPlus className="w-5 h-5" /> :
                        member.role === 'health' ? <Activity className="w-5 h-5" /> :
                          <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <div>{member.name}</div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm px-3 py-1 rounded-full inline-block ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'health' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {member.id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Campus Incidents */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">Active Campus Incidents</h2>
              <span className="text-xs text-gray-500">Updated: {now}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm text-gray-500">Live Updates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No active incidents</p>
                <p className="text-sm text-gray-400">All systems operational</p>
              </div>
            ) : (
              incidents.filter(i => i.status !== 'resolved').map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${incident.authority === 'health' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                        {incident.authority === 'health' ? <Activity className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{incident.type}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>ID: {incident.id}</span>
                          <span>•</span>
                          <span>
                            User: {incident.user_name ? incident.user_name : `#${incident.userId}`}
                            {incident.user_phone ? ` (${incident.user_phone})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${incident.status === 'responding' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {incident.status.toUpperCase()}
                      </span>
                      {incident.final_severity && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${normalizeSeverity(incident.final_severity) === 'critical'
                            ? 'bg-red-500'
                            : normalizeSeverity(incident.final_severity) === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-600'
                            }`}
                        >
                          {normalizeSeverity(incident.final_severity).toUpperCase()}
                        </span>
                      )}
                      {(incident.report_count || 1) > 1 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          {incident.report_count} Reports
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl mb-3 border border-gray-100">
                    <p className="text-gray-700 mb-2"><strong>Report:</strong> {incident.message} {incident.isVoice && "(Voice)"}</p>
                    {incident.officer_message && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-blue-700">
                          <strong className="flex items-center gap-1"><Shield className="w-3 h-3" /> Officer Guidance (AI):</strong> {incident.officer_message}
                        </p>
                      </div>
                    )}
                    {incident.reasoning && (
                      <p className="text-xs text-gray-500 mt-1 italic">Analysis: {incident.reasoning}</p>
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

                    <div className="mt-3">
                      <label className="text-xs text-gray-600">Reassign Authority</label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={incident.authority === 'security' ? 'default' : 'outline'}
                          size="sm"
                          className={`flex-1 rounded-xl ${incident.authority === 'security' ? 'bg-orange-600' : ''}`}
                          onClick={() => onUpdateAuthority(incident.id, 'security')}
                          disabled={incident.authority === 'security'}
                        >
                          <Shield className="w-3 h-3 mr-1" /> Security
                        </Button>
                        <Button
                          variant={incident.authority === 'health' ? 'default' : 'outline'}
                          size="sm"
                          className={`flex-1 rounded-xl ${incident.authority === 'health' ? 'bg-red-600' : ''}`}
                          onClick={() => onUpdateAuthority(incident.id, 'health')}
                          disabled={incident.authority === 'health'}
                        >
                          <Activity className="w-3 h-3 mr-1" /> Health
                        </Button>
                      </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=&layer=c&cbll=${incident.latitude},${incident.longitude}`,
                                '_blank',
                                'noopener'
                              )
                            }
                            className="rounded-xl"
                          >
                            Street View
                          </Button>
                        </div>
                      </div>
                    )}

                    {(() => {
                      if (!incident.audio_evidence) return null;
                      let evidenceList: string[] = [];
                      try {
                        if (incident.audio_evidence.startsWith('[')) {
                          evidenceList = JSON.parse(incident.audio_evidence);
                        } else {
                          evidenceList = [incident.audio_evidence];
                        }
                      } catch {
                        evidenceList = [incident.audio_evidence];
                      }

                      return (
                        <div className="mt-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2">
                          <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Black Box Evidence ({evidenceList.length})
                          </div>
                          {evidenceList.map((url, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-2">
                              <div className="text-xs text-gray-400 mb-1">Clip {idx + 1}</div>
                              <audio controls className="w-full h-8" src={`${API_URL}${url}`} />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Contact User
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
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
                </div>
              ))
            )}
          </div>
        </Card>
      </div >

      {/* Delete Confirmation Dialog */}
      < AlertDialog open={!!userToDelete
      } onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove user <strong>{userToDelete?.name}</strong> (ID: {userToDelete?.id}) from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-red-600 hover:bg-red-700">
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </div >
  );
}
