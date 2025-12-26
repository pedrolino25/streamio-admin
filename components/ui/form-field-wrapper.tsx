/**
 * FormFieldWrapper Component
 *
 * Reusable form field wrapper following Composition Pattern.
 * Encapsulates common form field structure.
 */

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ReactNode } from "react";

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label: string;
  description?: string;
  children: ReactNode;
  required?: boolean;
}

export function FormFieldWrapper({
  control,
  name,
  label,
  description,
  children,
  required = false,
}: FormFieldWrapperProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>{children}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
