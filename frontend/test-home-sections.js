const http = require('http');

const API_URL = 'http://nginx/api';

async function test() {
    console.log('Starting verification...');

    // 4. Verify Home Page Data Logic (Frontend Fetch)
    console.log('\nVerifying Home Page Data Fetch...');

    // Fetch products
    const productsRes = await fetch(API_URL + '/products?per_page=100');
    const productsData = await productsRes.json();
    const allProducts = productsData.data.data;

    // Filter logic from frontend
    const featured = allProducts.filter(p => p.is_featured);
    const bestDeals = allProducts.filter(p => p.discount_price && Number(p.discount_price) < Number(p.price));

    console.log('Found Featured Products:', featured.length);
    // Determine if our seeded product is there (we can't know the ID easily without passing it, but explicit count > 0 is good start)
    const hasFeatured = featured.some(p => p.name === 'Featured Product');
    console.log(' - Verify Featured Product Exists:', hasFeatured ? 'PASS' : 'FAIL');

    console.log('Found Best Deals:', bestDeals.length);
    const hasDeal = bestDeals.some(p => p.name === 'Discounted Product');
    console.log(' - Verify Discounted Product Exists:', hasDeal ? 'PASS' : 'FAIL');

    if (hasFeatured && hasDeal) {
        console.log('\nSUCCESS: Backend logic for Featured and Best Deals is working.');
    } else {
        console.log('\nFAILURE: Could not verify data logic.');
        process.exit(1);
    }
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
