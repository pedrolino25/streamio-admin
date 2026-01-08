"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function MetricCard({
  icon: Icon,
  title,
  description,
  children,
}: MetricCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-card p-3 sm:p-4">{children}</CardContent>
    </Card>
  );
}

interface MetricItemProps {
  value: React.ReactNode;
  label: string;
  variant?: "default" | "destructive";
}

export function MetricItem({
  value,
  label,
  variant = "default",
}: MetricItemProps) {
  return (
    <div>
      <p
        className={`text-xl font-bold ${
          variant === "destructive" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

