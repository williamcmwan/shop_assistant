import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Scale } from "lucide-react";

interface WeightEditDialogProps {
  productName: string;
  pricePerKg: number;
  currentWeight: number;
  currentTotal: number;
  onConfirm: (productName: string, pricePerKg: number, weight: number, newTotal: number) => void;
  onCancel: () => void;
}

export function WeightEditDialog({ 
  productName, 
  pricePerKg, 
  currentWeight, 
  currentTotal,
  onConfirm, 
  onCancel 
}: WeightEditDialogProps) {
  const [editedProductName, setEditedProductName] = useState<string>(productName);
  const [editedPricePerKg, setEditedPricePerKg] = useState<number>(pricePerKg);
  const [weight, setWeight] = useState<number>(currentWeight);

  const handleConfirm = () => {
    if (weight > 0 && editedPricePerKg > 0 && editedProductName.trim()) {
      const newTotal = weight * editedPricePerKg;
      onConfirm(editedProductName.trim(), editedPricePerKg, weight, newTotal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const totalPrice = weight * editedPricePerKg;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Edit Weight</h3>
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
            <Input
              type="text"
              value={editedProductName}
              onChange={(e) => setEditedProductName(e.target.value)}
              placeholder="Product name"
              className="w-full"
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per KG (€):
            </label>
            <Input
              type="number"
              value={editedPricePerKg}
              onChange={(e) => setEditedPricePerKg(Number(e.target.value))}
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
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="1.0"
              step="0.1"
              min="0.1"
              className="w-full"
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Total:</span>
              <span className="text-lg font-semibold text-blue-600">
                €{totalPrice.toFixed(2)}
              </span>
            </div>
            {currentTotal !== totalPrice && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Previous:</span>
                <span className="text-sm text-gray-500 line-through">
                  €{currentTotal.toFixed(2)}
                </span>
              </div>
            )}
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
              disabled={weight <= 0 || editedPricePerKg <= 0 || !editedProductName.trim()}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              Update Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}