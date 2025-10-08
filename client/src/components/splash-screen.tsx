import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Camera, Tag, Package, PauseCircle } from "lucide-react";

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
    title: "Smart Photo Capture",
    description: "Scan price tags instantly with AI-powered OCR technology",
    icon: "📸",
    iconComponent: <Camera className="w-12 h-12" />,
    gradient: "from-blue-400 to-blue-600"
  },
  {
    title: "Multi-Purchase Discounts",
    description: "Automatically detect and apply volume discounts like '3 for €10'",
    icon: "🏷️",
    iconComponent: <Tag className="w-12 h-12" />,
    gradient: "from-green-400 to-green-600"
  },
  {
    title: "Intelligent Grouping",
    description: "Smart bin-packing algorithm splits lists optimally",
    icon: "📦",
    iconComponent: <Package className="w-12 h-12" />,
    gradient: "from-purple-400 to-purple-600"
  },
  {
    title: "Hold Items",
    description: "Put items on hold to exclude them from totals and splitting",
    icon: "⏸️",
    iconComponent: <PauseCircle className="w-12 h-12" />,
    gradient: "from-orange-400 to-orange-600"
  }
];

export function SplashScreen({ onClose }: SplashScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

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
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('splashScreenShown', 'true');
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
      <div className="relative text-center mb-12 z-10">
        <div className="w-32 h-32 mx-auto mb-6 relative animate-bounce-slow">
          {/* PNG Logo with glass effect */}
          <div className="w-full h-full bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 overflow-hidden">
            <img
              src="/logo.png"
              alt="ShopAssist Logo"
              className="w-[120px] h-[120px] object-contain"
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
              className="w-16 h-16 text-white hidden"
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
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl -z-10"></div>
        </div>
        <h1 className="text-6xl font-bold text-white mb-3 drop-shadow-2xl">ShopAssist</h1>
        <p className="text-white/90 text-xl font-light">Smart Shopping Made Simple</p>
      </div>

      {/* Features showcase */}
      <div className="w-full max-w-2xl px-8 z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
            Powerful Features
          </h2>
          <p className="text-white/80 text-lg">Everything you need for smart shopping</p>
        </div>

        <div className="relative h-56 mb-8">
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
                <div className={`w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center mb-6 shadow-2xl transform transition-transform duration-500 ${
                  index === currentFeature ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
                }`}>
                  <div className="text-white">
                    {feature.iconComponent}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
                  {feature.title}
                </h3>
                <p className="text-white/90 text-lg leading-relaxed px-8 max-w-xl">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicators with glass effect */}
        <div className="flex justify-center gap-3 mb-10">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? 'bg-white w-10 shadow-lg'
                  : 'bg-white/30 w-2.5 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Action button with glass effect */}
        <div className="flex justify-center">
          <Button
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 text-white text-xl py-7 px-12 rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            Get Started
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
