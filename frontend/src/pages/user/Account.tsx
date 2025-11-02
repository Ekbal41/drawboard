import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DoorOpen, Key, Loader } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Account() {
  const { logout, user, refetchUser, authLoading } = useAuth();
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") !== "true") return;
    toast.success("Email verified successfully!");
    refetchUser();
    params.delete("verified");
    const newSearch = params.toString();
    const newUrl = newSearch
      ? `${location.pathname}?${newSearch}`
      : location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [location.search]);

  const sendEmailVerification = async () => {
    try {
      setSending(true);
      const res = await api.get("/verify/send-email-verification-link");
      navigate("/message?msg=" + encodeURIComponent(res.data.message));
    } catch {
      toast.error("Failed to send verification email. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap border p-4 rounded-lg bg-muted">
        <div className="flex items-center gap-4">
          <img
            src={
              "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small_2x/default-avatar-icon-of-social-media-user-vector.jpg"
            }
            alt="User Avatar"
            className="size-12 rounded-full"
          />
          <div>
            <h1 className="text-xl font-semibold">{user?.name}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={logout}
          className="flex items-center gap-2 w-full md:w-fit"
        >
          {authLoading === "logout" ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Logging Out
            </>
          ) : (
            <>
              <DoorOpen className="h-4 w-4" /> Log Out
            </>
          )}
        </Button>
      </div>
      {authLoading === "user" ? (
        <div>
          <AccountSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          {!user?.emailVerified && (
            <Card className="pt-0 overflow-hidden">
              <CardHeader className="border-b bg-muted pt-7">
                <CardTitle className="text-xl">Verify Your Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Your email is not verified yet. Click the button below to
                  receive a verification link. You need to verify your email to
                  access all features.
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="default"
                  onClick={sendEmailVerification}
                  disabled={sending}
                  className="w-full md:w-auto"
                >
                  {sending ? "Sending Email..." : "Send Verification Email"}
                </Button>
              </CardFooter>
            </Card>
          )}
          <Card className="pt-0 overflow-hidden">
            <CardHeader className="border-b bg-muted pt-7">
              <CardTitle className="text-xl">Update Password</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                You can update your password here. Make sure to use a strong and
                secure password.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link to="/auth/change-password" className="w-full md:w-auto">
                <Button
                  variant="default"
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl">
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Skeleton className="h-9 w-full md:w-40 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
