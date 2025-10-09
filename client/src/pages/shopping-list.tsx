import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ShoppingList, ShoppingItem, ShoppingGroup, InsertShoppingItem } from "@shared/schema";
import { storageService } from "@/lib/storage";
import { BinPackingAlgorithm } from "@/lib/bin-packing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { ShoppingItemComponent } from "@/components/shopping-item";
import { GroupContainer } from "@/components/group-container";
import { QuantityInput } from "@/components/quantity-input";
import { PhotoCapture } from "@/components/photo-capture";
import { ArrowLeft, Plus, Edit2, Check, X, Camera, Tag, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, canApplyDiscount, toggleDiscount, calculateItemTotal } from "@/lib/utils";

export default function ShoppingListPage() {
  const [, params] = useRoute("/list/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [newItem, setNewItem] = useState<InsertShoppingItem>({
    name: "",
    price: 0,
    quantity: 1,
    discountApplied: false,
    onHold: false
  });
  // Replace targetAmount and numberOfGroups state with groupSpecs array
  const [groupSpecs, setGroupSpecs] = useState([{ targetAmount: 25, count: 2 }]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: number; quantity: number; discountApplied: boolean; onHold: boolean }>({
    name: "",
    price: 0,
    quantity: 1,
    discountApplied: false,
    onHold: false
  });
  const [showSplitPanel, setShowSplitPanel] = useState<boolean>(false);
  const [editingGroupTarget, setEditingGroupTarget] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState<boolean>(false);
  const [photoCaptureKey, setPhotoCaptureKey] = useState<number>(0);
  // Add state for OCR loading text
  const [ocrLoadingText, setOcrLoadingText] = useState<string | null>(null);
  const [ocrIsProcessing, setOcrIsProcessing] = useState(false);
  // Add state for autocomplete suggestions
  const [itemNameSuggestions, setItemNameSuggestions] = useState<string[]>([]);
  // Add state for currency symbol
  const [currencySymbol, setCurrencySymbol] = useState("€");

  useEffect(() => {
    if (params?.id) {
      const list = storageService.getList(params.id);
      if (list) {
        setCurrentList(list);
      } else {
        toast({
          title: "List not found",
          description: "The shopping list you're looking for doesn't exist.",
          variant: "destructive"
        });
        setLocation("/");
      }
    }

    // Load item name suggestions
    setItemNameSuggestions(storageService.getItemNames());
    
    // Load currency symbol
    const savedCurrency = localStorage.getItem('currencySymbol') || '€';
    setCurrencySymbol(savedCurrency);
  }, [params?.id, setLocation, toast]);

  const updateList = (updatedList: ShoppingList) => {
    const totalAmount = updatedList.items
      .filter(item => !item.onHold)
      .reduce((sum, item) => sum + item.total, 0);
    updatedList.total = Number(totalAmount.toFixed(2));

    setCurrentList(updatedList);
    storageService.updateList(updatedList);
  };

  // Function to clean item name by removing discount information
  const cleanItemName = (itemName: string): string => {
    // Remove discount patterns like "(3 for €10)", "(3 for 2)", "(Buy 2 get 1)", etc.
    return itemName
      .replace(/\s*\([^)]*for[^)]*\)/gi, '') // Remove "(X for Y)" patterns
      .replace(/\s*\(buy[^)]*get[^)]*\)/gi, '') // Remove "(buy X get Y)" patterns
      .replace(/\s*\([^)]*€[^)]*\)/gi, '') // Remove any pattern with currency symbols
      .replace(/\s*\([^)]*\$[^)]*\)/gi, '') // Remove any pattern with dollar signs
      .replace(/\s*\([^)]*£[^)]*\)/gi, '') // Remove any pattern with pound signs
      .replace(/\s*\([^)]*¥[^)]*\)/gi, '') // Remove any pattern with yen signs
      .trim();
  };

  // Function to save all item names from current list
  const saveItemNamesFromList = () => {
    if (currentList && currentList.items.length > 0) {
      const itemNames = currentList.items
        .map(item => cleanItemName(item.name.trim()))
        .filter(name => name.length > 0);
      storageService.saveItemNames(itemNames);
    }
  };

  // Function to handle navigation back
  const handleBackNavigation = () => {
    saveItemNamesFromList();
    setLocation("/");
  };

  const handleAddItem = () => {
    if (!currentList || !newItem.name.trim() || newItem.price <= 0) {
      toast({
        title: "Invalid item",
        description: "Please enter a valid item name and price.",
        variant: "destructive"
      });
      return;
    }

    // Apply discount automatically if quantity matches discount requirement
    const discountApplied = newItem.discount ? canApplyDiscount({
      ...newItem,
      discountApplied: false
    } as ShoppingItem) : false;

    const item: ShoppingItem = {
      id: `item-${Date.now()}`,
      name: newItem.name.trim(),
      price: Number(newItem.price),
      quantity: newItem.quantity,
      total: newItem.discount && discountApplied ?
        calculateItemTotal({
          ...newItem,
          discountApplied: true,
          id: `temp-${Date.now()}`,
          total: 0
        } as ShoppingItem) :
        Number((newItem.price * newItem.quantity).toFixed(2)),
      discount: newItem.discount,
      discountApplied,
      onHold: false
    };

    const updatedList = {
      ...currentList,
      items: [...currentList.items, item]
    };

    updateList(updatedList);

    // Save the new item name for autocomplete (cleaned)
    const cleanedName = cleanItemName(newItem.name.trim());
    if (cleanedName) {
      storageService.addItemName(cleanedName);
      setItemNameSuggestions(storageService.getItemNames());
    }

    setNewItem({ name: "", price: 0, quantity: 1, discountApplied: false, onHold: false });
    setOcrIsProcessing(false);
    setOcrLoadingText(null);
    (window as any).__ocrLoadingText = null;
    (window as any).__ocrIsProcessing = false;
  };

  const handleRemoveItem = (itemId: string) => {
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.filter(item => item.id !== itemId),
      groups: currentList.groups?.map(group => ({
        ...group,
        items: group.items.filter(item => item.id !== itemId),
        total: Number(group.items
          .filter(item => item.id !== itemId)
          .reduce((sum, item) => sum + item.total, 0)
          .toFixed(2))
      }))
    };

    updateList(updatedList);
  };

  const handleToggleDiscount = (itemId: string) => {
    if (!currentList) return;

    const updatedItems = currentList.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = toggleDiscount(item);
        return updatedItem;
      }
      return item;
    });

    // Also update items in groups
    const updatedGroups = currentList.groups?.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = toggleDiscount(item);
          return updatedItem;
        }
        return item;
      }),
      total: Number(group.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = toggleDiscount(item);
          return updatedItem;
        }
        return item;
      }).reduce((sum, item) => sum + item.total, 0).toFixed(2))
    }));

    const updatedList = {
      ...currentList,
      items: updatedItems,
      groups: updatedGroups,
      total: Number(updatedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2))
    };

    updateList(updatedList);
  };

  const handleToggleHold = (itemId: string) => {
    if (!currentList) return;

    const updatedItems = currentList.items.map(item => {
      if (item.id === itemId) {
        return { ...item, onHold: !item.onHold };
      }
      return item;
    });

    // Also update items in groups
    const updatedGroups = currentList.groups?.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === itemId) {
          return { ...item, onHold: !item.onHold };
        }
        return item;
      }),
      total: Number(group.items
        .filter(item => !item.onHold || item.id !== itemId)
        .reduce((sum, item) => sum + item.total, 0).toFixed(2))
    }));

    const updatedList = {
      ...currentList,
      items: updatedItems,
      groups: updatedGroups
    };

    updateList(updatedList);
  };

  const handleToggleSplitMode = () => {
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      isSplitMode: !currentList.isSplitMode,
      groups: !currentList.isSplitMode ? [] : currentList.groups
    };

    updateList(updatedList);
  };

  // Update handleRunBinPacking to use groupSpecs and call the new bin-packing logic
  const handleRunBinPacking = () => {
    if (!currentList || currentList.items.length === 0) {
      toast({
        title: "No items",
        description: "Add some items before splitting the list.",
        variant: "destructive"
      });
      return;
    }
    // Filter out items that are on hold
    const itemsToSplit = currentList.items.filter(item => !item.onHold);

    if (itemsToSplit.length === 0) {
      toast({
        title: "No items to split",
        description: "All items are on hold. Unhold some items before splitting.",
        variant: "destructive"
      });
      return;
    }
    // Validate groupSpecs
    if (groupSpecs.length === 0 || groupSpecs.some(spec => spec.count < 1 || spec.targetAmount <= 0)) {
      toast({
        title: "Invalid group specs",
        description: "Please enter valid group totals and counts.",
        variant: "destructive"
      });
      return;
    }
    // Sort groupSpecs by targetAmount descending for better bin-packing
    const sortedSpecs = [...groupSpecs].sort((a, b) => b.targetAmount - a.targetAmount);
    const groups = BinPackingAlgorithm.optimizeMultiple(itemsToSplit, sortedSpecs);
    const updatedList = {
      ...currentList,
      groups,
      isSplitMode: true
    };
    updateList(updatedList);
    setShowSplitPanel(false);
    toast({
      title: "List split successfully",
      description: `Items have been distributed into ${groups.length} groups.`
    });
  };

  const handleUpdateGroupTarget = (groupId: string, newTarget: number) => {
    if (!currentList || !currentList.groups) return;

    const updatedGroups = currentList.groups.map(group =>
      group.id === groupId
        ? { ...group, targetAmount: newTarget }
        : group
    );

    const updatedList = {
      ...currentList,
      groups: updatedGroups
    };

    updateList(updatedList);
    setEditingGroupTarget(null);
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discountApplied: item.discountApplied,
      onHold: item.onHold
    });
  };

  const handleSaveEdit = (itemId: string) => {
    if (!currentList) return;

    const updatedItems = currentList.items.map(item => {
      if (item.id === itemId) {
        // Create updated item with new values
        const updatedItem: ShoppingItem = {
          ...item,
          name: editForm.name,
          price: editForm.price,
          quantity: editForm.quantity
        };

        // Check if discount should be automatically applied based on new quantity
        let discountApplied = item.discountApplied;
        if (item.discount) {
          const shouldApplyDiscount = canApplyDiscount(updatedItem);
          discountApplied = shouldApplyDiscount;

          // Show toast notification if discount status changed
          if (shouldApplyDiscount && !item.discountApplied) {
            toast({
              title: "Discount Applied!",
              description: `Quantity ${editForm.quantity} meets the discount criteria.`,
              variant: "default"
            });
          } else if (!shouldApplyDiscount && item.discountApplied) {
            toast({
              title: "Discount Removed",
              description: `Quantity ${editForm.quantity} no longer meets the discount criteria.`,
              variant: "default"
            });
          }
        }

        // Apply the discount status and calculate total
        const finalItem = {
          ...updatedItem,
          discountApplied
        };

        const newTotal = calculateItemTotal(finalItem);

        return {
          ...finalItem,
          total: newTotal
        };
      }
      return item;
    });

    // Also update item in groups if it exists
    const updatedGroups = currentList.groups?.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === itemId) {
          // Create updated item with new values
          const updatedItem: ShoppingItem = {
            ...item,
            price: editForm.price,
            quantity: editForm.quantity
          };

          // Check if discount should be automatically applied based on new quantity
          let discountApplied = item.discountApplied;
          if (item.discount) {
            const shouldApplyDiscount = canApplyDiscount(updatedItem);
            discountApplied = shouldApplyDiscount;
          }

          // Apply the discount status and calculate total
          const finalItem = {
            ...updatedItem,
            discountApplied
          };

          const newTotal = calculateItemTotal(finalItem);

          return {
            ...finalItem,
            total: newTotal
          };
        }
        return item;
      }),
      total: Number(group.items.map(item => {
        if (item.id === itemId) {
          // Create updated item with new values
          const updatedItem: ShoppingItem = {
            ...item,
            price: editForm.price,
            quantity: editForm.quantity
          };

          // Check if discount should be automatically applied based on new quantity
          let discountApplied = item.discountApplied;
          if (item.discount) {
            const shouldApplyDiscount = canApplyDiscount(updatedItem);
            discountApplied = shouldApplyDiscount;
          }

          // Apply the discount status and calculate total
          const finalItem = {
            ...updatedItem,
            discountApplied
          };

          return calculateItemTotal(finalItem);
        }
        return item.total;
      }).reduce((sum, total) => sum + total, 0).toFixed(2))
    }));

    const updatedList = {
      ...currentList,
      items: updatedItems,
      groups: updatedGroups
    };

    updateList(updatedList);

    // Save the edited item name for autocomplete (cleaned)
    const cleanedName = cleanItemName(editForm.name.trim());
    if (cleanedName) {
      storageService.addItemName(cleanedName);
      setItemNameSuggestions(storageService.getItemNames());
    }

    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const scrollToAddForm = () => {
    document.querySelector('.add-item-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDragStart = (e: React.DragEvent, item: ShoppingItem) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverGroup(null);
    }
  };
  const handleGroupDragOver = (groupId: string) => {
    setDragOverGroup(groupId);
  };
  const handleDropOnGroup = (groupId: string, droppedItem: ShoppingItem) => {
    if (!currentList || !currentList.groups) return;
    // Remove item from all groups first
    const updatedGroups = currentList.groups.map(group => ({
      ...group,
      items: group.items.filter(item => item.id !== droppedItem.id),
      total: Number(group.items
        .filter(item => item.id !== droppedItem.id)
        .reduce((sum, item) => sum + item.total, 0)
        .toFixed(2))
    }));
    // Add item to target group
    const targetGroupIndex = updatedGroups.findIndex(group => group.id === groupId);
    if (targetGroupIndex >= 0) {
      updatedGroups[targetGroupIndex].items.push(droppedItem);
      updatedGroups[targetGroupIndex].total = Number(
        (updatedGroups[targetGroupIndex].total + droppedItem.total).toFixed(2)
      );
    }
    const updatedList = {
      ...currentList,
      groups: updatedGroups
    };
    updateList(updatedList);
    setDragOverGroup(null);
  };

  const handlePhotoExtractData = (productName: string, price: number, discount?: { type: "bulk_price" | "buy_x_get_y"; quantity: number; value: number; display: string }) => {
    setOcrIsProcessing(false);
    setOcrLoadingText(null);
    // Clear global window variables
    (window as any).__ocrLoadingText = null;
    (window as any).__ocrIsProcessing = false;

    // Add discount information to product name if detected
    const displayName = discount ? `${productName.trim()} ${discount.display}` : productName.trim();

    setNewItem({
      name: displayName || "", // If no product name found, keep it empty
      price: price,
      quantity: discount ? discount.quantity : 1, // Set quantity to discount quantity if available
      discount: discount,
      discountApplied: false,
      onHold: false
    });
    // Removed toast notification to prevent blocking dialog
  };

  // Add a useEffect to load groupSpecs from localStorage when the list is opened
  useEffect(() => {
    if (currentList?.id) {
      const savedSpecs = localStorage.getItem(`splitConfig-${currentList.id}`);
      if (savedSpecs) {
        try {
          setGroupSpecs(JSON.parse(savedSpecs));
        } catch { }
      }
    }
    // eslint-disable-next-line
  }, [currentList?.id]);
  // Add a useEffect to save groupSpecs to localStorage whenever it changes
  useEffect(() => {
    if (currentList?.id) {
      localStorage.setItem(`splitConfig-${currentList.id}`, JSON.stringify(groupSpecs));
    }
  }, [groupSpecs, currentList?.id]);

  // Listen for loadingText and isProcessing from PhotoCapture
  useEffect(() => {
    const interval = setInterval(() => {
      setOcrLoadingText((window as any).__ocrLoadingText || null);
      setOcrIsProcessing((window as any).__ocrIsProcessing || false);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Save item names when component unmounts
  useEffect(() => {
    return () => {
      saveItemNamesFromList();
    };
  }, [currentList]);

  if (!currentList) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const unassignedItems = currentList.isSplitMode && currentList.groups
    ? currentList.items.filter(item => {
      // Check if this original item is fully represented in groups
      const totalInGroups = currentList.groups?.reduce((total, group) => {
        const matchingItems = group.items.filter(groupItem =>
          groupItem.id.startsWith(item.id + '-') || groupItem.id === item.id
        );
        return total + matchingItems.reduce((sum, matchingItem) => sum + matchingItem.quantity, 0);
      }, 0) || 0;

      // Item is unassigned if its total quantity is not fully represented in groups
      return totalInGroups < item.quantity;
    })
    : currentList.items;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackNavigation}
              className="mr-3 p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{currentList.name}</h1>
              <p className="text-sm text-gray-600">
                {new Date(currentList.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-secondary">{currencySymbol}{currentList.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{currentList.items.length} items</p>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="add-item-form bg-white border-b border-gray-200 p-4 w-full">
        <div className="space-y-3 w-full">
          {/* Item name field and camera - full width row */}
          <div className="flex gap-1 w-full items-stretch">
            <div className="flex-1 min-w-0">
              <AutocompleteInput
                value={newItem.name}
                onChange={(value) => setNewItem(prev => ({ ...prev, name: value }))}
                suggestions={itemNameSuggestions}
                placeholder={ocrIsProcessing ? (ocrLoadingText || "Loading...") : "Item name"}
                className="w-full px-4 py-3 text-base"
                disabled={ocrIsProcessing}
              />
            </div>
            <Button
              onClick={() => {
                setPhotoCaptureKey(prev => prev + 1);
                setShowPhotoCapture(true);
                setNewItem({ name: "", price: 0, quantity: 1, discountApplied: false, onHold: false });
              }}
              variant="outline"
              className="px-3 py-3 flex items-center justify-center w-12 shrink-0"
              title="Capture price tag with camera"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          {/* Price, quantity, and add button */}
          <div className="flex gap-2">
            <Input
              type="number"
              value={newItem.price || ""}
              onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
              placeholder={`${currencySymbol}0.00`}
              step="0.01"
              className="flex-1 px-4 py-3 text-base"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-gray-600 font-medium">Qty:</span>
              <QuantityInput
                value={newItem.quantity}
                onChange={(value) => setNewItem(prev => ({ ...prev, quantity: value }))}
                className="w-32"
              />
            </div>
            <Button
              onClick={handleAddItem}
              className="bg-primary text-white hover:bg-blue-800 px-4 py-3 flex items-center justify-center min-w-[44px] shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>



      {/* Items List / Groups */}
      <div className="flex-1 overflow-y-auto pb-24">
        {currentList.isSplitMode ? (
          <div className="p-4 space-y-4 pb-8">
            {currentList.groups?.map((group) => (
              <GroupContainer
                key={group.id}
                group={group}
                onItemRemove={handleRemoveItem}
                onDrop={handleDropOnGroup}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleGroupDragOver(group.id);
                }}
                onDragLeave={handleDragLeave}
                onDragStart={handleDragStart}
                onUpdateTarget={handleUpdateGroupTarget}
                editingGroupTarget={editingGroupTarget}
                setEditingGroupTarget={setEditingGroupTarget}
                isDragOver={dragOverGroup === group.id}
              />
            ))}

            {unassignedItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Unassigned Items</h3>
                <div className="space-y-2">
                  {unassignedItems.map((item) => {
                    // Calculate how many units are already assigned to groups
                    const assignedQuantity = currentList.groups?.reduce((total, group) => {
                      const matchingItems = group.items.filter(groupItem =>
                        groupItem.id.startsWith(item.id + '-') || groupItem.id === item.id
                      );
                      return total + matchingItems.reduce((sum, matchingItem) => sum + matchingItem.quantity, 0);
                    }, 0) || 0;

                    const remainingQuantity = item.quantity - assignedQuantity;
                    const unitPrice = item.price;

                    // Create individual draggable units for remaining quantity with proper numbering
                    return Array.from({ length: remainingQuantity }, (_, index) => {
                      const actualIndex = assignedQuantity + index + 1; // Start from where we left off
                      const unitItem: ShoppingItem = {
                        ...item,
                        id: `${item.id}-unassigned-${index}`,
                        quantity: 1,
                        total: unitPrice,
                        originalQuantity: item.quantity,
                        splitIndex: actualIndex
                      };

                      return (
                        <div
                          key={`${item.id}-unassigned-${index}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, unitItem)}
                          className="bg-white border border-yellow-300 rounded p-2 cursor-move hover:bg-yellow-50 transition-colors"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">
                              {item.name} ({actualIndex}/{item.quantity})
                            </span>
                            <span className="text-secondary font-medium">{currencySymbol}{unitPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    });
                  }).flat()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 pb-8">
            {currentList.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No items in this list yet</p>
                <p className="text-sm">Add some items to get started</p>
              </div>
            ) : (
              currentList.items.map((item) => (
                editingItem === item.id ? (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        <AutocompleteInput
                          value={editForm.name || ""}
                          onChange={(value) => setEditForm(prev => ({ ...prev, name: value }))}
                          suggestions={itemNameSuggestions}
                          placeholder="Item name"
                          className="w-full px-4 py-3 text-base"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                          <Input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full pl-6 pr-2 py-2 text-base"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-600 font-medium">Qty:</span>
                          <QuantityInput
                            value={editForm.quantity}
                            onChange={(value) => setEditForm(prev => ({ ...prev, quantity: value }))}
                            className="w-32"
                          />
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 min-w-[36px]"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:bg-gray-100 px-2 py-2 min-w-[36px]"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className={cn(
                    "bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm",
                    item.onHold && "bg-gray-100 opacity-60"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className={cn(
                          "font-medium",
                          item.onHold ? "text-gray-500" : "text-gray-900"
                        )}>{item.name}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-gray-600">{currencySymbol}{item.price.toFixed(2)}</span>
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className={cn(
                            "text-sm font-medium",
                            item.onHold ? "text-gray-500" : item.discountApplied ? "text-green-600" : "text-secondary"
                          )}>
                            {currencySymbol}{item.total.toFixed(2)}
                            {item.discountApplied && !item.onHold && <span className="ml-1 text-xs">(discounted)</span>}
                            {item.onHold && <span className="ml-1 text-xs">(on hold)</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.discount && canApplyDiscount(item) && (
                          <Button
                            variant={item.discountApplied ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleDiscount(item.id)}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="text-primary hover:bg-blue-50 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleHold(item.id)}
                          className={cn(
                            "p-1",
                            item.onHold
                              ? "text-orange-600 hover:bg-orange-50"
                              : "text-orange-600 hover:bg-orange-50"
                          )}
                          title={item.onHold ? "Resume item" : "Hold item"}
                        >
                          {item.onHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:bg-red-50 p-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Split Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        {!currentList.isSplitMode ? (
          <Button
            onClick={() => setShowSplitPanel(true)}
            className="w-full bg-accent text-white hover:bg-orange-600 py-3 text-base font-medium"
          >
            Split List
          </Button>
        ) : (
          <Button
            onClick={handleToggleSplitMode}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base font-medium"
          >
            Exit Split Mode
          </Button>
        )}
      </div>

      {/* Split Configuration Panel */}
      {showSplitPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 max-w-md mx-auto">
          <div className="bg-white w-full max-w-md rounded-t-lg p-6 max-h-[50vh] overflow-y-auto border-t-2 border-l-2 border-r-2 border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configure Split</h3>
              <Button
                variant="ghost"
                onClick={() => setShowSplitPanel(false)}
                className="p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500">Target Amount ({currencySymbol})</label>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500">Number of Groups</label>
                </div>
                <div className="w-8" />
              </div>
              {groupSpecs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <div className="w-32">
                    <Input
                      type="number"
                      value={spec.targetAmount}
                      onChange={(e) => {
                        const newSpecs = [...groupSpecs];
                        newSpecs[index] = { ...newSpecs[index], targetAmount: Number(e.target.value) };
                        setGroupSpecs(newSpecs);
                      }}
                      placeholder="25.00"
                      step="0.01"
                      className="w-full px-4 py-2 text-base"
                    />
                  </div>
                  <div className="w-32">
                    <QuantityInput
                      value={spec.count}
                      onChange={(value) => {
                        const newSpecs = [...groupSpecs];
                        newSpecs[index] = { ...newSpecs[index], count: value };
                        setGroupSpecs(newSpecs);
                      }}
                      min={1}
                      className="w-full"
                    />
                  </div>
                  {groupSpecs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSpecs = groupSpecs.filter((_, i) => i !== index);
                        setGroupSpecs(newSpecs);
                      }}
                      className="text-destructive hover:bg-red-50 p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {index === groupSpecs.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGroupSpecs([...groupSpecs, { targetAmount: 25, count: 2 }])}
                      className="text-primary hover:bg-blue-50 p-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSplitPanel(false)}
                  className="flex-1 py-3 text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRunBinPacking}
                  className="flex-1 bg-accent text-white hover:bg-orange-600 py-3 text-base font-medium"
                >
                  Split Items
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {currentList.isSplitMode && (
        <Button
          onClick={scrollToAddForm}
          className="fixed bottom-24 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg hover:bg-orange-600 hover:scale-110 transition-all duration-200"
          style={{ zIndex: 20 }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          key={photoCaptureKey}
          onExtractData={handlePhotoExtractData}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
}
