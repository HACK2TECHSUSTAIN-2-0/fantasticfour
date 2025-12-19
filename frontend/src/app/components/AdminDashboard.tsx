import React, { useState } from 'react';
import { UserPlus, Users, Activity, Shield, LogOut, Settings, Bell, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AdminDashboardProps {
  adminId: string;
  adminName: string;
  onLogout: () => void;
  onAddMember: (role: 'admin' | 'health' | 'security', email: string, name: string, password: string) => void;
  onRemoveUser: (userId: string) => void;
  members: Array<{ id: string; name: string; email: string; role: string }>;
  users: Array<{ id: string; name: string }>;
}

export function AdminDashboard({ adminId, adminName, onLogout, onAddMember, onRemoveUser, members, users }: AdminDashboardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'health' | 'security'>('health');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

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
    { label: 'Active Incidents', value: '3', icon: Bell, color: 'text-red-500' },
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
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
                    <div className={`text-sm px-3 py-1 rounded-full inline-block ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
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

        {/* Recent Activity */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-start p-3 bg-blue-50 rounded-xl">
              <Bell className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm">New SOS Alert Received</div>
                <p className="text-xs text-gray-600">Medical emergency reported in Building A</p>
                <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-green-50 rounded-xl">
              <UserPlus className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm">New User Registered</div>
                <p className="text-xs text-gray-600">User joined Campus Safety network</p>
                <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
              </div>
            </div>
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