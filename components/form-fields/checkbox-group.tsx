"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function CheckboxGroup({
  options,
  selected,
  onChange,
}: CheckboxGroupProps) {
  const handleChange = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, id]);
    } else {
      onChange(selected.filter((s) => s !== id));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={selected.includes(option.id)}
            onCheckedChange={(checked) =>
              handleChange(option.id, checked === true)
            }
          />
          <Label
            htmlFor={option.id}
            className="text-sm font-normal text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

