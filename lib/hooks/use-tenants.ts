import { useAuth } from "@/lib/auth-context";
import { CreateTenantRequest } from "@/lib/services/tenant-service";
import {
  useCreateTenantMutation,
  useGetTenantsQuery,
} from "@/lib/store/api";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import {
  extractErrorMessage,
  transformRtkQueryError,
} from "@/lib/utils/error-extractor";
import { skipToken } from "@reduxjs/toolkit/query";

export function useTenants() {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const {
    data: tenants = [],
    isLoading: loading,
    error,
    refetch,
  } = useGetTenantsQuery(token || skipToken);

  return {
    tenants,
    loading,
    error: extractErrorMessage(error),
    refetch: async () => {
      await refetch();
    },
  };
}

export function useTenantMutations() {
  const { session } = useAuth();
  const token = session?.idToken || null;

  const [
    createTenantMutation,
    { isLoading: createLoading, error: createError, reset: resetCreate },
  ] = useCreateTenantMutation();

  const createTenant = async (data: CreateTenantRequest) => {
    if (!token) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "You must be signed in to perform this action",
        { statusCode: 401 }
      );
    }
    try {
      await createTenantMutation({ data, token }).unwrap();
    } catch (err) {
      throw transformRtkQueryError(err);
    }
  };

  const getError = (): ApplicationError | null => {
    if (!createError) return null;
    return transformRtkQueryError(createError);
  };

  return {
    createTenant,
    loading: createLoading,
    error: getError(),
    clearError: () => {
      resetCreate();
    },
  };
}

