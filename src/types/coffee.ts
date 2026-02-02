export interface Coffee {
    id: string;
    name: string;
    origin?: string;
    process?: string;
    roast_level?: string;
    flavor?: string;
    features?: string;
    price_display?: string;
    myship_url?: string;
    image_url?: string;
    is_available: boolean;
    sort_order: number;
    stock?: number;
    acid?: number;
    aroma?: number;
    bitter?: number;
    body?: number;
}
