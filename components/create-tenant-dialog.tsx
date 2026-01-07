"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-container";
import { useTenantMutations } from "@/lib/hooks/use-tenants";
import {
  tenantFormSchema,
  TenantFormValues,
} from "@/lib/schemas/tenant-schemas";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTenantDialogProps {
  onSuccess: () => void;
}

export function CreateTenantDialog({ onSuccess }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    createTenant,
    loading,
    error: mutationError,
    clearError,
  } = useTenantMutations();
  const { success, error: showErrorToast } = useToast();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      organization: "",
    },
  });

  const handleError = (error: unknown) => {
    const appError = error instanceof ApplicationError ? error : null;
    const errorMessage = appError?.message || "Failed to create tenant";

    if (appError?.code === ErrorCode.CONFLICT) {
      showErrorToast("A tenant with this organization name already exists");
    } else if (appError?.code === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Your session has expired. Please sign in again.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleSubmit = async (values: TenantFormValues) => {
    clearError();

    try {
      await createTenant(values);
      setOpen(false);
      form.reset();
      success("Tenant created successfully!");
      onSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      clearError();
    }
  };

  const displayError = mutationError?.message || null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="Create new tenant">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New Tenant
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        aria-describedby="create-tenant-description"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription id="create-tenant-description">
                Create a new tenant to generate an API key for accessing the
                Media Processing Platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="organization">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        id="organization"
                        placeholder="My Organization"
                        {...field}
                        disabled={loading}
                        aria-describedby="organization-description organization-error"
                        aria-invalid={!!form.formState.errors.organization}
                      />
                    </FormControl>
                    <FormDescription id="organization-description">
                      The name of your organization
                    </FormDescription>
                    <FormMessage id="organization-error" />
                  </FormItem>
                )}
              />
              {displayError && (
                <ErrorMessage message={displayError} role="alert" />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                aria-label="Cancel tenant creation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                aria-label={loading ? "Creating tenant..." : "Create tenant"}
              >
                {loading ? "Creating..." : "Create Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

