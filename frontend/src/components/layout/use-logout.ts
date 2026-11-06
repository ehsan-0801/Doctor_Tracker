"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      await authApi.logout();
    } catch {
      // The cookie is cleared server-side when reachable; continue to login either way.
    }
    queryClient.clear();
    toast.success("Signed out");
    router.replace("/login");
  };

  return { logout, pending };
}
