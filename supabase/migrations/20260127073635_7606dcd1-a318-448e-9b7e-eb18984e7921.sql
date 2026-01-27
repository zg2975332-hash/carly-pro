-- Create enum for car conditions
CREATE TYPE public.car_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

-- Create enum for sale status
CREATE TYPE public.sale_status AS ENUM ('pending', 'sold', 'cancelled');

-- Create cars table
CREATE TABLE public.cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    chassis_number TEXT,
    engine_number TEXT,
    registration_number TEXT,
    condition car_condition DEFAULT 'good',
    images TEXT[] DEFAULT '{}',
    notes TEXT,
    sale_status sale_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buyers table
CREATE TABLE public.buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    cnic_number TEXT,
    cnic_front_photo TEXT,
    cnic_back_photo TEXT,
    phone TEXT,
    address TEXT,
    buying_price NUMERIC(12,2),
    buying_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sellers table
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    cnic_number TEXT,
    cnic_front_photo TEXT,
    cnic_back_photo TEXT,
    phone TEXT,
    city TEXT,
    address TEXT,
    selling_price NUMERIC(12,2),
    selling_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inquiries table for push notifications
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('general', 'price', 'availability', 'test_drive')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment', 'reminder', 'inquiry', 'sale')),
    is_read BOOLEAN DEFAULT false,
    related_car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push_subscriptions table for web push
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for cars
CREATE POLICY "Users can view their own cars"
ON public.cars FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cars"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
ON public.cars FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
ON public.cars FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for buyers (through car ownership)
CREATE POLICY "Users can view buyers of their cars"
ON public.buyers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = buyers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can create buyers for their cars"
ON public.buyers FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = buyers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can update buyers of their cars"
ON public.buyers FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = buyers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can delete buyers of their cars"
ON public.buyers FOR DELETE
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = buyers.car_id AND cars.user_id = auth.uid()));

-- RLS policies for sellers (through car ownership)
CREATE POLICY "Users can view sellers of their cars"
ON public.sellers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = sellers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can create sellers for their cars"
ON public.sellers FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = sellers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can update sellers of their cars"
ON public.sellers FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = sellers.car_id AND cars.user_id = auth.uid()));

CREATE POLICY "Users can delete sellers of their cars"
ON public.sellers FOR DELETE
USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = sellers.car_id AND cars.user_id = auth.uid()));

-- RLS policies for inquiries
CREATE POLICY "Users can view their own inquiries"
ON public.inquiries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries"
ON public.inquiries FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
BEFORE UPDATE ON public.buyers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);

-- Storage policies for car images
CREATE POLICY "Anyone can view car images"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-images');

CREATE POLICY "Authenticated users can upload car images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own car images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own car images"
ON storage.objects FOR DELETE
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');