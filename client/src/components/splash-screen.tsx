import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Camera, Tag, Package, PauseCircle, Type, Settings } from "lucide-react";

interface SplashScreenProps {
  onClose: () => void;
}

interface Feature {
  title: string;
  description: string;
  icon: string;
  iconComponent: React.ReactNode;
  gradient: string;
}

const features: Feature[] = [
  {
    title: "Auto Complete Input",
    description: "Smart suggestions based on your shopping history for faster item entry",
    icon: "⌨️",
    iconComponent: <Type className="w-12 h-12" />,
    gradient: "from-indigo-400 to-indigo-600"
  },
  {
    title: "Currency Configuration",
    description: "Customize your currency symbol - supports €, $, £, ¥ and custom symbols",
    icon: "💱",
    iconComponent: <Settings className="w-12 h-12" />,
    gradient: "from-emerald-400 to-emerald-600"
  },
  {
    title: "Hold Items",
    description: "Put items on hold to exclude them from totals and splitting calculations",
    icon: "⏸️",
    iconComponent: <PauseCircle className="w-12 h-12" />,
    gradient: "from-orange-400 to-orange-600"
  },
  {
    title: "Intelligent Grouping",
    description: "Smart bin-packing algorithm optimally splits lists by target amounts",
    icon: "📦",
    iconComponent: <Package className="w-12 h-12" />,
    gradient: "from-purple-400 to-purple-600"
  },
  {
    title: "Photo Capture Pricing",
    description: "Scan price tags instantly with AI-powered OCR technology",
    icon: "📸",
    iconComponent: <Camera className="w-12 h-12" />,
    gradient: "from-blue-400 to-blue-600"
  },
  {
    title: "Multi-Purchase Discounts",
    description: "Automatically detect and apply volume discounts like '3 for €10' or 'Buy 2 Get 1'",
    icon: "🏷️",
    iconComponent: <Tag className="w-12 h-12" />,
    gradient: "from-green-400 to-green-600"
  }
];

export function SplashScreen({ onClose }: SplashScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    // Prevent body scroll when splash screen is visible
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      // Restore body scroll when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 6000); // 6 seconds for better readability

    return () => clearInterval(timer);
  }, [currentFeature]); // Reset timer when currentFeature changes

  // Swipe handling functions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next feature (timer will reset due to currentFeature change)
      setCurrentFeature((prev) => (prev + 1) % features.length);
    } else if (isRightSwipe) {
      // Swipe right - previous feature (timer will reset due to currentFeature change)
      setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
    }
  };

  const handleClose = () => {
    const SPLASH_VERSION = 'v2.0'; // Keep in sync with App.tsx
    localStorage.setItem(`splashScreenShown_${SPLASH_VERSION}`, 'true');
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 400);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 z-50 flex flex-col items-center justify-center transition-opacity duration-400 overflow-hidden ${fadeOut ? 'opacity-0' : 'opacity-100'}`} style={{ touchAction: 'none' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full backdrop-blur-sm z-10"
      >
        <span className="text-sm font-medium">Skip</span>
        <X className="w-4 h-4" />
      </button>

      {/* Logo and Title - integrated with background */}
      <div className="relative text-center mb-6 sm:mb-10 z-10">
        <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-5 relative animate-bounce-slow">
          {/* PNG Logo with glass effect */}
          <div className="w-full h-full bg-white/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 overflow-hidden">
            <img
              src="/logo.png"
              alt="ShopAssist Logo"
              className="w-[75px] h-[75px] sm:w-[105px] sm:h-[105px] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            {/* Fallback SVG */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-12 h-12 sm:w-16 sm:h-16 text-white hidden"
              strokeWidth={1.5}
              style={{ display: 'none' }}
            >
              <path d="M3 8h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12h12" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 15h12" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7" cy="18" r="1.5" />
              <circle cx="17" cy="18" r="1.5" />
            </svg>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-white/20 rounded-2xl sm:rounded-3xl blur-2xl -z-10"></div>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-2xl">ShopAssist</h1>
        <p className="text-white/90 text-base sm:text-lg md:text-xl font-light">Smart Shopping Made Simple</p>
      </div>

      {/* Features showcase */}
      <div className="w-full max-w-2xl px-6 sm:px-8 z-10">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
            Powerful Features
          </h2>
          <p className="text-white/80 text-base sm:text-lg">Swipe or click to explore • {features.length} features</p>
        </div>

        <div 
          className="relative h-44 sm:h-52 mb-6 sm:mb-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentFeature
                  ? 'opacity-100 translate-x-0 scale-100'
                  : index < currentFeature
                    ? 'opacity-0 -translate-x-full scale-95'
                    : 'opacity-0 translate-x-full scale-95'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {/* Animated icon with glass effect */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center mb-3 sm:mb-5 shadow-2xl transform transition-transform duration-500 ${
                  index === currentFeature ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
                }`}>
                  <div className="text-white [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-10 sm:[&>svg]:h-10">
                    {feature.iconComponent}
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                  {feature.title}
                </h3>
                <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed px-4 sm:px-8 max-w-xl">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicators with glass effect */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? 'bg-white w-8 sm:w-10 shadow-lg'
                  : 'bg-white/30 w-2 sm:w-2.5 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Action button with glass effect */}
        <div className="flex justify-center">
          <Button
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 text-white text-lg sm:text-xl py-5 px-10 sm:py-6 sm:px-12 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            Get Started
            <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
