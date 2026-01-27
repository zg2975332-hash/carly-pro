import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Car,
  User,
  DollarSign,
  Edit2,
  Save,
  Trash2,
  Check,
} from "lucide-react";
import SectionCard from "@/components/SectionCard";
import CnicImageCard from "@/components/CnicImageCard";
import ImageUploader from "@/components/ImageUploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type CarCondition = Database["public"]["Enums"]["car_condition"];
type SaleStatus = Database["public"]["Enums"]["sale_status"];

interface CarData {
  model: string;
  color: string;
  chassis_number: string;
  engine_number: string;
  registration_number: string;
  condition: CarCondition;
  images: string[];
  notes: string;
  sale_status: SaleStatus;
}

interface BuyerData {
  name: string;
  father_name: string;
  cnic_number: string;
  cnic_front_photo: string;
  cnic_back_photo: string;
  phone: string;
  address: string;
  buying_price: string;
  buying_date: string;
}

interface SellerData {
  name: string;
  father_name: string;
  cnic_number: string;
  cnic_front_photo: string;
  cnic_back_photo: string;
  phone: string;
  city: string;
  address: string;
  selling_price: string;
  selling_date: string;
}

const CarDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [isEditing, setIsEditing] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [carData, setCarData] = useState<CarData>({
    model: "",
    color: "",
    chassis_number: "",
    engine_number: "",
    registration_number: "",
    condition: "good",
    images: [],
    notes: "",
    sale_status: "pending",
  });

  const [buyerData, setBuyerData] = useState<BuyerData>({
    name: "",
    father_name: "",
    cnic_number: "",
    cnic_front_photo: "",
    cnic_back_photo: "",
    phone: "",
    address: "",
    buying_price: "",
    buying_date: "",
  });

  const [sellerData, setSellerData] = useState<SellerData>({
    name: "",
    father_name: "",
    cnic_number: "",
    cnic_front_photo: "",
    cnic_back_photo: "",
    phone: "",
    city: "",
    address: "",
    selling_price: "",
    selling_date: "",
  });

  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Section refs for navigation
  const carSectionRef = useRef<HTMLDivElement>(null);
  const buyerSectionRef = useRef<HTMLDivElement>(null);
  const sellerSectionRef = useRef<HTMLDivElement>(null);
  const financeSectionRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (!isNew && id) {
      fetchCarData();
    }
  }, [id, isNew]);

  const fetchCarData = async () => {
    try {
      const { data: car, error: carError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (carError) throw carError;

      setCarData({
        model: car.model || "",
        color: car.color || "",
        chassis_number: car.chassis_number || "",
        engine_number: car.engine_number || "",
        registration_number: car.registration_number || "",
        condition: car.condition || "good",
        images: car.images || [],
        notes: car.notes || "",
        sale_status: car.sale_status || "pending",
      });

      // Fetch buyer
      const { data: buyer } = await supabase
        .from("buyers")
        .select("*")
        .eq("car_id", id)
        .single();

      if (buyer) {
        setBuyerId(buyer.id);
        setBuyerData({
          name: buyer.name || "",
          father_name: buyer.father_name || "",
          cnic_number: buyer.cnic_number || "",
          cnic_front_photo: buyer.cnic_front_photo || "",
          cnic_back_photo: buyer.cnic_back_photo || "",
          phone: buyer.phone || "",
          address: buyer.address || "",
          buying_price: buyer.buying_price?.toString() || "",
          buying_date: buyer.buying_date || "",
        });
      }

      // Fetch seller
      const { data: seller } = await supabase
        .from("sellers")
        .select("*")
        .eq("car_id", id)
        .single();

      if (seller) {
        setSellerId(seller.id);
        setSellerData({
          name: seller.name || "",
          father_name: seller.father_name || "",
          cnic_number: seller.cnic_number || "",
          cnic_front_photo: seller.cnic_front_photo || "",
          cnic_back_photo: seller.cnic_back_photo || "",
          phone: seller.phone || "",
          city: seller.city || "",
          address: seller.address || "",
          selling_price: seller.selling_price?.toString() || "",
          selling_date: seller.selling_date || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load car data");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("car-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("car-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!carData.model.trim() || !carData.color.trim()) {
      toast.error("Please fill in car model and color");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let carId = id;

      if (isNew) {
        const { data: newCar, error: carError } = await supabase
          .from("cars")
          .insert({
            user_id: user.id,
            model: carData.model,
            color: carData.color,
            chassis_number: carData.chassis_number || null,
            engine_number: carData.engine_number || null,
            registration_number: carData.registration_number || null,
            condition: carData.condition,
            images: carData.images,
            notes: carData.notes || null,
            sale_status: carData.sale_status,
          })
          .select()
          .single();

        if (carError) throw carError;
        carId = newCar.id;
      } else {
        const { error: carError } = await supabase
          .from("cars")
          .update({
            model: carData.model,
            color: carData.color,
            chassis_number: carData.chassis_number || null,
            engine_number: carData.engine_number || null,
            registration_number: carData.registration_number || null,
            condition: carData.condition,
            images: carData.images,
            notes: carData.notes || null,
            sale_status: carData.sale_status,
          })
          .eq("id", id);

        if (carError) throw carError;
      }

      // Save buyer data if name is provided
      if (buyerData.name.trim()) {
        const buyerPayload = {
          car_id: carId,
          name: buyerData.name,
          father_name: buyerData.father_name || null,
          cnic_number: buyerData.cnic_number || null,
          cnic_front_photo: buyerData.cnic_front_photo || null,
          cnic_back_photo: buyerData.cnic_back_photo || null,
          phone: buyerData.phone || null,
          address: buyerData.address || null,
          buying_price: buyerData.buying_price ? parseFloat(buyerData.buying_price) : null,
          buying_date: buyerData.buying_date || null,
        };

        if (buyerId) {
          await supabase.from("buyers").update(buyerPayload).eq("id", buyerId);
        } else {
          const { data: newBuyer } = await supabase
            .from("buyers")
            .insert(buyerPayload)
            .select()
            .single();
          if (newBuyer) setBuyerId(newBuyer.id);
        }
      }

      // Save seller data if name is provided
      if (sellerData.name.trim()) {
        const sellerPayload = {
          car_id: carId,
          name: sellerData.name,
          father_name: sellerData.father_name || null,
          cnic_number: sellerData.cnic_number || null,
          cnic_front_photo: sellerData.cnic_front_photo || null,
          cnic_back_photo: sellerData.cnic_back_photo || null,
          phone: sellerData.phone || null,
          city: sellerData.city || null,
          address: sellerData.address || null,
          selling_price: sellerData.selling_price ? parseFloat(sellerData.selling_price) : null,
          selling_date: sellerData.selling_date || null,
        };

        if (sellerId) {
          await supabase.from("sellers").update(sellerPayload).eq("id", sellerId);
        } else {
          const { data: newSeller } = await supabase
            .from("sellers")
            .insert(sellerPayload)
            .select()
            .single();
          if (newSeller) setSellerId(newSeller.id);
        }
      }

      toast.success(isNew ? "Car added successfully!" : "Record updated successfully");
      setIsEditing(false);
      
      if (isNew) {
        navigate(`/car/${carId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
      toast.success("Car deleted successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to delete car");
    }
  };

  const handleCnicUpload = async (
    type: "buyer" | "seller",
    side: "front" | "back",
    file: File
  ) => {
    try {
      const url = await uploadImage(file);
      if (type === "buyer") {
        setBuyerData((prev) => ({
          ...prev,
          [side === "front" ? "cnic_front_photo" : "cnic_back_photo"]: url,
        }));
      } else {
        setSellerData((prev) => ({
          ...prev,
          [side === "front" ? "cnic_front_photo" : "cnic_back_photo"]: url,
        }));
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const scrollToSection = (index: number) => {
    const refs = [carSectionRef, buyerSectionRef, sellerSectionRef, financeSectionRef];
    refs[index]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(index);
  };

  const profit =
    (parseFloat(sellerData.selling_price) || 0) -
    (parseFloat(buyerData.buying_price) || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {isNew ? "Add New Car" : "Car Details"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Step Navigation */}
      <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex justify-center gap-4 max-w-lg mx-auto">
          {[
            { icon: Car, label: "Car" },
            { icon: User, label: "Buyer" },
            { icon: User, label: "Seller" },
            { icon: DollarSign, label: "Finance" },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(index)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeSection === index
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  activeSection === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-secondary rounded-full max-w-lg mx-auto">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((activeSection + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-32">
        {/* Car Details Section */}
        <div ref={carSectionRef}>
          <SectionCard icon={Car} title="Car Details">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-2 block">Car Model *</Label>
                <Input
                  value={carData.model}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, model: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g., Toyota Corolla 2020"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Color *</Label>
                <Input
                  value={carData.color}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g., Pearl White"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Chassis Number</Label>
                <Input
                  value={carData.chassis_number}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, chassis_number: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter chassis number"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Engine Number</Label>
                <Input
                  value={carData.engine_number}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, engine_number: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter engine number"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Registration Number</Label>
                <Input
                  value={carData.registration_number}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, registration_number: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g., ABC-1234"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Condition</Label>
                <Select
                  value={carData.condition}
                  onValueChange={(value: CarCondition) =>
                    setCarData((prev) => ({ ...prev, condition: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">
                  Car Images ({carData.images.length}/15)
                </Label>
                <ImageUploader
                  images={carData.images}
                  onImagesChange={(images) =>
                    setCarData((prev) => ({ ...prev, images }))
                  }
                  onUpload={uploadImage}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Buyer Details Section */}
        <div ref={buyerSectionRef}>
          <SectionCard icon={User} title="Buyer Details">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-2 block">Buyer Name</Label>
                <Input
                  value={buyerData.name}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter buyer name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Father Name</Label>
                <Input
                  value={buyerData.father_name}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, father_name: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter father name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">CNIC Number</Label>
                <Input
                  value={buyerData.cnic_number}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, cnic_number: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g., 35201-1234567-8"
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CnicImageCard
                  label="CNIC Front"
                  imageUrl={buyerData.cnic_front_photo}
                  onImageChange={(file) => handleCnicUpload("buyer", "front", file)}
                  onRemove={() =>
                    setBuyerData((prev) => ({ ...prev, cnic_front_photo: "" }))
                  }
                  isEditing={isEditing}
                />
                <CnicImageCard
                  label="CNIC Back"
                  imageUrl={buyerData.cnic_back_photo}
                  onImageChange={(file) => handleCnicUpload("buyer", "back", file)}
                  onRemove={() =>
                    setBuyerData((prev) => ({ ...prev, cnic_back_photo: "" }))
                  }
                  isEditing={isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Buying Price (PKR)</Label>
                <Input
                  type="number"
                  value={buyerData.buying_price}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, buying_price: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter buying price"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Buying Date</Label>
                <Input
                  type="date"
                  value={buyerData.buying_date}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, buying_date: e.target.value }))
                  }
                  className="input-premium"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Phone Number</Label>
                <Input
                  value={buyerData.phone}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter phone number"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Address</Label>
                <Textarea
                  value={buyerData.address}
                  onChange={(e) =>
                    setBuyerData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="input-premium min-h-[80px]"
                  placeholder="Enter full address"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Seller Details Section */}
        <div ref={sellerSectionRef}>
          <SectionCard icon={User} title="Seller Details">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-2 block">Seller Name</Label>
                <Input
                  value={sellerData.name}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter seller name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Father Name</Label>
                <Input
                  value={sellerData.father_name}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, father_name: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter father name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">CNIC Number</Label>
                <Input
                  value={sellerData.cnic_number}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, cnic_number: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g., 35201-1234567-8"
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CnicImageCard
                  label="CNIC Front"
                  imageUrl={sellerData.cnic_front_photo}
                  onImageChange={(file) => handleCnicUpload("seller", "front", file)}
                  onRemove={() =>
                    setSellerData((prev) => ({ ...prev, cnic_front_photo: "" }))
                  }
                  isEditing={isEditing}
                />
                <CnicImageCard
                  label="CNIC Back"
                  imageUrl={sellerData.cnic_back_photo}
                  onImageChange={(file) => handleCnicUpload("seller", "back", file)}
                  onRemove={() =>
                    setSellerData((prev) => ({ ...prev, cnic_back_photo: "" }))
                  }
                  isEditing={isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Selling Price (PKR)</Label>
                <Input
                  type="number"
                  value={sellerData.selling_price}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, selling_price: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter selling price"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Selling Date</Label>
                <Input
                  type="date"
                  value={sellerData.selling_date}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, selling_date: e.target.value }))
                  }
                  className="input-premium"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Phone Number</Label>
                <Input
                  value={sellerData.phone}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter phone number"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">City</Label>
                <Input
                  value={sellerData.city}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="Enter city"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Address</Label>
                <Textarea
                  value={sellerData.address}
                  onChange={(e) =>
                    setSellerData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="input-premium min-h-[80px]"
                  placeholder="Enter full address"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Finance Section */}
        <div ref={financeSectionRef}>
          <SectionCard icon={DollarSign} title="Finance & Status">
            <div className="space-y-4">
              {/* Profit Summary */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Calculated Profit</p>
                <p
                  className={`text-3xl font-bold ${
                    profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {profit >= 0 ? "+" : ""}
                  {profit.toLocaleString()} PKR
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Selling Price - Buying Price
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Sale Status</Label>
                <Select
                  value={carData.sale_status}
                  onValueChange={(value: SaleStatus) =>
                    setCarData((prev) => ({ ...prev, sale_status: value }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Notes</Label>
                <Textarea
                  value={carData.notes}
                  onChange={(e) =>
                    setCarData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="input-premium min-h-[100px]"
                  placeholder="Add any additional notes..."
                  disabled={!isEditing}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </main>

      {/* Bottom Action Bar */}
      {isEditing && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-4 safe-bottom"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          <div className="flex gap-3 max-w-lg mx-auto">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  fetchCarData();
                }}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-gold h-12 rounded-xl text-base font-semibold"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isNew ? "Save Car" : "Update Record"}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this car?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the car record including buyer and seller
              information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CarDetails;