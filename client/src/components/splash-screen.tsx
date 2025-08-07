import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onClose: () => void;
}

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const features: Feature[] = [
  {
    title: "Smart Photo Capture",
    description: "Capture item name & price by taking photo on price tag",
    icon: "📸"
  },
  {
    title: "Multi-Purchase Discounts",
    description: "Support 3 for 2, 3 for 10€ etc discount offers",
    icon: "🏷️"
  },
  {
    title: "Intelligent Grouping",
    description: "Better optimization when splitting shopping lists",
    icon: "📦"
  }
];

export function SplashScreen({ onClose }: SplashScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('splashScreenShown', 'true');
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            {/* PNG Logo */}
            <div className="w-full h-full bg-black rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="ShopAssist Logo" 
                className="w-[75px] h-[75px] object-contain"
                onError={(e) => {
                  // Fallback to SVG if PNG fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              {/* Fallback SVG (hidden by default) */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="w-10 h-10 text-gray-300 hidden"
                strokeWidth={1.5}
                style={{ display: 'none' }}
              >
                {/* Handle */}
                <path 
                  d="M3 8h18" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Basket - rectangular with rounded corners */}
                <path 
                  d="M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Internal structure lines */}
                <path 
                  d="M6 12h12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M6 15h12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Left wheel */}
                <circle cx="7" cy="18" r="1.5" />
                <circle cx="7" cy="18" r="0.5" />
                {/* Right wheel */}
                <circle cx="17" cy="18" r="1.5" />
                <circle cx="17" cy="18" r="0.5" />
              </svg>
            </div>
            {/* Shadow */}
            <div className="absolute -bottom-1 left-2 right-2 h-1.5 bg-black opacity-10 rounded-full blur-sm"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ShopAssist</h1>
          <p className="text-gray-600">Smart Shopping Made Simple</p>
        </div>

        {/* Features carousel */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">What's New</h2>
            <p className="text-gray-600">Discover our latest features</p>
          </div>
          
          <div className="relative h-32">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === currentFeature 
                    ? 'opacity-100 translate-x-0' 
                    : index < currentFeature 
                      ? 'opacity-0 -translate-x-full' 
                      : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature indicators */}
          <div className="flex justify-center space-x-2 mt-4">
            {features.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentFeature 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={handleClose}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
