'use client';

import { useState, useEffect } from 'react';
import api, { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit, Trash2, X, Save, ImagePlus } from 'lucide-react';

interface DeliveryZone {
    id: number;
    zone_name: string;
    latitude_center: number;
    longitude_center: number;
    radius_meters: number;
    delivery_fee: number;
    is_active: boolean;
}

function toNumber(value: unknown, fallback = 0): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true';
    }
    return Boolean(value);
}

function normalizeZone(raw: Record<string, unknown>): DeliveryZone {
    return {
        id: toNumber(raw.id),
        zone_name: String(raw.zone_name ?? ''),
        latitude_center: toNumber(raw.latitude_center),
        longitude_center: toNumber(raw.longitude_center),
        radius_meters: toNumber(raw.radius_meters),
        delivery_fee: toNumber(raw.delivery_fee),
        is_active: toBoolean(raw.is_active),
    };
}

function normalizeHeroImages(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
            }
        } catch {
            return [];
        }
    }

    return [];
}

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        maintenance_message: '',
        hero_images: [] as string[],
    });
    const [heroImageFiles, setHeroImageFiles] = useState<Array<File | null>>([null, null, null]);
    const [heroSaving, setHeroSaving] = useState(false);
    
    // Delivery zones state
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
    const [zoneForm, setZoneForm] = useState({
        zone_name: '',
        latitude_center: '',
        longitude_center: '',
        radius_meters: '',
        delivery_fee: '',
        is_active: true
    });

    useEffect(() => {
        fetchSettings();
        fetchDeliveryZones();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiGet('/admin/settings', { cacheTtlMs: 30000 });
            setSettings({
                maintenance_mode: toBoolean(res.data.data.maintenance_mode),
                maintenance_message: res.data.data.maintenance_message ?? '',
                hero_images: normalizeHeroImages(res.data.data.hero_images),
            });
        } catch (err) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryZones = async () => {
        setZonesLoading(true);
        try {
            const res = await apiGet('/admin/delivery-zones', { cacheTtlMs: 30000 });
            // Handle paginated response
            const zones = res.data.data.data || res.data.data;
            setDeliveryZones(
                Array.isArray(zones)
                    ? zones.map((zone) => normalizeZone(zone as Record<string, unknown>))
                    : []
            );
        } catch (err) {
            console.error('Failed to load delivery zones:', err);
            toast.error('Failed to load delivery zones');
        } finally {
            setZonesLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', {
                maintenance_mode: settings.maintenance_mode ? 'true' : 'false',
                maintenance_message: settings.maintenance_message
            });
            toast.success('Settings updated successfully');
        } catch (err) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleHeroFileChange = (index: number, file: File | null) => {
        setHeroImageFiles((prev) => {
            const next = [...prev];
            next[index] = file;
            return next;
        });
    };

    const handleUploadHeroImages = async () => {
        if (heroImageFiles.some((file) => file === null)) {
            toast.error('Please select all 3 hero images.');
            return;
        }

        setHeroSaving(true);
        try {
            const formData = new FormData();
            heroImageFiles.forEach((file) => {
                if (file) {
                    formData.append('images[]', file);
                }
            });

            const res = await api.post('/admin/settings/hero-images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploaded = normalizeHeroImages(res.data?.data?.hero_images);
            setSettings((prev) => ({ ...prev, hero_images: uploaded }));
            setHeroImageFiles([null, null, null]);
            toast.success('Hero images updated successfully');
        } catch (err) {
            toast.error('Failed to upload hero images');
        } finally {
            setHeroSaving(false);
        }
    };

    // Zone management functions
    const openZoneModal = (zone?: DeliveryZone) => {
        if (zone) {
            setEditingZone(zone);
            setZoneForm({
                zone_name: zone.zone_name,
                latitude_center: zone.latitude_center.toString(),
                longitude_center: zone.longitude_center.toString(),
                radius_meters: zone.radius_meters.toString(),
                delivery_fee: zone.delivery_fee ? zone.delivery_fee.toString() : '',
                is_active: zone.is_active
            });
        } else {
            setEditingZone(null);
            setZoneForm({
                zone_name: '',
                latitude_center: '',
                longitude_center: '',
                radius_meters: '',
                delivery_fee: '',
                is_active: true
            });
        }
        setShowZoneModal(true);
    };

    const closeZoneModal = () => {
        setShowZoneModal(false);
        setEditingZone(null);
    };

    const handleZoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const zoneData = {
            zone_name: zoneForm.zone_name,
            latitude_center: parseFloat(zoneForm.latitude_center),
            longitude_center: parseFloat(zoneForm.longitude_center),
            radius_meters: parseInt(zoneForm.radius_meters),
            delivery_fee: zoneForm.delivery_fee ? parseFloat(zoneForm.delivery_fee) : 0,
            is_active: zoneForm.is_active
        };

        try {
            if (editingZone) {
                await api.put(`/admin/delivery-zones/${editingZone.id}`, zoneData);
                toast.success('Delivery zone updated successfully');
            } else {
                await api.post('/admin/delivery-zones', zoneData);
                toast.success('Delivery zone created successfully');
            }
            closeZoneModal();
            fetchDeliveryZones();
        } catch (err) {
            toast.error(editingZone ? 'Failed to update delivery zone' : 'Failed to create delivery zone');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteZone = async (id: number) => {
        if (!confirm('Are you sure you want to delete this delivery zone?')) return;

        try {
            await api.delete(`/admin/delivery-zones/${id}`);
            toast.success('Delivery zone deleted successfully');
            fetchDeliveryZones();
        } catch (err) {
            toast.error('Failed to delete delivery zone');
        }
    };

    const handleToggleZoneStatus = async (zone: DeliveryZone) => {
        try {
            await api.patch(`/admin/delivery-zones/${zone.id}/toggle-status`);
            toast.success('Zone status updated');
            fetchDeliveryZones();
        } catch (err) {
            toast.error('Failed to update zone status');
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-dark-100 mb-8">System Settings</h1>

            {/* Maintenance Mode Section */}
            <div className="card space-y-8 p-8 mb-8">
                <div>
                    <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
                        <span>🛠️</span> Maintenance Mode
                    </h2>
                    <p className="text-dark-400 text-sm mb-6">
                        Enable maintenance mode to prevent customers from accessing the store. Admin access will remain active.
                    </p>

                    <div className="flex items-center gap-4 mb-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500"></div>
                            <span className="ml-3 text-sm font-medium text-dark-200">
                                {settings.maintenance_mode ? 'Maintenance Enabled' : 'Maintenance Disabled'}
                            </span>
                        </label>
                    </div>

                    <div className={`space-y-2 transition-all duration-300 ${settings.maintenance_mode ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                        <label className="label">Maintenance Message</label>
                        <textarea
                            value={settings.maintenance_message}
                            onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                            className="input-field h-32"
                            placeholder="We are currently down for maintenance..."
                            disabled={!settings.maintenance_mode}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-dark-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Delivery Zones Section */}
            <div className="card space-y-6 p-8 mb-8">
                <div>
                    <h2 className="text-lg font-bold text-dark-100 mb-2 flex items-center gap-2">
                        <ImagePlus size={18} className="text-primary-400" />
                        Hero Background Images
                    </h2>
                    <p className="text-dark-400 text-sm mb-6">
                        Upload 3 images for the homepage hero background slider. These rotate automatically every 5 seconds.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="rounded-xl border border-dark-700 p-3 bg-dark-900/60">
                                <div className="aspect-[16/10] rounded-lg border border-dark-700 overflow-hidden bg-dark-800 mb-3">
                                    {settings.hero_images[index] ? (
                                        <img
                                            src={settings.hero_images[index]}
                                            alt={`Hero image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-dark-500 text-sm">
                                            No image
                                        </div>
                                    )}
                                </div>

                                <label className="block text-xs text-dark-300 mb-2">
                                    Hero Image {index + 1} *
                                </label>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={(e) => handleHeroFileChange(index, e.target.files?.[0] ?? null)}
                                    className="block w-full text-xs text-dark-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-300 hover:file:bg-primary-500/30"
                                />
                                {heroImageFiles[index] && (
                                    <p className="mt-2 text-[11px] text-primary-300 truncate">
                                        Selected: {heroImageFiles[index]?.name}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleUploadHeroImages}
                            disabled={heroSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {heroSaving ? 'Uploading...' : 'Upload 3 Hero Images'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delivery Zones Section */}
            <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                            <MapPin size={20} className="text-primary-400" />
                            Delivery Locations
                        </h2>
                        <p className="text-dark-400 text-sm mt-1">
                            Configure delivery zones that will appear in the checkout dropdown
                        </p>
                    </div>
                    <button
                        onClick={() => openZoneModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Zone
                    </button>
                </div>

                {zonesLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : deliveryZones.length === 0 ? (
                    <div className="text-center py-12 text-dark-400">
                        <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No delivery zones configured yet.</p>
                        <p className="text-sm mt-2">Add zones to allow customers to select delivery locations at checkout.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-dark-700">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Zone Name</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Coordinates</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Radius</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Fee</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-dark-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryZones.map((zone) => (
                                    <tr key={zone.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                                        <td className="py-4 px-4">
                                            <span className="font-medium text-dark-100">{zone.zone_name}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-dark-400 text-sm">
                                                {zone.latitude_center.toFixed(4)}, {zone.longitude_center.toFixed(4)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-dark-400 text-sm">{zone.radius_meters}m</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-primary-400 font-medium">
                                                MWK {Number(zone.delivery_fee || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => handleToggleZoneStatus(zone)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    zone.is_active 
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                }`}
                                            >
                                                {zone.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openZoneModal(zone)}
                                                    className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Edit zone"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteZone(zone.id)}
                                                    className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Delete zone"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Zone Modal */}
            {showZoneModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-dark-100">
                                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
                            </h3>
                            <button
                                onClick={closeZoneModal}
                                className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleZoneSubmit} className="space-y-4">
                            <div>
                                <label className="label">Zone Name *</label>
                                <input
                                    type="text"
                                    value={zoneForm.zone_name}
                                    onChange={e => setZoneForm({ ...zoneForm, zone_name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Mzuzu University Main Campus"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Latitude *</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={zoneForm.latitude_center}
                                        onChange={e => setZoneForm({ ...zoneForm, latitude_center: e.target.value })}
                                        className="input-field"
                                        placeholder="-11.xxxx"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Longitude *</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={zoneForm.longitude_center}
                                        onChange={e => setZoneForm({ ...zoneForm, longitude_center: e.target.value })}
                                        className="input-field"
                                        placeholder="34.xxxx"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Radius (meters) *</label>
                                    <input
                                        type="number"
                                        min="100"
                                        value={zoneForm.radius_meters}
                                        onChange={e => setZoneForm({ ...zoneForm, radius_meters: e.target.value })}
                                        className="input-field"
                                        placeholder="500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Delivery Fee (MWK)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={zoneForm.delivery_fee}
                                        onChange={e => setZoneForm({ ...zoneForm, delivery_fee: e.target.value })}
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={zoneForm.is_active}
                                        onChange={e => setZoneForm({ ...zoneForm, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                    <span className="ml-3 text-sm font-medium text-dark-200">
                                        Active
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeZoneModal}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingZone ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
