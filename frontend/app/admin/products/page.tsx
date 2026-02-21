'use client';

import { useState, useEffect } from 'react';
import api, { apiGet } from '@/lib/api';
import { ApiResponse, Product } from '@/types';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);

    // Modal & Form State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', discount_price: '', stock_quantity: '', category_id: '', image_url: '', is_active: true, is_featured: false
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiGet<ApiResponse<{ data: Product[] }>>('/products?per_page=100', { cacheTtlMs: 15000 });
            setProducts(res.data.data.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiGet('/categories', { cacheTtlMs: 300000 });
            setCategories(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleOpenProductModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                discount_price: product.discount_price ? product.discount_price.toString() : '',
                stock_quantity: product.stock_quantity.toString(),
                category_id: product.category_id.toString(),
                image_url: product.image_url || '',
                is_active: product.is_active,
                is_featured: product.is_featured
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '', description: '', price: '', discount_price: '', stock_quantity: '',
                category_id: categories[0]?.id?.toString() || '', image_url: '', is_active: true, is_featured: false
            });
            setSelectedImage(null);
            setImagePreview(null);
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
                stock_quantity: parseInt(formData.stock_quantity),
                category_id: parseInt(formData.category_id),
                slug,
                // If a file is selected, we clear the image_url to prevent the manual URL from persisting
                // The image upload will happen after creation/update and set the correct URL
                image_url: selectedImage ? '' : formData.image_url
            };

            let productId: number;

            if (editingProduct) {
                const response = await api.put(`/products/${editingProduct.id}`, payload);
                productId = editingProduct.id;
                toast.success('Product updated');
            } else {
                const response = await api.post('/products', payload);
                productId = response.data.data.id;
                toast.success('Product created');
            }

            // Upload image if selected
            if (selectedImage && productId) {
                await uploadProductImage(productId);
            }

            setIsProductModalOpen(false);
            fetchProducts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleProduct = async (product: Product) => {
        try {
            await api.put(`/products/${product.id}`, { is_active: !product.is_active });
            toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'}`);
            fetchProducts();
        } catch (err) { toast.error('Failed to update product'); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setSelectedImage(file);
        // Clear manual URL to avoid confusion and ensure file takes precedence
        setFormData(prev => ({ ...prev, image_url: '' }));
        toast.success('Image selected. Save product to upload.');
    };

    const uploadProductImage = async (productId: number) => {
        if (!selectedImage) return;

        setImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            const response = await api.post(`/products/${productId}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                toast.success('Product image uploaded successfully!');
                setSelectedImage(null);
                setImagePreview(null);
                return response.data.data.image_url;
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setImageUploading(false);
        }
    };

    const seedProducts = async () => {
        try {
            // This would call a seeding endpoint or perform the seeding logic
            // For now, we'll just refresh the product list
            await fetchProducts();
            return 'Products seeded successfully';
        } catch (error) {
            throw new Error('Failed to seed products');
        }
    };

    if (loading && !isProductModalOpen && products.length === 0)
        return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-dark-100">Product Inventory</h1>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const seededProducts = await api.post('/seed/products');
                                if (seededProducts.data.success) {
                                    toast.success('Products seeded successfully!');
                                    fetchProducts();
                                }
                            } catch (error) {
                                toast.error('Failed to seed products');
                            }
                        }}
                        disabled={products.length > 0}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${products.length > 0 ? 'bg-dark-800 text-dark-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                        {products.length > 0 ? 'Products Ready' : 'Seed Products'}
                    </button>
                    <button onClick={() => handleOpenProductModal()} className="btn-primary flex items-center gap-2">
                        <span>➕</span> Add Product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1">
                        <div className="aspect-video bg-dark-800 relative overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${product.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-dark-100 line-clamp-1">{product.name}</h3>
                                <p className="font-bold text-primary-400">MWK {Number(product.price).toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm text-dark-400 mb-4">
                                <span>Stock: <span className={product.stock_quantity < 10 ? 'text-red-400 font-bold' : 'text-dark-200'}>{product.stock_quantity}</span></span>
                                <span>{product.category?.name}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleProduct(product)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border
                                    ${product.is_active
                                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                                >
                                    {product.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleOpenProductModal(product)}
                                    className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-dark-600 text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200">
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 border-dark-700">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit z-10 py-2 border-b border-dark-700/50">
                            <h2 className="text-xl font-bold text-dark-100">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-dark-400 hover:text-white transition-colors text-2xl">✕</button>
                        </div>
                        {/* Same form as before */}
                        <form onSubmit={handleSaveProduct} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Product Name</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="label">Category</label>
                                    <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="input-field" required>
                                        <option value="">Select Category</option>
                                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Price (MWK)</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="input-field" min="0" step="0.01" required />
                                </div>
                                <div>
                                    <label className="label">Discount Price (Optional)</label>
                                    <input
                                        type="number"
                                        value={formData.discount_price}
                                        onChange={e => setFormData({ ...formData, discount_price: e.target.value })}
                                        className="input-field"
                                        min="0"
                                        step="0.01"
                                        placeholder="Leave empty if no discount"
                                    />
                                    {formData.discount_price && Number(formData.discount_price) >= Number(formData.price) && (
                                        <p className="text-red-400 text-xs mt-1">Discount price must be lower than original price</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Stock Quantity</label>
                                    <input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} className="input-field" min="0" required />
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        <span className="ml-3 text-sm font-medium text-dark-200">Featured Product</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="label">Product Image</label>
                                <div className="space-y-4">
                                    {/* Image Preview */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-dark-600 flex items-center justify-center bg-dark-800">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : formData.image_url ? (
                                                <img src={formData.image_url} alt="Current" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">📸</span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <label className="btn-secondary text-sm cursor-pointer flex items-center justify-center gap-2">
                                                {imageUploading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📁</span>
                                                        <span>Upload Image</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={imageUploading}
                                                />
                                            </label>
                                            <p className="text-xs text-dark-500 mt-2">
                                                Max 5MB. JPG, PNG, GIF, WEBP
                                            </p>
                                        </div>
                                    </div>

                                    {/* Or enter URL manually */}
                                    <div>
                                        <label className="label text-sm text-dark-400">Or enter image URL</label>
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            className="input-field text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field h-32" placeholder="Product details..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
                                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
