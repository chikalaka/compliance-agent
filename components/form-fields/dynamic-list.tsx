"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface DynamicListItem {
  id: string;
  name: string;
  role?: string;
}

interface DynamicListProps {
  items: DynamicListItem[];
  onChange: (items: DynamicListItem[]) => void;
  placeholder?: string;
  showRole?: boolean;
  rolePlaceholder?: string;
}

export function DynamicList({
  items,
  onChange,
  placeholder = "Name",
  showRole = false,
  rolePlaceholder = "Role",
}: DynamicListProps) {
  const addItem = () => {
    const newItem: DynamicListItem = {
      id: crypto.randomUUID(),
      name: "",
      role: showRole ? "" : undefined,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: "name" | "role",
    value: string
  ) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Input
            value={item.name}
            onChange={(e) => updateItem(item.id, "name", e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {showRole && (
            <Input
              value={item.role || ""}
              onChange={(e) => updateItem(item.id, "role", e.target.value)}
              placeholder={rolePlaceholder}
              className="flex-1"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(item.id)}
            className="shrink-0 text-zinc-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="mt-2"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}

