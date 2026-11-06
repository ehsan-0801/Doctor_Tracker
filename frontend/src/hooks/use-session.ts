"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { can, type Permission } from "@/lib/permissions";

export function useSession() {
  const session = useQuery({ queryKey: queryKeys.session, queryFn: authApi.sessionOrRedirect, staleTime: 5 * 60_000 });
  const user = session.data?.user;
  return {
    user,
    isLoading: session.isLoading,
    can: (permission: Permission) => can(user?.role, permission),
  };
}
