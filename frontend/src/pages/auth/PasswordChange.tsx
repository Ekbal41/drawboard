import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useNavigate } from "react-router";
import api from "@/api/axios";
import { toast } from "sonner";

export default function PasswordChange() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const mutation = useMutation({
    mutationFn: async (data: {
      oldPassword?: string;
      newPassword: string;
      token?: string;
    }) => {
      const endpoint = token ? "/auth/reset-password" : "/auth/change-password";
      const payload = token
        ? { token, newPassword: data.newPassword }
        : { oldPassword: data.oldPassword, newPassword: data.newPassword };
      const res = await api.post(endpoint, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully");
      (() => (token ? navigate("/auth") : navigate(-1)))();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Something went wrong!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    mutation.mutate({
      oldPassword: token ? undefined : oldPassword,
      newPassword,
      token: token || undefined,
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-2xl font-bold uppercase">
            {token ? "Reset Password" : "Change Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {!token && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="oldPassword">Old Password</Label>
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  placeholder="********"
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="********"
                required
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Processing..."
                : token
                ? "Reset Password"
                : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
