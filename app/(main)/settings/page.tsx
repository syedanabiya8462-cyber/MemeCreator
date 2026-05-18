'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Upload, Key, Bell, Shield, Palette, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  })
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    emailNotifications: true,
    publicProfile: true,
    showWatermark: false
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (data) {
      setProfile({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      })
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('users')
      .update({
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        updated_at: new Date()
      })
      .eq('id', user?.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Profile updated successfully!')
    }

    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success('Avatar updated!')
    } catch (error) {
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully!')
      setPasswordData({ current: '', new: '', confirm: '' })
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Logged out successfully')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      // Delete user data first
      await supabase.from('users').delete().eq('id', user?.id)
      await supabase.auth.signOut()
      router.push('/')
      toast.success('Account deleted')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Key className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-destructive">
            Danger
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.display_name?.[0] || profile.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="relative">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 5MB
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Change your password and manage email settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold mb-2">Email Address</h3>
                <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
                <Button variant="outline" disabled>
                  Change Email (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme by default</p>
                </div>
                <Switch
                  checked={preferences.theme === 'dark'}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, theme: checked ? 'dark' : 'light' })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about your memes</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                </div>
                <Switch
                  checked={preferences.publicProfile}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, publicProfile: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Watermark on Exports</p>
                  <p className="text-sm text-muted-foreground">Add MemeMaster watermark to downloaded memes</p>
                </div>
                <Switch
                  checked={preferences.showWatermark}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, showWatermark: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions - proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Log out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}