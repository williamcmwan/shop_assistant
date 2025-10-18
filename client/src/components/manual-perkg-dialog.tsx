import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { X, Scale } from "lucide-react";

interface ManualPerKgDialogProps {
  onConfirm: (productName: string, pricePerKg: number, weight: number) => void;
  onCancel: () => void;
  suggestions: string[];
  initialProductName?: string;
  initialPricePerKg?: number;
}

export function ManualPerKgDialog({ onConfirm, onCancel, suggestions, initialProductName = "", initialPricePerKg = 0 }: ManualPerKgDialogProps) {
  const [productName, setProductName] = useState<string>(initialProductName);
  const [pricePerKg, setPricePerKg] = useState<number>(initialPricePerKg);
  const [weight, setWeight] = useState<number>(1);

  const handleConfirm = () => {
    if (weight > 0 && pricePerKg > 0 && productName.trim()) {
      onConfirm(productName.trim(), pricePerKg, weight);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const totalPrice = weight * pricePerKg;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Per-KG Item</h3>
          </div>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name:
            </label>
            <AutocompleteInput
              value={productName}
              onChange={setProductName}
              suggestions={suggestions}
              placeholder="e.g., Tomatoes Class 1"
              className="w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per KG (€):
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={pricePerKg || ""}
              onChange={(e) => setPricePerKg(Number(e.target.value))}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full"
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (KG):
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="1.0"
              step="0.1"
              min="0.1"
              className="w-full"
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Price:</span>
              <span className="text-lg font-semibold text-blue-600">
                €{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={weight <= 0 || pricePerKg <= 0 || !productName.trim()}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}