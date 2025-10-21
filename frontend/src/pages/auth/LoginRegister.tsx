import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router";

function LoginRegister() {
  const { login, register, authLoading, error } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      console.error("Auth error:", err);
    }
  };
  return (
    <div className="flex flex-col min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-2xl font-bold uppercase">
            {isRegister ? "Create Account" : "Welcome Back"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 uppercase">
              <Info />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" disabled={authLoading !== null}>
              {isRegister
                ? authLoading === "register"
                  ? "Registering..."
                  : "Register to Drawboard"
                : authLoading === "login"
                ? "Logging in..."
                : "Login To Drawboard"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegister(!isRegister)}
              className="italic"
            >
              {isRegister ? "Already have an account?" : "Need an account?"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Link
        to="/auth/request-password-reset"
        className="mt-4 underline uppercase text-xs hover:text-blue-500 transition-colors"
      >
        Need to Reset Your Password?
      </Link>
    </div>
  );
}

export default LoginRegister;
