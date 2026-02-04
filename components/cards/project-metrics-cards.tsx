"use client";

import { Content } from "@/lib/store/api";
import {
  calculateConversionTimeMetrics,
  calculateProcessingMetrics,
  calculateContentStorageMetrics,
} from "@/lib/utils/metrics-calculator";
import { formatDuration } from "@/lib/utils/date-formatters";
import { Database, PlayCircle, Timer } from "lucide-react";
import { MetricCard, MetricItem } from "./metric-card";

interface ProjectMetricsCardsProps {
  content: Content[];
}

export function ProjectMetricsCards({ content }: ProjectMetricsCardsProps) {
  const storageMetrics = calculateContentStorageMetrics(content);
  const processingMetrics = calculateProcessingMetrics(content);
  const conversionMetrics = calculateConversionTimeMetrics(content);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <MetricCard
        icon={Database}
        title="Content Storage"
        description="Processed content only"
      >
        <div className="space-y-2">
          <MetricItem
            value={`${storageMetrics.totalFileSizeGB.toFixed(2)} GB`}
            label="Total storage"
          />
          <div className="border-t pt-2">
            <MetricItem
              value={`${storageMetrics.videoCount} videos, ${storageMetrics.imageCount} images`}
              label="Content breakdown"
            />
          </div>
          {storageMetrics.totalVideoMinutes > 0 && (
            <div className="border-t pt-2">
              <MetricItem
                value={`${storageMetrics.totalVideoMinutes.toFixed(2)} min`}
                label="Total video duration"
              />
            </div>
          )}
          {storageMetrics.totalVideoMinutes > 0 && (
            <div className="border-t pt-2">
              <MetricItem
                value={`${storageMetrics.mbPerMinute.toFixed(2)} MB/min`}
                label="Storage per minute"
              />
            </div>
          )}
        </div>
      </MetricCard>

      <MetricCard
        icon={PlayCircle}
        title="Processing"
        description="Content processing status"
      >
        <div className="space-y-2">
          <MetricItem
            value={processingMetrics.totalProcessed}
            label="Total processed"
          />
          <div className="border-t pt-2">
            <MetricItem
              value={processingMetrics.totalProcessing}
              label="Currently processing"
            />
          </div>
          <div className="border-t pt-2">
            <MetricItem
              value={processingMetrics.totalFailed}
              label="Total failed"
              variant="destructive"
            />
          </div>
        </div>
      </MetricCard>

      <MetricCard
        icon={Timer}
        title="Conversion Time"
        description="Per minute of video"
      >
        <div className="space-y-2">
          <MetricItem
            value={
              conversionMetrics.avgConversionTimePerMinute > 0
                ? formatDuration(conversionMetrics.avgConversionTimePerMinute)
                : "—"
            }
            label="Average conversion time"
          />
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              Based on {conversionMetrics.processedCount} processed{" "}
              {conversionMetrics.processedCount === 1 ? "video" : "videos"}
            </p>
          </div>
        </div>
      </MetricCard>
    </div>
  );
}

