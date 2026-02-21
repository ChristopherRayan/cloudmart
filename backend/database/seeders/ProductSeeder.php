<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Groceries & Food (category_id = 1) - Enhanced with images
            [
                'category_id' => 1, 
                'name' => 'Premium White Rice 5kg', 
                'slug' => 'premium-white-rice-5kg', 
                'description' => 'High-quality long-grain white rice, 5kg bag. Perfect for daily meals and special occasions.', 
                'price' => 8500.00, 
                'stock_quantity' => 50,
                'image_url' => 'https://images.unsplash.com/photo-1589985270958-42453899c9cc?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Sunflower Cooking Oil 2L', 
                'slug' => 'sunflower-cooking-oil-2l', 
                'description' => 'Pure sunflower cooking oil, 2-litre bottle. Ideal for frying and cooking.', 
                'price' => 6500.00, 
                'stock_quantity' => 40,
                'image_url' => 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Fresh White Bread Loaf', 
                'slug' => 'fresh-white-bread-loaf', 
                'description' => 'Freshly baked white bread loaf, soft texture. Baked daily for maximum freshness.', 
                'price' => 2500.00, 
                'stock_quantity' => 100,
                'image_url' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Farm Fresh Eggs 1 Dozen', 
                'slug' => 'farm-fresh-eggs-1-dozen', 
                'description' => 'Large fresh farm eggs, pack of 12. Grade A quality from local farms.', 
                'price' => 2800.00, 
                'stock_quantity' => 80,
                'image_url' => 'https://images.unsplash.com/photo-1603560342586-4e93aa1d43d3?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Full Cream Milk 1L', 
                'slug' => 'full-cream-milk-1l', 
                'description' => 'Long-life full cream milk, 1-litre carton. Rich and creamy for your daily needs.', 
                'price' => 1800.00, 
                'stock_quantity' => 120,
                'image_url' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Iodized Table Salt 1kg', 
                'slug' => 'iodized-table-salt-1kg', 
                'description' => 'Premium iodized table salt, 1kg bag. Essential for cooking and seasoning.', 
                'price' => 800.00, 
                'stock_quantity' => 200,
                'image_url' => 'https://images.unsplash.com/photo-1518057111178-44a1676bd6d0?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'Sugar 2kg', 
                'slug' => 'sugar-2kg', 
                'description' => 'Pure white granulated sugar, 2kg bag. Perfect for baking and sweetening.', 
                'price' => 2200.00, 
                'stock_quantity' => 150,
                'image_url' => 'https://images.unsplash.com/photo-1589381307767-7c520832a120?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 1, 
                'name' => 'All-Purpose Flour 2kg', 
                'slug' => 'all-purpose-flour-2kg', 
                'description' => 'High-quality all-purpose flour, 2kg bag. Perfect for baking bread, cakes, and pastries.', 
                'price' => 1500.00, 
                'stock_quantity' => 180,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop'
            ],

            // Stationery & Books (category_id = 2) - Enhanced with images
            [
                'category_id' => 2, 
                'name' => 'Premium A4 Notebook 96 Pages', 
                'slug' => 'premium-a4-notebook-96', 
                'description' => 'High-quality ruled A4 notebook with 96 pages. Durable cover and smooth paper.', 
                'price' => 3000.00, 
                'stock_quantity' => 200,
                'image_url' => 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'Blue Ballpoint Pen Pack (10)', 
                'slug' => 'blue-ballpoint-pen-pack-10', 
                'description' => 'Smooth-writing blue ballpoint pens, pack of 10. Reliable for daily use.', 
                'price' => 2000.00, 
                'stock_quantity' => 150,
                'image_url' => 'https://images.unsplash.com/photo-1621675932043-352d80039c01?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'Casio FX-991 Scientific Calculator', 
                'slug' => 'casio-fx-991-scientific-calculator', 
                'description' => 'Advanced scientific calculator for engineering students. Multiple functions and solar power.', 
                'price' => 35000.00, 
                'stock_quantity' => 25,
                'image_url' => 'https://images.unsplash.com/photo-1591308117545-40b3c03e53f1?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'HB Pencil Pack (12)', 
                'slug' => 'hb-pencil-pack-12', 
                'description' => 'Standard HB graphite pencils, pack of 12. Perfect for writing and sketching.', 
                'price' => 1500.00, 
                'stock_quantity' => 100,
                'image_url' => 'https://images.unsplash.com/photo-1624478717440-20a6f01e34e1?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'Heavy-Duty Stapler & Staples Set', 
                'slug' => 'heavy-duty-stapler-staples-set', 
                'description' => 'Professional handheld stapler with 1000 standard staples. Durable construction.', 
                'price' => 5500.00, 
                'stock_quantity' => 60,
                'image_url' => 'https://images.unsplash.com/photo-1626785774170-70003b3b40ac?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'Permanent Markers Set (5)', 
                'slug' => 'permanent-markers-set-5', 
                'description' => 'Assorted colors permanent markers, set of 5. Water-resistant and long-lasting.', 
                'price' => 4500.00, 
                'stock_quantity' => 80,
                'image_url' => 'https://images.unsplash.com/photo-1629429407759-0d165f3dc0f4?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 2, 
                'name' => 'A4 Paper Ream (500 Sheets)', 
                'slug' => 'a4-paper-ream-500', 
                'description' => 'High-quality A4 paper, 500 sheets per ream. Bright white and smooth finish.', 
                'price' => 8500.00, 
                'stock_quantity' => 120,
                'image_url' => 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=400&fit=crop'
            ],

            // Electronics & Accessories (category_id = 3) - Enhanced with images
            [
                'category_id' => 3, 
                'name' => 'USB-C Fast Charger Cable 1.5m', 
                'slug' => 'usb-c-fast-charger-cable-1-5m', 
                'description' => 'Premium braided USB-C fast-charging cable, 1.5m length. Supports fast charging and data transfer.', 
                'price' => 5000.00, 
                'stock_quantity' => 80,
                'image_url' => 'https://images.unsplash.com/photo-1606220945770-b5b9df0d5e9d?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Wireless Bluetooth Earbuds', 
                'slug' => 'wireless-bluetooth-earbuds', 
                'description' => 'Bluetooth 5.0 wireless earbuds with charging case. Crystal clear sound and comfortable fit.', 
                'price' => 25000.00, 
                'stock_quantity' => 30,
                'image_url' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Tempered Glass Screen Protector', 
                'slug' => 'tempered-glass-screen-protector', 
                'description' => 'Premium tempered glass screen protector, universal fit. 9H hardness and oleophobic coating.', 
                'price' => 3500.00, 
                'stock_quantity' => 120,
                'image_url' => 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Power Bank 10,000mAh', 
                'slug' => 'power-bank-10000mah', 
                'description' => 'Portable power bank with 10,000mAh capacity and dual USB ports. Fast charging capability.', 
                'price' => 18500.00, 
                'stock_quantity' => 45,
                'image_url' => 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Wireless Ergonomic Mouse', 
                'slug' => 'wireless-ergonomic-mouse', 
                'description' => 'Ergonomic wireless optical mouse for laptops. Comfortable design with precise tracking.', 
                'price' => 12000.00, 
                'stock_quantity' => 55,
                'image_url' => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Phone Charging Stand', 
                'slug' => 'phone-charging-stand', 
                'description' => 'Wireless charging stand compatible with Qi-enabled devices. Elegant design with LED indicator.', 
                'price' => 15500.00, 
                'stock_quantity' => 35,
                'image_url' => 'https://images.unsplash.com/photo-1606220945770-b5b9df0d5e9d?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 3, 
                'name' => 'Bluetooth Speaker 10W', 
                'slug' => 'bluetooth-speaker-10w', 
                'description' => 'Portable Bluetooth speaker with 10W output. 12-hour battery life and waterproof design.', 
                'price' => 22000.00, 
                'stock_quantity' => 40,
                'image_url' => 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop'
            ],

            // Personal Care (category_id = 4) - Enhanced with images
            [
                'category_id' => 4, 
                'name' => 'Refreshing Shower Gel 400ml', 
                'slug' => 'refreshing-shower-gel-400ml', 
                'description' => 'Refreshing shower gel, 400ml bottle. Leaves skin clean and moisturized with long-lasting fragrance.', 
                'price' => 4500.00, 
                'stock_quantity' => 60,
                'image_url' => 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => 'Fluoride Toothpaste 100ml', 
                'slug' => 'fluoride-toothpaste-100ml', 
                'description' => 'Fluoride toothpaste for cavity protection, 100ml. Fresh mint flavor and advanced cleaning formula.', 
                'price' => 2500.00, 
                'stock_quantity' => 90,
                'image_url' => 'https://images.unsplash.com/photo-1584302179602-e7c483a5e1f9?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => '48-Hour Roll-on Deodorant', 
                'slug' => '48-hour-roll-on-deodorant', 
                'description' => 'Long-lasting 48-hour protection roll-on deodorant. Fresh scent and gentle on skin.', 
                'price' => 3000.00, 
                'stock_quantity' => 75,
                'image_url' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => 'Alcohol Hand Sanitizer 500ml', 
                'slug' => 'alcohol-hand-sanitizer-500ml', 
                'description' => 'Alcohol-based hand sanitizer with aloe vera, 500ml. Kills 99.9% of germs and moisturizes skin.', 
                'price' => 4000.00, 
                'stock_quantity' => 110,
                'image_url' => 'https://images.unsplash.com/photo-1584997159253-7b6001b661a4?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => 'Antibacterial Liquid Hand Soap 250ml', 
                'slug' => 'antibacterial-liquid-hand-soap-250ml', 
                'description' => 'Antibacterial liquid hand soap with honey & milk scent, 250ml. Gentle cleansing with moisturizing properties.', 
                'price' => 2200.00, 
                'stock_quantity' => 95,
                'image_url' => 'https://images.unsplash.com/photo-1584302179602-e7c483a5e1f9?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => 'Moisturizing Body Lotion 200ml', 
                'slug' => 'moisturizing-body-lotion-200ml', 
                'description' => 'Rich moisturizing body lotion, 200ml. Deeply hydrates and nourishes dry skin.', 
                'price' => 3800.00, 
                'stock_quantity' => 65,
                'image_url' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 4, 
                'name' => 'Sunscreen SPF 50 100ml', 
                'slug' => 'sunscreen-spf-50-100ml', 
                'description' => 'Broad spectrum sunscreen SPF 50, 100ml. Water-resistant and suitable for all skin types.', 
                'price' => 5500.00, 
                'stock_quantity' => 50,
                'image_url' => 'https://images.unsplash.com/photo-1594436870527-9e83a1f104b7?w=400&h=400&fit=crop'
            ],

            // Beverages & Snacks (category_id = 5) - Enhanced with images
            [
                'category_id' => 5, 
                'name' => 'Classic Coca-Cola 500ml', 
                'slug' => 'classic-coca-cola-500ml', 
                'description' => 'Classic Coca-Cola, 500ml PET bottle. The original refreshing cola taste.', 
                'price' => 1500.00, 
                'stock_quantity' => 200,
                'image_url' => 'https://images.unsplash.com/photo-1587500154541-1cafd74f0efc?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => 'Pure Still Drinking Water 1.5L', 
                'slug' => 'pure-still-drinking-water-1-5l', 
                'description' => 'Pure still drinking water, 1.5 litre. Natural spring water for daily hydration.', 
                'price' => 1000.00, 
                'stock_quantity' => 300,
                'image_url' => 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => 'Crispy Salted Potato Chips 150g', 
                'slug' => 'crispy-salted-potato-chips-150g', 
                'description' => 'Crispy salted potato chips, 150g bag. Perfectly seasoned and satisfying crunch.', 
                'price' => 2000.00, 
                'stock_quantity' => 100,
                'image_url' => 'https://images.unsplash.com/photo-1626082927389-6cd097cee6a6?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => '100% Pure Orange Juice 1L', 
                'slug' => '100-pure-orange-juice-1l', 
                'description' => '100% pure orange juice, no added sugar, 1 litre. Fresh squeezed taste with vitamin C.', 
                'price' => 3500.00, 
                'stock_quantity' => 85,
                'image_url' => 'https://images.unsplash.com/photo-1603560342586-4e93aa1d43d3?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => 'Classic Oreo Biscuits 150g', 
                'slug' => 'classic-oreo-biscuits-150g', 
                'description' => 'Classic chocolate sandwich cookies with cream filling, 150g. The beloved twist, lick, and dunk experience.', 
                'price' => 1800.00, 
                'stock_quantity' => 140,
                'image_url' => 'https://images.unsplash.com/photo-1576502200916-380a135a6c40?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => 'Chocolate Bar 80g', 
                'slug' => 'chocolate-bar-80g', 
                'description' => 'Rich milk chocolate bar, 80g. Smooth and creamy with perfect sweetness.', 
                'price' => 1200.00, 
                'stock_quantity' => 160,
                'image_url' => 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=400&fit=crop'
            ],
            [
                'category_id' => 5, 
                'name' => 'Green Tea 20 Bags', 
                'slug' => 'green-tea-20-bags', 
                'description' => 'Premium green tea bags, pack of 20. Antioxidant-rich with refreshing natural flavor.', 
                'price' => 2800.00, 
                'stock_quantity' => 75,
                'image_url' => 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=400&fit=crop'
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
