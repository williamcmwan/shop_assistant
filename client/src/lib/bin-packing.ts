import { ShoppingItem, ShoppingGroup } from "@shared/schema";

interface BinPackingItem {
  id: string;
  value: number;
  item: ShoppingItem;
}

export interface GroupSpec {
  targetAmount: number;
  count: number;
}

export class BinPackingAlgorithm {
  /**
   * First Fit Decreasing algorithm for bin packing
   * Sorts items in descending order by value and places each item in the first bin that has enough space
   * Can split items with multiple quantities across different groups
   * Items with applied discounts are kept together as single units
   */
  static firstFitDecreasing(
    items: ShoppingItem[],
    targetAmount: number,
    numberOfGroups: number
  ): ShoppingGroup[] {
    // Create individual units from items with quantities > 1
    // Don't split items with applied discounts - they must stay together
    const individualItems: BinPackingItem[] = [];
    
    items.forEach(item => {
      // Don't split items with applied discounts - treat as single unit
      if (item.discount && item.discountApplied) {
        individualItems.push({
          id: item.id,
          value: item.total,
          item: {
            ...item,
            // Keep original properties for discounted items
          }
        });
      } else {
        // Split non-discounted items into individual units
        const unitPrice = item.price;
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            id: `${item.id}-${i}`,
            value: unitPrice,
            item: {
              ...item,
              id: `${item.id}-${i}`,
              quantity: 1,
              total: unitPrice,
              originalQuantity: item.quantity,
              splitIndex: i + 1 // Add 1-based index for display
            }
          });
        }
      }
    });

    // Sort items by total value in descending order
    const sortedItems = individualItems.sort((a, b) => b.value - a.value);

    // Initialize groups
    const groups: ShoppingGroup[] = [];
    for (let i = 0; i < numberOfGroups; i++) {
      groups.push({
        id: `group-${i + 1}`,
        number: i + 1,
        targetAmount,
        total: 0,
        items: []
      });
    }

    // Place each item in the first group that has enough remaining space
    for (const binItem of sortedItems) {
      let placed = false;
      
      // Try to find a group with enough space
      for (const group of groups) {
        if (group.total + binItem.value <= targetAmount * 1.2) { // Allow 20% overflow
          group.items.push(binItem.item);
          group.total = Number((group.total + binItem.value).toFixed(2));
          placed = true;
          break;
        }
      }
      
      // If no group has enough space, place in the group with the least total
      if (!placed) {
        const minGroup = groups.reduce((min, group) => 
          group.total < min.total ? group : min
        );
        minGroup.items.push(binItem.item);
        minGroup.total = Number((minGroup.total + binItem.value).toFixed(2));
      }
    }

    return groups;
  }

  /**
   * Best Fit algorithm for bin packing
   * Places each item in the bin with the least remaining space that can still fit the item
   * Can split items with multiple quantities across different groups
   * Items with applied discounts are kept together as single units
   */
  static bestFit(
    items: ShoppingItem[],
    targetAmount: number,
    numberOfGroups: number
  ): ShoppingGroup[] {
    // Create individual units from items with quantities > 1
    // Don't split items with applied discounts - they must stay together
    const individualItems: BinPackingItem[] = [];
    
    items.forEach(item => {
      // Don't split items with applied discounts - treat as single unit
      if (item.discount && item.discountApplied) {
        individualItems.push({
          id: item.id,
          value: item.total,
          item: {
            ...item,
            // Keep original properties for discounted items
          }
        });
      } else {
        // Split non-discounted items into individual units
        const unitPrice = item.price;
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            id: `${item.id}-${i}`,
            value: unitPrice,
            item: {
              ...item,
              id: `${item.id}-${i}`,
              quantity: 1,
              total: unitPrice,
              originalQuantity: item.quantity,
              splitIndex: i + 1 // Add 1-based index for display
            }
          });
        }
      }
    });

    // Sort items by total value in descending order
    const sortedItems = individualItems.sort((a, b) => b.value - a.value);

    // Initialize groups
    const groups: ShoppingGroup[] = [];
    for (let i = 0; i < numberOfGroups; i++) {
      groups.push({
        id: `group-${i + 1}`,
        number: i + 1,
        targetAmount,
        total: 0,
        items: []
      });
    }

    // Place each item in the best fitting group
    for (const binItem of sortedItems) {
      let bestGroup: ShoppingGroup | null = null;
      let bestFit = Infinity;

      // Find the group with the least remaining space that can still fit the item
      for (const group of groups) {
        const remainingSpace = targetAmount - group.total;
        
        if (remainingSpace >= binItem.value && remainingSpace < bestFit) {
          bestFit = remainingSpace;
          bestGroup = group;
        }
      }

      // If no perfect fit found, use the group with the least total
      if (!bestGroup) {
        bestGroup = groups.reduce((min, group) => 
          group.total < min.total ? group : min
        );
      }

      bestGroup.items.push(binItem.item);
      bestGroup.total = Number((bestGroup.total + binItem.value).toFixed(2));
    }

    return groups;
  }

  /**
   * Optimized bin packing that tries both algorithms and returns the best result
   */
  static optimize(
    items: ShoppingItem[],
    targetAmount: number,
    numberOfGroups: number
  ): ShoppingGroup[] {
    if (items.length === 0) {
      return [];
    }

    const ffdResult = this.firstFitDecreasing(items, targetAmount, numberOfGroups);
    const bfResult = this.bestFit(items, targetAmount, numberOfGroups);

    // Calculate total excess for each result
    const ffdExcess = ffdResult.reduce((sum, group) => 
      sum + Math.max(0, group.total - targetAmount), 0
    );
    
    const bfExcess = bfResult.reduce((sum, group) => 
      sum + Math.max(0, group.total - targetAmount), 0
    );

    // Return the result with less total excess
    return ffdExcess <= bfExcess ? ffdResult : bfResult;
  }

  static optimizeMultiple(
    items: ShoppingItem[],
    groupSpecs: GroupSpec[]
  ): ShoppingGroup[] {
    // Expand group specs into individual groups
    const groups: ShoppingGroup[] = [];
    let groupId = 1;
    for (const spec of groupSpecs) {
      for (let i = 0; i < spec.count; i++) {
        groups.push({
          id: `group-${groupId++}`,
          number: groupId - 1,
          items: [],
          total: 0,
          targetAmount: spec.targetAmount
        });
      }
    }

    // Convert items to individual units
    // Don't split items with applied discounts - they must stay together
    const individualItems: { item: ShoppingItem; value: number }[] = [];
    for (const item of items) {
      // Don't split items with applied discounts - treat as single unit
      if (item.discount && item.discountApplied) {
        individualItems.push({
          item: {
            ...item,
            // Keep original properties for discounted items
          },
          value: item.total
        });
      } else {
        // Split non-discounted items into individual units
        for (let i = 0; i < item.quantity; i++) {
          const unitPrice = item.total / item.quantity;
          individualItems.push({
            item: {
              ...item,
              id: `${item.id}-${i + 1}`,
              quantity: 1,
              total: unitPrice,
              originalQuantity: item.quantity,
              splitIndex: i + 1
            },
            value: unitPrice
          });
        }
      }
    }

    // Sort groups by target amount (descending) and items by value (descending)
    const sortedGroups = [...groups].sort((a, b) => b.targetAmount - a.targetAmount);
    const sortedItems = [...individualItems].sort((a, b) => b.value - a.value);

    // Try multiple approaches and pick the best one
    const approaches = [
      this.tryGreedyApproach(sortedGroups, sortedItems),
      this.tryBalancedApproach(sortedGroups, sortedItems),
      this.tryTargetFirstApproach(sortedGroups, sortedItems)
    ];

    // Find the best result based on how many groups meet target and total variance
    let bestResult = approaches[0];
    let bestScore = this.calculateGroupingScore(approaches[0]);

    for (const result of approaches) {
      const score = this.calculateGroupingScore(result);
      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    // Apply final optimization to the best result
    const optimizedGroups = this.optimizeBySwapping(bestResult);
    
    return optimizedGroups;
  }

  private static calculateGroupingScore(groups: ShoppingGroup[]): number {
    let score = 0;
    let groupsOverTarget = 0;
    
    for (const group of groups) {
      if (group.total >= group.targetAmount) {
        groupsOverTarget++;
        // Bonus for being over target, but penalty for being too far over
        const overage = group.total - group.targetAmount;
        score += 1000 - Math.min(overage * 10, 500); // Prefer small overages
      } else {
        // Heavy penalty for being under target
        const shortage = group.targetAmount - group.total;
        score -= shortage * 100;
      }
    }
    
    // Bonus for having more groups over target
    score += groupsOverTarget * 10000;
    
    return score;
  }

  private static tryGreedyApproach(groups: ShoppingGroup[], items: ShoppingItem[]): ShoppingGroup[] {
    const filledGroups = groups.map(g => ({ ...g, items: [...g.items], total: g.total }));
    const remainingItems = [...items];

    // Fill each group greedily
    for (let g = 0; g < filledGroups.length; g++) {
      const group = filledGroups[g];
      
      while (group.total < group.targetAmount && remainingItems.length > 0) {
        let bestIdx = -1;
        let bestScore = -Infinity;
        
        for (let i = 0; i < remainingItems.length; i++) {
          const newTotal = group.total + remainingItems[i].value;
          const distanceToTarget = Math.abs(newTotal - group.targetAmount);
          const isOverTarget = newTotal > group.targetAmount;
          
          const score = -distanceToTarget - (isOverTarget ? 0.1 : 0);
          
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        
        if (bestIdx === -1) break;
        
        const selectedItem = remainingItems.splice(bestIdx, 1)[0];
        group.items.push(selectedItem.item);
        group.total = Number((group.total + selectedItem.value).toFixed(2));
      }
    }

    // Distribute remaining items
    while (remainingItems.length > 0) {
      const bestGroup = filledGroups.reduce((best, group) => 
        Math.abs(group.total - group.targetAmount) < Math.abs(best.total - best.targetAmount) ? group : best
      );
      
      const item = remainingItems.shift()!;
      bestGroup.items.push(item.item);
      bestGroup.total = Number((bestGroup.total + item.value).toFixed(2));
    }

    return filledGroups;
  }

  private static tryBalancedApproach(groups: ShoppingGroup[], items: ShoppingItem[]): ShoppingGroup[] {
    const filledGroups = groups.map(g => ({ ...g, items: [...g.items], total: g.total }));
    const remainingItems = [...items];

    // Distribute items more evenly across groups
    let currentGroup = 0;
    
    while (remainingItems.length > 0) {
      const group = filledGroups[currentGroup % filledGroups.length];
      
      // Find the best item for this group
      let bestIdx = -1;
      let bestScore = -Infinity;
      
      for (let i = 0; i < remainingItems.length; i++) {
        const newTotal = group.total + remainingItems[i].value;
        const distanceToTarget = Math.abs(newTotal - group.targetAmount);
        const isOverTarget = newTotal > group.targetAmount;
        
        // Prefer items that get us closer to target
        const score = -distanceToTarget - (isOverTarget ? 0.1 : 0);
        
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      
      if (bestIdx === -1) break;
      
      const selectedItem = remainingItems.splice(bestIdx, 1)[0];
      group.items.push(selectedItem.item);
      group.total = Number((group.total + selectedItem.value).toFixed(2));
      
      currentGroup++;
    }

    return filledGroups;
  }

  private static tryTargetFirstApproach(groups: ShoppingGroup[], items: ShoppingItem[]): ShoppingGroup[] {
    const filledGroups = groups.map(g => ({ ...g, items: [...g.items], total: g.total }));
    const remainingItems = [...items];

    // First, try to get each group to exactly target amount
    for (let g = 0; g < filledGroups.length; g++) {
      const group = filledGroups[g];
      
      while (group.total < group.targetAmount && remainingItems.length > 0) {
        // Find item that gets us closest to target without going over
        let bestIdx = -1;
        let bestDistance = Infinity;
        
        for (let i = 0; i < remainingItems.length; i++) {
          const newTotal = group.total + remainingItems[i].value;
          if (newTotal <= group.targetAmount) {
            const distance = group.targetAmount - newTotal;
            if (distance < bestDistance) {
              bestDistance = distance;
              bestIdx = i;
            }
          }
        }
        
        if (bestIdx === -1) break;
        
        const selectedItem = remainingItems.splice(bestIdx, 1)[0];
        group.items.push(selectedItem.item);
        group.total = Number((group.total + selectedItem.value).toFixed(2));
      }
    }

    // Then, try to get all groups over target by moving items
    const underTargetGroups = filledGroups.filter(g => g.total < g.targetAmount);
    const overTargetGroups = filledGroups.filter(g => g.total > g.targetAmount);
    
    for (const underGroup of underTargetGroups) {
      for (const overGroup of overTargetGroups) {
        // Find items that could help under group reach target
        for (let i = 0; i < overGroup.items.length; i++) {
          const item = overGroup.items[i];
          
          if (item.discount && item.discountApplied) continue;
          
          const newUnderTotal = underGroup.total + item.total;
          const newOverTotal = overGroup.total - item.total;
          
          if (newUnderTotal >= underGroup.targetAmount && newOverTotal >= overGroup.targetAmount) {
            overGroup.items.splice(i, 1);
            underGroup.items.push(item);
            overGroup.total = Number(newOverTotal.toFixed(2));
            underGroup.total = Number(newUnderTotal.toFixed(2));
            break;
          }
        }
      }
    }

    // Distribute remaining items
    while (remainingItems.length > 0) {
      const bestGroup = filledGroups.reduce((best, group) => 
        Math.abs(group.total - group.targetAmount) < Math.abs(best.total - best.targetAmount) ? group : best
      );
      
      const item = remainingItems.shift()!;
      bestGroup.items.push(item.item);
      bestGroup.total = Number((bestGroup.total + item.value).toFixed(2));
    }

    return filledGroups;
  }

  private static optimizeBySwapping(groups: ShoppingGroup[]): ShoppingGroup[] {
    let improved = true;
    let iterations = 0;
    const maxIterations = 200; // Increased iterations for better optimization
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      // Phase 1: Try all possible swaps between groups
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const groupA = groups[i];
          const groupB = groups[j];
          
          // Calculate current distances to targets
          const currentDistanceA = Math.abs(groupA.total - groupA.targetAmount);
          const currentDistanceB = Math.abs(groupB.total - groupB.targetAmount);
          const currentTotalDistance = currentDistanceA + currentDistanceB;
          
          // Try swapping each item from group A with each item from group B
          for (let itemAIdx = 0; itemAIdx < groupA.items.length; itemAIdx++) {
            for (let itemBIdx = 0; itemBIdx < groupB.items.length; itemBIdx++) {
              const itemA = groupA.items[itemAIdx];
              const itemB = groupB.items[itemBIdx];
              
              // Don't swap discounted items - they must stay together to maintain discount integrity
              if ((itemA.discount && itemA.discountApplied) || 
                  (itemB.discount && itemB.discountApplied)) {
                continue;
              }
              
              // Calculate new totals after swap
              const newTotalA = groupA.total - itemA.total + itemB.total;
              const newTotalB = groupB.total - itemB.total + itemA.total;
              
              // Calculate new distances to targets
              const newDistanceA = Math.abs(newTotalA - groupA.targetAmount);
              const newDistanceB = Math.abs(newTotalB - groupB.targetAmount);
              const newTotalDistance = newDistanceA + newDistanceB;
              
              // If the swap improves the overall fit, perform it
              if (newTotalDistance < currentTotalDistance) {
                // Perform the swap
                groupA.items[itemAIdx] = itemB;
                groupB.items[itemBIdx] = itemA;
                groupA.total = Number(newTotalA.toFixed(2));
                groupB.total = Number(newTotalB.toFixed(2));
                
                improved = true;
                break; // Move to next group pair
              }
            }
            if (improved) break;
          }
        }
      }
      
      // Phase 2: Try moving single items to better groups (if no swaps improved)
      if (!improved) {
        for (let i = 0; i < groups.length; i++) {
          for (let j = 0; j < groups.length; j++) {
            if (i === j) continue;
            
            const sourceGroup = groups[i];
            const targetGroup = groups[j];
            
            // Try moving each item from source to target
            for (let itemIdx = 0; itemIdx < sourceGroup.items.length; itemIdx++) {
              const item = sourceGroup.items[itemIdx];
              
              // Don't move discounted items
              if (item.discount && item.discountApplied) {
                continue;
              }
              
              // Calculate current and new distances
              const currentSourceDistance = Math.abs(sourceGroup.total - sourceGroup.targetAmount);
              const currentTargetDistance = Math.abs(targetGroup.total - targetGroup.targetAmount);
              const currentTotalDistance = currentSourceDistance + currentTargetDistance;
              
              const newSourceTotal = sourceGroup.total - item.total;
              const newTargetTotal = targetGroup.total + item.total;
              const newSourceDistance = Math.abs(newSourceTotal - sourceGroup.targetAmount);
              const newTargetDistance = Math.abs(newTargetTotal - targetGroup.targetAmount);
              const newTotalDistance = newSourceDistance + newTargetDistance;
              
              // If moving the item improves the overall fit, do it
              if (newTotalDistance < currentTotalDistance) {
                // Move the item
                sourceGroup.items.splice(itemIdx, 1);
                targetGroup.items.push(item);
                sourceGroup.total = Number(newSourceTotal.toFixed(2));
                targetGroup.total = Number(newTargetTotal.toFixed(2));
                
                improved = true;
                break;
              }
            }
            if (improved) break;
          }
          if (improved) break;
        }
      }
      
      // Phase 3: Try to get all groups over target by moving items from over-target to under-target groups
      if (!improved) {
        const underTargetGroups = groups.filter(g => g.total < g.targetAmount);
        const overTargetGroups = groups.filter(g => g.total > g.targetAmount);
        
        for (const underGroup of underTargetGroups) {
          for (const overGroup of overTargetGroups) {
            // Find the best item to move from over to under
            let bestItem = null;
            let bestImprovement = 0;
            
            for (const item of overGroup.items) {
              // Don't move discounted items
              if (item.discount && item.discountApplied) {
                continue;
              }
              
              const newUnderTotal = underGroup.total + item.total;
              const newOverTotal = overGroup.total - item.total;
              
              // Check if this move helps get under group closer to target
              if (newUnderTotal >= underGroup.targetAmount && newOverTotal >= overGroup.targetAmount) {
                const improvement = (newUnderTotal - underGroup.targetAmount) - (overGroup.total - overGroup.targetAmount);
                if (improvement > bestImprovement) {
                  bestImprovement = improvement;
                  bestItem = item;
                }
              }
            }
            
            if (bestItem) {
              // Move the best item
              const itemIndex = overGroup.items.indexOf(bestItem);
              overGroup.items.splice(itemIndex, 1);
              underGroup.items.push(bestItem);
              overGroup.total = Number((overGroup.total - bestItem.total).toFixed(2));
              underGroup.total = Number((underGroup.total + bestItem.total).toFixed(2));
              
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
    }
    
    return groups;
  }
}

// Helper: Try to rearrange items between groups to meet all targets (limited-depth DFS)
function tryRearrange(groups: ShoppingGroup[], allItems: ShoppingItem[], depth = 0, maxDepth = 1000, visited = new Set<string>()): ShoppingGroup[] | null {
  if (depth > maxDepth) return null;
  
  // Create a hash of the current state to avoid revisiting
  const stateHash = groups.map(g => `${g.total.toFixed(2)}:${g.items.map(i => i.id).sort().join(',')}`).join('|');
  if (visited.has(stateHash)) return null;
  visited.add(stateHash);
  
  // Check if all groups meet their targets
  if (groups.every(g => g.total >= g.targetAmount)) {
    return groups.map(g => ({ ...g, items: [...g.items] }));
  }
  
  // Try swapping items between groups that are under target
  const underTargetGroups = groups.map((g, i) => ({ group: g, index: i })).filter(({ group }) => group.total < group.targetAmount);
  const overTargetGroups = groups.map((g, i) => ({ group: g, index: i })).filter(({ group }) => group.total > group.targetAmount);
  
  // Try swaps between under-target and over-target groups
  for (const { group: underGroup, index: underIdx } of underTargetGroups) {
    for (const { group: overGroup, index: overIdx } of overTargetGroups) {
      for (let m = 0; m < underGroup.items.length; m++) {
        for (let n = 0; n < overGroup.items.length; n++) {
          const itemA = underGroup.items[m];
          const itemB = overGroup.items[n];
          
          // Don't swap discounted items - they must stay together to maintain discount integrity
          if ((itemA.discount && itemA.discountApplied) || 
              (itemB.discount && itemB.discountApplied)) {
            continue;
          }
          
          // Create new groups with the swap
          const newGroups = groups.map(g => ({ ...g, items: [...g.items], total: g.total }));
          
          // Only swap if it helps
          const underNewTotal = newGroups[underIdx].total - itemA.total + itemB.total;
          const overNewTotal = newGroups[overIdx].total - itemB.total + itemA.total;
          
          if (underNewTotal >= newGroups[underIdx].targetAmount && overNewTotal >= newGroups[overIdx].targetAmount) {
            newGroups[underIdx].items[m] = itemB;
            newGroups[overIdx].items[n] = itemA;
            newGroups[underIdx].total = Number(underNewTotal.toFixed(2));
            newGroups[overIdx].total = Number(overNewTotal.toFixed(2));
            
            // Recurse
            const result = tryRearrange(newGroups, allItems, depth + 1, maxDepth, visited);
            if (result) return result;
          }
        }
      }
    }
  }
  
  return null;
}
