import { useState, useRef } from 'react';
import { Camera, ImagePlus, Video, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/upload-to-drive`;

export default function UploadForm({ guestName, setGuestName, onUploadSuccess }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const uploadSingleFile = async (file) => {
        // Edge Function'a FormData olarak gönder (sıkıştırma yok, tam kalite)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('guest_name', guestName.trim());

        const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Yükleme hatası');
        }

        // Veritabanına Google Drive file ID'yi kaydet
        const { error: dbError } = await supabase
            .from('wedding_photos')
            .insert([{
                guest_name: guestName.trim(),
                image_path: data.fileId,
                media_type: data.mediaType,
            }]);

        if (dbError) throw dbError;
    };

    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0 || !guestName.trim()) return;

        setIsUploading(true);
        setUploadSuccess(false);
        setUploadProgress({ current: 0, total: files.length });

        let uploaded = 0;
        let failed = 0;

        for (const file of files) {
            try {
                await uploadSingleFile(file);
                uploaded++;
                setUploadProgress({ current: uploaded, total: files.length });
            } catch (error) {
                console.error(`Yükleme hatası (${file.name}):`, error);
                failed++;
            }
        }

        setIsUploading(false);
        event.target.value = '';

        if (uploaded > 0) {
            setSuccessCount(uploaded);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 4000);
            if (onUploadSuccess) onUploadSuccess();
        }

        if (failed > 0) {
            alert(`${failed} dosya yüklenemedi. ${uploaded} dosya başarıyla yüklendi.`);
        }
    };

    const progressText = () => {
        if (!isUploading) return '';
        const { current, total } = uploadProgress;
        if (total <= 1) return 'Yükleniyor...';
        return `${current}/${total} yükleniyor...`;
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
                accept="image/*,video/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <input
                type="file"
                accept="image/*,video/*"
                multiple
                ref={galleryInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Butonlar */}
            <div className="flex gap-3 w-full">
                {/* Kamera Butonu */}
                <button
                    id="camera-upload-btn"
                    onClick={() => {
                        if (!guestName.trim()) {
                            alert("Lütfen fotoğraf yüklemeden önce adınızı yazın.");
                            document.getElementById("guest-name-input").focus();
                            return;
                        }
                        cameraInputRef.current.click();
                    }}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-wedding-dark text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-40 hover:bg-wedding-dark/85 active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Camera size={20} />
                    )}
                    <span className="text-sm">
                        {isUploading ? progressText() : 'Fotoğraf Çek'}
                    </span>
                </button>

                {/* Galeriden Yükle Butonu */}
                <button
                    id="gallery-upload-btn"
                    onClick={() => {
                        if (!guestName.trim()) {
                            alert("Lütfen fotoğraf yüklemeden önce adınızı yazın.");
                            document.getElementById("guest-name-input").focus();
                            return;
                        }
                        galleryInputRef.current.click();
                    }}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-wedding-accent text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-40 hover:bg-wedding-accent-hover active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <ImagePlus size={20} />
                    )}
                    <span className="text-sm">
                        {isUploading ? progressText() : 'Galeriden Seç'}
                    </span>
                </button>
            </div>

            {/* İlerleme çubuğu */}
            {isUploading && uploadProgress.total > 1 && (
                <div className="w-full bg-wedding-accent/10 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-wedding-accent rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                </div>
            )}

            {/* Başarı mesajı */}
            {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl w-full justify-center">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">
                        {successCount > 1
                            ? `${successCount} dosya başarıyla yüklendi!`
                            : 'Dosya başarıyla yüklendi!'}
                    </span>
                </div>
            )}
        </div>
    );
}