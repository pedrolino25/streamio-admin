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
import { ErrorMessage } from "@/components/ui/error-message";
import { SuccessMessage } from "@/components/ui/success-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Webhook } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  webhookTestSchema,
  WebhookTestFormValues,
} from "@/lib/schemas/webhook-schemas";
import { webhookService } from "@/lib/services/webhook-service";

export function WebhookTestDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState<unknown>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const form = useForm<WebhookTestFormValues>({
    resolver: zodResolver(webhookTestSchema),
    defaultValues: {
      webhookUrl: "",
    },
  });

  const handleSubmit = async (values: WebhookTestFormValues) => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setResponse(null);
    setStatusCode(null);

    try {
      const result = await webhookService.testWebhook(values.webhookUrl);
      setStatusCode(result.status);
      setResponse(result.response);
      setSuccess(result.status === 200);
      if (result.status !== 200 && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setError("");
      setSuccess(false);
      setResponse(null);
      setStatusCode(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Webhook className="mr-2 h-4 w-4" />
          Webhook Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Test</DialogTitle>
          <DialogDescription>
            Test a webhook URL by sending a POST request with an empty JSON
            body.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/webhook"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      The URL to send the webhook test request to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <ErrorMessage message={error} />}

              {statusCode !== null &&
                (success ? (
                  <SuccessMessage
                    message="Webhook test successful!"
                    details={`HTTP Status: ${statusCode}`}
                  />
                ) : (
                  <ErrorMessage
                    message={`Webhook test completed with error. HTTP Status: ${statusCode}`}
                  />
                ))}

              {response !== null && (
                <div className="space-y-2">
                  <FormLabel>Response</FormLabel>
                  <div className="rounded-md border border-input bg-muted p-3">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Close
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Webhook className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
