"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usersApi } from "@/lib/api/endpoints";
import { applyApiErrors } from "@/lib/form-errors";
import { passwordSchema } from "@/lib/validations";
import type { UserAccount } from "@/types/api";

const schema = z.object({ password: passwordSchema });

export function ResetPasswordDialog({ user, onClose }: { user: UserAccount | null; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "" } });

  useEffect(() => {
    if (user) reset({ password: "" });
  }, [user, reset]);

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!user) return;
    try {
      await usersApi.resetPassword(user._id, password);
      toast.success(`Password reset for ${user.name}`, { description: "They have been signed out on all devices." });
      onClose();
    } catch (error) {
      applyApiErrors(error, setError, ["password"]);
    }
  });

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {user?.name}. Share it with them securely.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="new-password" label="New password" error={errors.password?.message} hint="At least 8 characters with a letter and a number.">
            <Input {...fieldAria("new-password", errors.password?.message)} type="password" className="h-10" autoComplete="new-password" {...register("password")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
