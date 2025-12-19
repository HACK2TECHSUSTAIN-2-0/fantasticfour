import React, { useState } from 'react';
import { UserPlus, Users, Activity, Shield, LogOut, Settings, Bell, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
}

export function AdminDashboard({ adminId, adminName, onLogout, onAddMember, onRemoveUser, members, users, incidents }: AdminDashboardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'health' | 'security'>('health');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  // ... (rest of state logic is same, ignoring it in replace as I can't match it easily if not careful)
  // Instead, I'll update the Stats and then later add the card.

  // Actually, let's just update the signature line in this call, and do a separate call for the JSX.
  // Wait, I can only target contiguous blocks.

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
    { label: 'Health Staff', value: members.filter(m => m.role === 'health').length.toString(), icon: Activity, color: 'text-pink-500' },
    { label: 'Security Staff', value: members.filter(m => m.role === 'security').length.toString(), icon: Shield, color: 'text-orange-500' },
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Quick Actions */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2>Quick Actions</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-sm">View Analytics</div>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
              <Bell className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm">Manage Alerts</div>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all">
              <Settings className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm">System Settings</div>
            </button>
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
            <h2 className="text-xl font-bold">Active Campus Incidents</h2>
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
                          <span>User: {incident.userId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${incident.status === 'responding' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {incident.status.toUpperCase()}
                      </span>
                      {incident.final_severity && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${incident.final_severity === 'HIGH' || incident.final_severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                          {incident.final_severity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Contact User
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Activity className="w-4 h-4 mr-2" />
                      View Location
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
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
      </AlertDialog>
    </div>
  );
}