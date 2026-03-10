import * as React from 'react';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const duration = 3000; // 3 seconds minimum

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (elapsed >= duration) {
                clearInterval(interval);
                setTimeout(onFinish, 200); // Slight delay for smoothness
            }
        }, 30);

        return () => clearInterval(interval);
    }, [onFinish]);

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center max-w-xs w-full px-8">
                {/* Logo with subtle scale-in animation */}
                <div className="mb-12 animate-in zoom-in duration-700 delay-200">
                    <img src={logo} alt="VEMRE Logo" className="h-24 w-auto object-contain" />
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="bg-primary-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Loading text */}
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                    Initializing System
                </p>
            </div>

            {/* Footer tag */}
            <div className="absolute bottom-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Vemre HRIS &middot; Enterprise Edition
            </div>
        </div>
    );
};

export default SplashScreen;
