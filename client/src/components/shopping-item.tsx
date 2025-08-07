import { ShoppingItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Tag } from "lucide-react";
import { cn, canApplyDiscount, calculateItemTotal } from "@/lib/utils";

interface ShoppingItemProps {
  item: ShoppingItem;
  onRemove: (id: string) => void;
  onToggleDiscount?: (id: string) => void;
  isDragging?: boolean;
  isInGroup?: boolean;
}

export function ShoppingItemComponent({ 
  item, 
  onRemove, 
  onToggleDiscount,
  isDragging = false,
  isInGroup = false 
}: ShoppingItemProps) {
  return (
    <div
      draggable
      data-item-id={item.id}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm cursor-move hover:shadow-md transition-shadow",
        isDragging && "opacity-50 transform rotate-1",
        isInGroup && "bg-gray-50 border-gray-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-sm text-gray-600">€{item.price.toFixed(2)}</span>
            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
            <span className={cn(
              "text-sm font-medium",
              item.discountApplied ? "text-green-600" : "text-secondary"
            )}>
              €{item.total.toFixed(2)}
              {item.discountApplied && <span className="ml-1 text-xs">(discounted)</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {item.discount && canApplyDiscount(item) && onToggleDiscount && (
            <Button
              variant={item.discountApplied ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleDiscount(item.id)}
              className={cn(
                "p-1 text-xs",
                item.discountApplied 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "text-green-600 border-green-600 hover:bg-green-50"
              )}
              title={`Apply discount: ${item.discount.display}`}
            >
              <Tag className="h-3 w-3" />
            </Button>
          )}
          <GripVertical className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:bg-red-50 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
