import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function PasswordResetRequest() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await api.post("/auth/send-password-reset-link", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password reset link sent successfully");
      navigate("/");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Something went wrong!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    mutation.mutate({ email });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-2xl font-bold uppercase">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
