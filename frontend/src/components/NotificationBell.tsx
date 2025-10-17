import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useSocket } from "@/hooks/useSocket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ShoppingCart,
  User,
  AlertCircle,
  Mail,
  MailOpen,
  CheckCircle,
  Loader2,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";

interface NotificationPayload {
  productId?: string;
  stock?: number;
  userId?: string;
  orderId?: string;
  [key: string]: any;
}

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  type: "shop" | "user" | "system";
  read: boolean;
  targetId: string;
  payload?: NotificationPayload;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
  };
}
export default function NotificationBell({ types }: { types: string }) {
  const { user } = useAuth();
  const { shopId } = useParams<{ shopId: string }>();
  const queryClient = useQueryClient();
  const { dingSoundPlay } = useSoundPlayer({ ding: "/sounds/ding.wav" });
  const [shakebell, setShakebell] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [instantUnreadCount, setInstantUnreadCount] = useState<number | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const queryKey = useMemo(
    () => ["notifications", shopId, currentPage],
    [shopId, currentPage]
  );

  const { data, isLoading, isError, isRefetching, error } =
    useQuery<NotificationResponse>({
      queryKey,
      queryFn: async (): Promise<NotificationResponse> => {
        const { data } = await api.get("/system/notifications", {
          params: {
            shopId,
            page: currentPage,
            types,
          },
        });
        return data;
      },
    });

  useEffect(() => {
    if (data?.unreadCount !== undefined && instantUnreadCount === null) {
      setInstantUnreadCount(data.unreadCount);
    }
  }, [data?.unreadCount, instantUnreadCount]);

  useEffect(() => {
    if (data?.unreadCount !== undefined && instantUnreadCount !== null) {
      const diff = Math.abs(data.unreadCount - instantUnreadCount);
      if (diff > 1) {
        setInstantUnreadCount(data.unreadCount);
      }
    }
  }, [data?.unreadCount, instantUnreadCount]);

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {
    page: 1,
    total: 0,
    totalPages: 1,
  };
  const displayUnreadCount = instantUnreadCount ?? data?.unreadCount ?? 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/system/${notificationId}/read`);
      return response.data;
    },
    onMutate: async (notificationId: string) => {
      setInstantUnreadCount((prev) => Math.max(0, (prev ?? 0) - 1));
      await queryClient.cancelQueries({ queryKey: ["notifications", shopId] });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(
        queryKey,
        (old: NotificationResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        }
      );
      return { previousData };
    },
    onError: (context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setInstantUnreadCount((prev) => (prev ?? 0) + 1);
      toast.error("Failed to mark notification as read!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/system/notifications/read-all", {
        shopId,
        types,
      });
      return response.data;
    },
    onMutate: async () => {
      const previousCount = instantUnreadCount ?? 0;
      setInstantUnreadCount(0);
      await queryClient.cancelQueries({ queryKey: ["notifications", shopId] });
      queryClient.setQueriesData(
        { queryKey: ["notifications", shopId] },
        (old: NotificationResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          };
        }
      );
      return { previousCount };
    },
    onError: (context: any) => {
      if (context?.previousCount !== undefined) {
        setInstantUnreadCount(context.previousCount);
      }
      toast.error("Failed to mark all notifications as read!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
    },
  });

  const handleSocketNotification = useCallback(
    (payload: any) => {
      if (!payload || typeof payload !== "object") {
        return;
      }
      setInstantUnreadCount((prev) => (prev !== null ? prev + 1 : 1));
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
      }, 500);
    },
    [shopId, queryClient]
  );

  useSocket(user?.id, {
    notification: (n: any) => {
      const typeArray =
        types?.split(",").map((t) => t.trim().toLowerCase()) || [];
      let shouldHandle = false;

      if (typeArray.includes("shop")) {
        if (n.type === "shop" && n.identifier === shopId) {
          shouldHandle = true;
          if (n.event === "new_order") {
            queryClient.invalidateQueries({
              queryKey: ["orders"],
              exact: false,
            });
          }
        }
      }
      if (typeArray.includes("user") || typeArray.includes("system")) {
        if (n.type === "user" || n.type === "system") {
          shouldHandle = true;
        }
      }
      if (shouldHandle) {
        handleSocketNotification(n);
        dingSoundPlay();
        setShakebell(true);
        setTimeout(() => {
          setShakebell(false);
        }, 500);
      }
    },
  });
  const handlePageChange = useCallback(
    (page: number) => {
      if (page !== currentPage && page >= 1 && page <= pagination.totalPages) {
        setCurrentPage(page);
      }
    },
    [currentPage, pagination.totalPages]
  );

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "shop":
        return <ShoppingCart className="text-blue-500 w-5 h-5" />;
      case "user":
        return <User className="text-green-500 w-5 h-5" />;
      case "system":
        return <AlertCircle className="text-yellow-500 w-5 h-5" />;
      default:
        return <Bell className="text-gray-500 w-5 h-5" />;
    }
  }, []);

  useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load notifications!");
    }
  }, [isError, error]);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="relative" variant="outline" size="icon">
          {shakebell ? (
            <BellRing className="w-5 h-5 bell-ring" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          <AnimatePresence>
            {displayUnreadCount > 0 && (
              <motion.div
                key={`badge-${displayUnreadCount}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, type: "spring" }}
                className="absolute -top-2 -right-2"
              >
                <Badge
                  variant="destructive"
                  className="w-5 h-5 text-xs font-bold rounded-full flex items-center 
                  justify-center min-w-5"
                >
                  {displayUnreadCount > 99 ? "99+" : displayUnreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="max-w-xs relative min-w-xs mx-3 md:max-w-sm md:min-w-sm p-0 rounded-lg shadow-lg border bg-background"
        align="end"
        sideOffset={4}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {displayUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Mark All Read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading notifications...
              </span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-8 text-destructive">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to load notifications!</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm">No notifications yet.</span>
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownMenuItem
                      className={cn(
                        "flex items-start gap-3 p-4 cursor-pointer transition-colors rounded-none",
                        "hover:bg-accent focus:bg-accent group",
                        !notification.read
                          ? "bg-primary/20 dark:bg-primary/20 border-l-4 border-l-primary"
                          : "border-b"
                      )}
                      onClick={(e) => e.preventDefault()}
                    >
                      <div className="w-8 h-8 border flex items-center justify-center rounded-full bg-muted flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-foreground leading-snug 
                          group-hover:underline"
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dayjs(notification.createdAt).fromNow()}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          markAsReadMutation.mutate(notification.id)
                        }
                        disabled={
                          markAsReadMutation.isPending || notification.read
                        }
                        className="p-1 flex-shrink-0"
                        aria-label={
                          notification.read ? "Already read" : "Mark as read"
                        }
                      >
                        {notification.read ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={cn(
                      "rounded-md cursor-pointer",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {Array.from(
                  { length: Math.min(4, pagination.totalPages) },
                  (_, i) => {
                    const startPage = Math.max(
                      1,
                      Math.min(currentPage - 1, pagination.totalPages - 2)
                    );
                    const pageNum = startPage + i;

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                          className="rounded-md cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={cn(
                      "rounded-md cursor-pointer",
                      currentPage === pagination.totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        {isRefetching && (
          <div className="absolute top-0 left-0 right-0 h-1 w-full overflow-hidden bg-transparent">
            <div className="h-1 bg-primary animate-loader"></div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
