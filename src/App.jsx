import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadForm from './components/UploadForm';
import Gallery from './components/Gallery';

function SplashScreen({ onFinish }) {
    useEffect(() => {
        const timer = setTimeout(onFinish, 2200);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-wedding-light"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Yüzük animasyonu */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-6xl mb-6"
            >
                💍
            </motion.div>

            {/* İsimler */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-4xl font-serif text-wedding-dark mb-3"
            >
                Sanem & Yunus
            </motion.h1>

            {/* Alt yazı */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-wedding-accent text-sm tracking-widest uppercase"
            >
                Fotoğraf Galerisi
            </motion.p>

            {/* Loading dots */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className="flex gap-1.5 mt-8"
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-wedding-accent"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
}

function App() {
    const [guestName, setGuestName] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSplash, setShowSplash] = useState(true);

    const handleUploadSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <>
            <AnimatePresence>
                {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showSplash ? 0 : 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="min-h-screen pb-10"
            >
                <header className="pt-12 pb-8 px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? -10 : 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-4xl font-serif text-wedding-dark mb-2"
                    >
                        Sanem & Yunus
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showSplash ? 0 : 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-gray-500"
                    >
                        Bu güzel günümüzü bizim gözümüzden değil, sizin gözünüzden görelim.
                    </motion.p>
                </header>

                <main className="max-w-5xl mx-auto">
                    <UploadForm guestName={guestName} setGuestName={setGuestName} onUploadSuccess={handleUploadSuccess} />
                    <Gallery refreshTrigger={refreshTrigger} />
                </main>
            </motion.div>
        </>
    );
}

export default App;