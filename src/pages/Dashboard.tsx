import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Car,
  Bell,
  Settings,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface CarRecord {
  id: string;
  model: string;
  color: string;
  images: string[];
  sale_status: string;
  created_at: string;
  buyers: { buying_price: number | null }[];
  sellers: { selling_price: number | null }[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchCars();
      fetchUnreadNotifications();
    }
  }, [user]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(`id, model, color, images, sale_status, created_at, buyers (buying_price), sellers (selling_price)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch {
      toast.error("Failed to load cars");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      setUnreadNotifications(count || 0);
    } catch {
      // Silently fail
    }
  };

  const filteredCars = cars.filter(
    (car) =>
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCars = cars.length;
  const pendingCars = cars.filter((c) => c.sale_status === "pending").length;
  const soldCars = cars.filter((c) => c.sale_status === "sold").length;

  const calculateProfit = (car: CarRecord) => {
    const buyingPrice = car.buyers?.[0]?.buying_price || 0;
    const sellingPrice = car.sellers?.[0]?.selling_price || 0;
    return sellingPrice - buyingPrice;
  };

  const totalProfit = cars
    .filter((c) => c.sale_status === "sold")
    .reduce((sum, car) => sum + calculateProfit(car), 0);

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <motion.header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-display text-gold">Malik Collection</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")} className="relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{unreadNotifications}</span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <motion.div className="relative mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input type="text" placeholder="Search cars..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-premium pl-12 h-12" />
        </motion.div>

        <motion.div className="grid grid-cols-2 gap-3 mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Car className="w-5 h-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{totalCars}</p><p className="text-xs text-muted-foreground">Total Cars</p></div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-success" /></div>
              <div><p className="text-2xl font-bold text-success">{totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Profit</p></div>
            </div>
          </div>
          <div className="glass-card p-4"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" /><span className="text-sm text-muted-foreground">Pending:</span><span className="font-semibold">{pendingCars}</span></div></div>
          <div className="glass-card p-4"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /><span className="text-sm text-muted-foreground">Sold:</span><span className="font-semibold">{soldCars}</span></div></div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button onClick={() => navigate("/car/new")} className="w-full btn-gold h-14 rounded-xl text-base font-semibold mb-6"><Plus className="w-5 h-5 mr-2" />Add New Car</Button>
        </motion.div>

        <motion.div className="space-y-3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-semibold mb-3">Your Cars</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="glass-card p-4 animate-pulse"><div className="flex gap-4"><div className="w-20 h-20 rounded-lg bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div></div></div>))}</div>
          ) : filteredCars.length === 0 ? (
            <div className="glass-card p-8 text-center"><Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">{searchQuery ? "No cars found" : "No cars added yet"}</p></div>
          ) : (
            filteredCars.map((car, index) => (
              <motion.div key={car.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * index }} onClick={() => navigate(`/car/${car.id}`)} className="glass-card p-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">{car.images?.[0] ? <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-muted-foreground" /></div>}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold truncate">{car.model}</h3><p className="text-sm text-muted-foreground">{car.color}</p></div><ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" /></div>
                    <div className="flex items-center gap-2 mt-2"><span className={`text-xs px-2 py-0.5 rounded-full ${car.sale_status === "sold" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{car.sale_status}</span>{car.sale_status === "sold" && <span className="text-xs text-success">+{calculateProfit(car).toLocaleString()}</span>}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;