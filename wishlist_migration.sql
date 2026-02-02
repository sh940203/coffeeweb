-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    product_id UUID REFERENCES coffees(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own wishlist" 
ON wishlists FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlist" 
ON wishlists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlist" 
ON wishlists FOR DELETE 
USING (auth.uid() = user_id);

-- Add simple index for performance
CREATE INDEX IF NOT EXISTS wishlist_user_id_idx ON wishlists(user_id);
