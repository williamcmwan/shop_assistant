import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, RotateCcw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processImageForManualEntry, getProductSuggestions, getPriceSuggestions } from "@/lib/ocr-service";

interface PhotoCaptureProps {
  onExtractData: (productName: string, price: number) => void;
  onClose: () => void;
}

export function PhotoCapture({ onExtractData, onClose }: PhotoCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Immediately trigger camera on mount
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setIsProcessing(true);
        setLoadingText('Loading');
        let dotCount = 0;
        loadingInterval.current = setInterval(() => {
          dotCount = (dotCount + 1) % 4;
          setLoadingText('Loading' + '.'.repeat(dotCount));
        }, 400);
        timeoutRef.current = setTimeout(() => {
          setIsProcessing(false);
          setLoadingText('Server Error...');
          if (loadingInterval.current) clearInterval(loadingInterval.current);
          // Clear global window variables on timeout
          (window as any).__ocrLoadingText = 'Server Error...';
          (window as any).__ocrIsProcessing = false;
          // Reset file input to allow re-use
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          toast({
            title: 'OCR Timeout',
            description: 'No response from server after 10 seconds.',
            variant: 'destructive',
          });
        }, 10000);
        try {
          const productInfo = await processImageForManualEntry(imageData);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (loadingInterval.current) clearInterval(loadingInterval.current);
          setLoadingText(null);
          setIsProcessing(false);
          // Clear global window variables on success
          (window as any).__ocrLoadingText = null;
          (window as any).__ocrIsProcessing = false;
          onExtractData(productInfo.productName, productInfo.price);
        } catch (error) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (loadingInterval.current) clearInterval(loadingInterval.current);
          setLoadingText('Server Error...');
          setIsProcessing(false);
          // Clear global window variables on error
          (window as any).__ocrLoadingText = 'Server Error...';
          (window as any).__ocrIsProcessing = false;
          // Reset file input to allow re-use
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          toast({
            title: 'OCR processing failed',
            description: 'Please enter product information manually.',
            variant: 'destructive',
          });
        } finally {
          onClose();
        }
      };
      reader.readAsDataURL(file);
    } else {
      // User cancelled file selection
      // Reset file input to allow re-use
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  }, [onExtractData, onClose, toast]);

  // Expose loadingText and isProcessing via window for parent
  useEffect(() => {
    (window as any).__ocrLoadingText = loadingText;
    (window as any).__ocrIsProcessing = isProcessing;
  }, [loadingText, isProcessing]);

  // Cleanup effect to reset file input when component unmounts
  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
      }
    };
  }, []);

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileUpload}
      className="hidden"
    />
  );
} 