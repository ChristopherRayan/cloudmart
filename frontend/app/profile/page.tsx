'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (user && !isUpdating) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
            });
            // Only update preview image if we're not in the middle of an update
            if (!profileImage) {
                setPreviewImage(user.profile_image_url || null);
            }
        }
    }, [user, isUpdating, profileImage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Store file for later upload
        setProfileImage(file);
        toast.success('Image selected. Save changes to upload.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setIsUpdating(true);
        
        try {
            let imageUrl = null;
            
            // Upload image if selected
            if (profileImage) {
                const uploadData = new FormData();
                uploadData.append('image', profileImage);
                
                setImageLoading(true);
                try {
                    const imageResponse = await api.post('/profile/image', uploadData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (imageResponse.data.status === 'success') {
                        // Store the image URL from the upload response
                        imageUrl = imageResponse.data.data.profile_image_url;
                        toast.success('Profile image uploaded successfully!');
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                    toast.error('Failed to upload profile image.');
                    setLoading(false);
                    setImageLoading(false);
                    return;
                } finally {
                    setImageLoading(false);
                }
            }
            
            // Update profile data
            const response = await api.put('/profile', formData);
            if (response.data.status === 'success') {
                toast.success('Profile updated successfully!');
                
                // Prepare user data with proper image URL
                const updatedUser = {
                    ...response.data.data,
                    profile_image_url: imageUrl || response.data.data.profile_image_url || user?.profile_image_url
                };
                
                // Update user context with new data
                updateUser(updatedUser);
                
                // Clear the image file after successful upload
                setProfileImage(null);
                
                // Update preview to show the final image
                if (imageUrl) {
                    setPreviewImage(imageUrl);
                } else {
                    setPreviewImage(response.data.data.profile_image_url || user?.profile_image_url || null);
                }
            }
        } catch (error) {
            toast.error('Failed to update profile.');
        } finally {
            setLoading(false);
            setIsUpdating(false);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold mb-8 gradient-text">Profile Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Avatar Upload */}
                <div className="md:col-span-1">
                    <div className="card p-6 flex flex-col items-center text-center">
                        <div className="relative w-40 h-40 mb-6 group">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary-500/20 shadow-xl">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setPreviewImage(null)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                                        <span className="text-4xl text-dark-400 font-bold">{user?.name?.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={imageLoading || loading} />
                            </label>
                            {(imageLoading || loading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-dark-100">{user?.name}</h3>
                        <p className="text-xs text-dark-400 mt-1 uppercase tracking-widest font-bold text-primary-400">
                            {user?.role?.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-dark-500 mt-4 leading-relaxed italic">
                            Max size: 2MB. Support JPG, PNG.
                        </p>
                    </div>
                </div>

                {/* Right: Personal Info Form */}
                <div className="md:col-span-2">
                    <div className="card p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="+265..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Default Delivery Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={4}
                                    className="input-field resize-none"
                                    placeholder="House number, Street name, City, Landmarks..."
                                ></textarea>
                                <p className="text-[10px] text-dark-500 mt-2 italic">
                                    💡 This address will be used to pre-fill your checkout details.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Reset form to original values
                                        if (user) {
                                            setFormData({
                                                name: user.name || '',
                                                email: user.email || '',
                                                phone: user.phone || '',
                                                address: user.address || '',
                                            });
                                            setPreviewImage(user.profile_image_url || null);
                                            setProfileImage(null);
                                            setIsUpdating(false);
                                        }
                                    }}
                                    className="px-6 py-2.5 text-sm font-medium text-dark-300 hover:text-white transition-colors"
                                    disabled={loading || imageLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary py-2.5 px-8 flex items-center justify-center gap-2 min-w-[120px]"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
