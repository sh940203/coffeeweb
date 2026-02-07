// Product / Coffee Types
export interface Coffee {
    id: string;
    name: string;
    price_display: string;
    stock: number;
    is_available: boolean;
    image_url: string;
    origin?: string;
    roast_level?: string;
    processing_method?: string; // DB column is 'process' based on setup_full.sql
    process?: string; // Standardize to this
    flavor?: string;
    features?: string;
    sort_order?: number; // Added for sorting
    // Flavor Radar Data
    acid?: number;
    aroma?: number;
    bitter?: number;
    body?: number;
    myship_url?: string;
}

// Order Types
export interface OrderItem {
    id: string;
    coffee: {
        name: string;
        image_url: string;
    };
    quantity: number;
    price_at_time: number;
}

export interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    created_at: string;
    items: OrderItem[];
    user_email?: string;
}

// Cart Types (derived from Coffee but with quantity)
export interface CartItem extends Coffee {
    quantity: number;
}
