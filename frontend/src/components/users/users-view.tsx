"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, MoreHorizontal, Pencil, Plus, Power, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { filterState, readSort, useUrlFilters } from "@/hooks/use-url-filters";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role, UserAccount, UserListParams } from "@/types/api";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserFormDialog } from "./user-form-dialog";

const FILTER_KEYS = ["search", "role", "status"] as const;
const URL_KEYS = [...FILTER_KEYS, "sortBy", "sortOrder"] as const;
const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function UsersView() {
  const session = useSession();
  const queryClient = useQueryClient();
  const { values, page, setFilters } = useUrlFilters(URL_KEYS);
  const { hasFilters, panelCount, clear } = filterState(values, FILTER_KEYS, setFilters);
  const [dialog, setDialog] = useState<{ kind: "create" } | { kind: "edit"; user: UserAccount } | null>(null);
  const [resetting, setResetting] = useState<UserAccount | null>(null);
  const [toggling, setToggling] = useState<UserAccount | null>(null);

  const sort = readSort(values.sortBy, values.sortOrder);
  const params: UserListParams = {
    page,
    limit: 10,
    search: values.search,
    role: values.role as Role | undefined,
    status: values.status as UserListParams["status"],
    ...sort,
  };
  const allowed = session.can("users:manage");
  const users = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    enabled: allowed,
  });

  const toggleActive = useMutation({
    mutationFn: (user: UserAccount) => usersApi.update(user._id, { active: !user.active }),
    onSuccess: async (user) => {
      toast.success(user.active ? `${user.name} reactivated` : `${user.name} deactivated and signed out`);
      setToggling(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Something went wrong."),
  });

  if (!session.isLoading && !allowed) return <AccessDenied />;

  const actions = (user: UserAccount) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${user.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => setDialog({ kind: "edit", user })}>
          <Pencil aria-hidden /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setResetting(user)}>
          <KeyRound aria-hidden /> Reset password
        </DropdownMenuItem>
        {user._id !== session.user?.id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant={user.active ? "destructive" : "default"} onSelect={() => setToggling(user)}>
              <Power aria-hidden /> {user.active ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const status = (user: UserAccount) =>
    user.active ? (
      <Badge variant="secondary" className="bg-success/10 font-normal text-success">Active</Badge>
    ) : (
      <Badge variant="outline" className="font-normal text-muted-foreground">Inactive</Badge>
    );

  const columns: Column<UserAccount>[] = [
    {
      id: "name",
      header: "User",
      sortKey: "name",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={u.name} photoUrl={u.photoUrl} className="size-9" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{u.name}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { id: "role", header: "Role", cell: (u) => ROLE_LABELS[u.role] },
    { id: "doctor", header: "Linked doctor", cell: (u) => u.doctor?.name ?? <span className="text-muted-foreground">—</span>, className: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell" },
    { id: "status", header: "Status", cell: status },
    { id: "lastLogin", header: "Last sign-in", cell: (u) => <span className="text-muted-foreground">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</span>, className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell" },
    { id: "created", header: "Created", sortKey: "createdAt", cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span> },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: actions, className: "w-14 text-right", headerClassName: "w-14" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can sign in and what each person can access."
        actions={
          <Button size="lg" className="h-10 px-4" onClick={() => setDialog({ kind: "create" })}>
            <Plus aria-hidden /> Add user
          </Button>
        }
      />
      <section className="overflow-hidden rounded-xl border bg-card" aria-label="Users">
        <FilterBar
          search={<SearchInput label="Search users" placeholder="Search by name or email…" value={values.search} onSearch={(search) => setFilters({ search })} />}
          activeCount={panelCount}
          canClear={hasFilters}
          onClear={clear}
        >
          <FilterSelect id="filter-role" label="Role" allLabel="All roles" value={values.role} onChange={(role) => setFilters({ role })} options={ROLE_OPTIONS} />
          <FilterSelect
            id="filter-status"
            label="Status"
            allLabel="Any status"
            value={values.status}
            onChange={(s) => setFilters({ status: s })}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <div className="hidden md:block" />
        </FilterBar>
        <DataTable
          caption="Users"
          columns={columns}
          rows={users.data?.data}
          getRowId={(u) => u._id}
          isLoading={users.isLoading || session.isLoading}
          isFetching={users.isFetching}
          error={users.error}
          onRetry={() => users.refetch()}
          sort={sort}
          onSortChange={(next) => setFilters({ sortBy: next.sortBy, sortOrder: next.sortOrder, page: 1 })}
          renderMobileCard={(u) => (
            <div className="flex items-start gap-3">
              <UserAvatar name={u.name} photoUrl={u.photoUrl} className="size-10" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span>{ROLE_LABELS[u.role]}</span>
                  {status(u)}
                </div>
              </div>
              {actions(u)}
            </div>
          )}
          empty={<EmptyState icon={UserCog} title={hasFilters ? "No users match your filters" : "No users yet"} />}
        />
        <Pagination pagination={users.data?.pagination} onPageChange={(next) => setFilters({ page: next })} noun="users" />
      </section>

      <UserFormDialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} user={dialog?.kind === "edit" ? dialog.user : undefined} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.active ? "Deactivate user?" : "Reactivate user?"}
        description={
          toggling?.active
            ? `${toggling.name} will be signed out immediately and will not be able to sign in.`
            : `${toggling?.name} will be able to sign in again.`
        }
        confirmLabel={toggling?.active ? "Deactivate" : "Reactivate"}
        pendingLabel="Saving…"
        destructive={!!toggling?.active}
        pending={toggleActive.isPending}
        onConfirm={() => toggling && toggleActive.mutate(toggling)}
      />
    </div>
  );
}
