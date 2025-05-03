
import React, { useState, KeyboardEvent, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 10
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle comma, Enter, and Space
    if ([",", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      addTag();
    }
    
    // Handle Backspace to delete the last tag
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };
  
  const addTag = () => {
    if (inputValue.trim() !== "" && value.length < maxTags) {
      // Remove spaces, commas and convert to lowercase
      const newTag = inputValue.trim().toLowerCase().replace(/,/g, "");
      
      // Check if tag is not already in the list
      if (!value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      
      setInputValue("");
    }
  };
  
  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  
  return (
    <div 
      className="flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge key={index} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove tag</span>
          </button>
        </Badge>
      ))}
      
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-20 border-0 focus-visible:ring-0 p-0 h-7"
        disabled={value.length >= maxTags}
      />
    </div>
  );
}
