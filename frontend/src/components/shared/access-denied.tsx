import { ShieldAlert } from "lucide-react";
import { EmptyState } from "./states";

export function AccessDenied() {
  return (
    <div className="rounded-xl border bg-card">
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description="Ask an administrator if you need this permission."
      />
    </div>
  );
}
