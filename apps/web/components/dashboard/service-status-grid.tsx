"use client";

import { memo } from "react";
import type { ServiceMetrics, RealtimeEvent } from "@repo/types";
import { ServiceStatusCard } from "./service-status-card";
import { Skeleton } from "../ui/skeleton";

interface ServiceStatusGridProps {
  services: ServiceMetrics[] | undefined;
  isLoading?: boolean;
  recentEvents: RealtimeEvent[];
}

export const ServiceStatusGrid = memo(function ServiceStatusGrid({
  services,
  isLoading,
  recentEvents,
}: ServiceStatusGridProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={180} />
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: "0.875rem",
        }}
      >
        No services found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1rem",
      }}
    >
      {services.map((service) => (
        <ServiceStatusCard
          key={service.serviceId}
          service={service}
          recentEvents={recentEvents}
        />
      ))}
    </div>
  );
});
