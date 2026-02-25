'use client';

import { useState, useEffect } from 'react';
import api, { apiGet } from '@/lib/api';
import { ApiResponse, Category } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_PLACEHOLDER_IMAGE = '/images/category-placeholder.svg';

function normalizeCategoryImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;

    const trimmed = imageUrl.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const parsed = new URL(trimmed);
            if (parsed.pathname.startsWith('/storage/')) {
                return parsed.pathname;
            }
        } catch {
            return trimmed;
        }
        return trimmed;
    }
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    if (trimmed.startsWith('storage/')) return `/${trimmed}`;

    return trimmed;
}

function normalizeCategoryData(category: Category): Category {
    const isActive = typeof category.is_active === 'boolean'
        ? category.is_active
        : String(category.is_active).toLowerCase() === 'true' || String(category.is_active) === '1';

    return {
        ...category,
        image_url: normalizeCategoryImageUrl(category.image_url),
        is_active: isActive,
    };
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '', description: '', image_url: '', is_active: true
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await apiGet<ApiResponse<Category[]>>('/categories', {
                cacheTtlMs: 0,
                forceRefresh: true,
            });
            setCategories((res.data.data || []).map(normalizeCategoryData));
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCategoryModal = (category?: Category) => {
        setSelectedImage(null);
        setImagePreview(null);

        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                image_url: normalizeCategoryImageUrl(category.image_url) || '',
                is_active: category.is_active
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '', description: '', image_url: '', is_active: true
            });
        }
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                description: formData.description,
                is_active: formData.is_active,
                slug,
            };

            if (!selectedImage) {
                payload.image_url = normalizeCategoryImageUrl(formData.image_url) || '';
            }

            let categoryId: number;

            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, payload);
                categoryId = editingCategory.id;
                toast.success('Category updated');
            } else {
                const response = await api.post('/categories', payload);
                categoryId = response.data.data.id;
                toast.success('Category created');
            }

            // Upload image if selected
            if (selectedImage && categoryId) {
                await uploadCategoryImage(categoryId);
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem('product_categories');
                localStorage.removeItem('product_categories_ts');
            }

            setIsCategoryModalOpen(false);
            await fetchCategories();
        } catch (err: any) {
            const firstValidationError = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0]
                : null;

            if (Array.isArray(firstValidationError) && firstValidationError.length > 0) {
                toast.error(String(firstValidationError[0]));
            } else {
                toast.error(err.response?.data?.message || 'Failed to save category');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setSelectedImage(file);
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const uploadCategoryImage = async (categoryId: number) => {
        if (!selectedImage) return;

        setImageUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', selectedImage);

            const response = await api.post(`/categories/${categoryId}/image`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedImageUrl = normalizeCategoryImageUrl(response.data?.data?.image_url);
            if (uploadedImageUrl) {
                setFormData(prev => ({ ...prev, image_url: uploadedImageUrl }));
            }

            toast.success('Category image uploaded');
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setImageUploading(false);
        }
    };

    const previewImageUrl = normalizeCategoryImageUrl(formData.image_url);

    if (loading && !isCategoryModalOpen && categories.length === 0)
        return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-dark-100">Category Management</h1>
                <button onClick={() => handleOpenCategoryModal()} className="btn-primary flex items-center gap-2">
                    <span>➕</span> Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => {
                    const categoryImageUrl = normalizeCategoryImageUrl(category.image_url);

                    return (
                    <div key={category.id} className="card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1">
                        <div className="aspect-video bg-dark-800 relative overflow-hidden">
                            {categoryImageUrl ? (
                                <img
                                    src={categoryImageUrl}
                                    alt={category.name}
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = CATEGORY_PLACEHOLDER_IMAGE;
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <img
                                    src={CATEGORY_PLACEHOLDER_IMAGE}
                                    alt={`${category.name} placeholder`}
                                    className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                                />
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${category.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-dark-100">{category.name}</h3>
                                <span className="text-xs bg-dark-700 text-dark-300 px-2 py-1 rounded">
                                    {category.products_count || 0} Products
                                </span>
                            </div>
                            <p className="text-sm text-dark-400 mb-4 line-clamp-2">{category.description || 'No description'}</p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenCategoryModal(category)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-dark-600 text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200">
                    <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 border-dark-700">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit z-10 py-2 border-b border-dark-700/50">
                            <h2 className="text-xl font-bold text-dark-100">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-dark-400 hover:text-white transition-colors text-2xl">✕</button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-5">
                            <div>
                                <label className="label">Category Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                            </div>

                            <div>
                                <label className="label">Category Image</label>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-dark-600 flex items-center justify-center bg-dark-800">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : previewImageUrl ? (
                                                <img src={previewImageUrl} alt="Current" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">📸</span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <label className="btn-secondary text-sm cursor-pointer flex items-center justify-center gap-2">
                                                {imageUploading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <span>📁 Upload Image</span>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={imageUploading}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label text-sm text-dark-400">Or enter image URL</label>
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={e => {
                                                setSelectedImage(null);
                                                setImagePreview(null);
                                                setFormData({ ...formData, image_url: e.target.value });
                                            }}
                                            className="input-field text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field h-24" />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    <span className="ml-3 text-sm font-medium text-dark-200">Active</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Category'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
