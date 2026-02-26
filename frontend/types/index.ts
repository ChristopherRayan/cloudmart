export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    profile_image?: string;
    profile_image_url?: string;
    address?: string;
    role: 'customer' | 'admin' | 'delivery_staff';
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    products_count?: number;
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    discount_price: number | null;
    discount_end_at?: string | null;
    stock_quantity: number;
    image_url: string | null;
    is_active: boolean;
    is_featured: boolean;
    category?: Category;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: number;
    cart_id: number;
    product_id: number;
    quantity: number;
    price: number;
    product: Product;
    subtotal?: number;
}

export interface Cart {
    id: number;
    user_id: number;
    status: 'active' | 'abandoned' | 'converted';
    items: CartItem[];
}

export interface CartResponse {
    cart: Cart;
    total_items: number;
    total_amount: number;
}

export interface DeliveryLocation {
    id: number;
    name: string;
    code: string;
    description: string | null;
    address?: string | null;
    polygon_coords: Array<{ lat: number; lng: number }>;
    latitude: number | null;
    longitude: number | null;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
    subtotal: number;
    product: Product;
}

export interface Delivery {
    id: number;
    order_id: number;
    delivery_person_id: number;
    collector_phone: string | null;
    status: 'assigned' | 'in_transit' | 'delivered' | 'failed';
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    notes: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    delivery_person?: User;
    order?: Order;
}

export interface Order {
    id: number;
    order_id: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    order_items_count?: number;
    delivery_code?: string;
    delivery_status?: 'pending' | 'out_for_delivery' | 'delivered';
    delivered_at?: string | null;
    delivered_by?: number | null;
    user_id: number;
    delivery_location_id: number;
    total_amount: number;
    status: 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'completed' | 'failed';
    payment_method: string | null;
    transaction_reference: string | null;
    notes: string | null;
    user?: User;
    delivery_location?: DeliveryLocation;
    order_items?: OrderItem[];
    delivery?: Delivery;
    created_at: string;
    updated_at: string;
}

export interface GeofenceResult {
    isValid: boolean;
    zoneName: string | null;
    zoneId: number | null;
    nearestZone: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
}

export interface Analytics {
    total_orders: number;
    orders_today: number;
    orders_this_month: number;
    revenue_today: number;
    revenue_this_month: number;
    total_revenue: number;
    total_users: number;
    total_products: number;
    low_stock_products: number;
    orders_by_status: Record<string, number>;
    recent_orders: Order[];
}
