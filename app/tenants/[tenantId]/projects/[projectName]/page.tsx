"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { decodeProjectName, encodeProjectName } from "@/lib/utils/project-url";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const projectName = params?.projectName
    ? decodeProjectName(params.projectName as string)
    : "";

  useEffect(() => {
    if (tenantId && projectName) {
      router.replace(
        `/tenants/${tenantId}/projects/${encodeProjectName(projectName)}/videos`
      );
    }
  }, [tenantId, projectName, router]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
