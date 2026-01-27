import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  BellOff,
  User,
  LogOut,
  Shield,
  Smartphone,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single();

      setProfile(data);
    } catch (error) {
      // Silently fail
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Section */}
        <motion.div
          className="glass-card p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{profile?.full_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.phone || "No phone"}</p>
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          className="glass-card p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Notifications
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  {isSubscribed ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label htmlFor="push-notifications" className="font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {!isSupported
                      ? "Not supported in this browser"
                      : permission === "denied"
                      ? "Blocked in browser settings"
                      : isSubscribed
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={toggleNotifications}
                disabled={loading || !isSupported || permission === "denied"}
              />
            </div>

            {isSubscribed && (
              <div className="pl-13 text-sm text-muted-foreground">
                <p>You'll receive alerts for:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pending payment reminders</li>
                  <li>Sale status updates</li>
                  <li>New customer inquiries</li>
                </ul>
              </div>
            )}
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          className="glass-card p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            App Info
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <span>Version</span>
              </div>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span>Security</span>
              </div>
              <span className="text-success text-sm">Protected</span>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;