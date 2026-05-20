import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, ImagePlus, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function UploadForm({ guestName, setGuestName, onUploadSuccess }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !guestName.trim()) return;

        setIsUploading(true);
        setUploadSuccess(false);
        try {
            // 1. Görseli Sıkıştır (Maks 1MB)
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Storage'a Yükle
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('wedding-album')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            // 3. Veritabanına Kaydet
            const { error: dbError } = await supabase
                .from('wedding_photos')
                .insert([{ guest_name: guestName, image_path: filePath }]);

            if (dbError) throw dbError;

            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("Fotoğraf yüklenirken bir hata oluştu.");
        } finally {
            setIsUploading(false);
            // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
            event.target.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4 py-2">
            {/* İsim Girişi */}
            <input
                id="guest-name-input"
                type="text"
                placeholder="Adınız Soyadınız"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 border border-wedding-accent/30 rounded-xl bg-white/70 backdrop-blur-sm text-wedding-dark placeholder:text-wedding-dark/40 focus:outline-none focus:ring-2 focus:ring-wedding-accent/50 focus:border-wedding-accent transition-all duration-300"
            />

            {/* Gizli file input'lar */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <input
                type="file"
                accept="image/*"
                ref={galleryInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Butonlar */}
            <div className="flex gap-3 w-full">
                {/* Kamera Butonu */}
                <button
                    id="camera-upload-btn"
                    onClick={() => cameraInputRef.current.click()}
                    disabled={!guestName.trim() || isUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-wedding-dark text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-40 hover:bg-wedding-dark/85 active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Camera size={20} />
                    )}
                    <span className="text-sm">
                        {isUploading ? 'Yükleniyor...' : 'Fotoğraf Çek'}
                    </span>
                </button>

                {/* Galeriden Yükle Butonu */}
                <button
                    id="gallery-upload-btn"
                    onClick={() => galleryInputRef.current.click()}
                    disabled={!guestName.trim() || isUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-wedding-accent text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-40 hover:bg-wedding-accent-hover active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <ImagePlus size={20} />
                    )}
                    <span className="text-sm">
                        {isUploading ? 'Yükleniyor...' : 'Galeriden Seç'}
                    </span>
                </button>
            </div>

            {/* Başarı mesajı */}
            {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-fade-in w-full justify-center">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Fotoğraf başarıyla yüklendi!</span>
                </div>
            )}
        </div>
    );
}