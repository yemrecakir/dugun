import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Gallery({ refreshTrigger }) {
    const [photos, setPhotos] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchPhotos(true);

        const channel = supabase
            .channel('public:wedding_photos')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wedding_photos' }, (payload) => {
                setPhotos((current) => [payload.new, ...current]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchPhotos(false);
        }
    }, [refreshTrigger]);

    const fetchPhotos = async (isInitial) => {
        if (isInitial) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }

        const { data, error } = await supabase
            .from('wedding_photos')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setPhotos(data);

        setIsLoading(false);
        setIsRefreshing(false);
    };

    const guestNames = useMemo(() => {
        const names = [...new Set(photos.map((p) => p.guest_name))];
        return names.sort((a, b) => a.localeCompare(b, 'tr'));
    }, [photos]);

    const filteredPhotos = useMemo(() => {
        if (activeTab === 'all') return photos;
        return photos.filter((p) => p.guest_name === activeTab);
    }, [photos, activeTab]);

    const getImageUrl = (path) => {
        return supabase.storage.from('wedding-album').getPublicUrl(path).data.publicUrl;
    };

    // Skeleton loading kartları
    const SkeletonGrid = () => (
        <div className="photo-grid">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="aspect-square rounded-xl skeleton-shimmer"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </div>
    );

    return (
        <div className="mt-8 px-2">
            {/* Tab Bar */}
            <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 min-w-max px-1">
                    <button
                        id="tab-all-photos"
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-wedding-dark text-white shadow-md scale-105'
                                : 'bg-white/70 text-wedding-dark/70 hover:bg-white hover:text-wedding-dark border border-wedding-accent/20 hover:border-wedding-accent/40'
                        }`}
                    >
                        <Users size={15} />
                        Tüm Fotoğraflar
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === 'all'
                                ? 'bg-white/20 text-white'
                                : 'bg-wedding-accent/15 text-wedding-accent'
                        }`}>
                            {photos.length}
                        </span>
                    </button>

                    {guestNames.map((name) => {
                        const count = photos.filter((p) => p.guest_name === name).length;
                        return (
                            <button
                                key={name}
                                id={`tab-guest-${name.replace(/\s+/g, '-').toLowerCase()}`}
                                onClick={() => setActiveTab(name)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                                    activeTab === name
                                        ? 'bg-wedding-accent text-white shadow-md scale-105'
                                        : 'bg-white/70 text-wedding-dark/70 hover:bg-white hover:text-wedding-dark border border-wedding-accent/20 hover:border-wedding-accent/40'
                                }`}
                            >
                                <User size={15} />
                                {name}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === name
                                        ? 'bg-white/20 text-white'
                                        : 'bg-wedding-accent/15 text-wedding-accent'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Yeni fotoğraf yüklenirken üstte küçük bar */}
            <AnimatePresence>
                {isRefreshing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-wedding-accent/10 rounded-full text-wedding-accent text-sm font-medium"
                    >
                        <Loader2 size={16} className="animate-spin" />
                        Fotoğraflar güncelleniyor...
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fotoğraf Galerisi */}
            {isLoading ? (
                <SkeletonGrid />
            ) : filteredPhotos.length === 0 ? (
                <div className="text-center py-16 text-wedding-dark/40">
                    <p className="text-lg">Henüz fotoğraf yok</p>
                    <p className="text-sm mt-1">İlk fotoğrafı siz paylaşın! 📸</p>
                </div>
            ) : (
                <div className="photo-grid">
                    <AnimatePresence>
                        {filteredPhotos.map((photo) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={photo.id}
                                className="relative group overflow-hidden rounded-xl"
                            >
                                <img
                                    src={getImageUrl(photo.image_path)}
                                    alt={`${photo.guest_name} tarafından çekildi`}
                                    className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-sm">📸 {photo.guest_name}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}