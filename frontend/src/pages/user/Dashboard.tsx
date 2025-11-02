import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Clock,
  Loader2,
  PenTool,
  Plus,
  Trash,
  User,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const {
    data: boards,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["whiteboards"],
    queryFn: async () => {
      const res = await api.get("/main/boards");
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  const createBoardMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post("/main/boards", { title });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Board created successfully");
      refetch();
      setNewTitle("");
      setOpen(false);
    },
    onError: () => toast.error("Failed to create board"),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/main/boards/${id}`);
    },
    onSuccess: () => {
      toast.success("Board deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete board"),
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return toast.error("Title is required");
    createBoardMutation.mutate(newTitle);
  };
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="relative space-y-5">
      <div
        className="w-full rounded-2xl p-6 bg-gradient-to-br from-indigo-500/10
       via-purple-500/10 to-pink-500/10 border border-border shadow-sm flex items-center 
        justify-between backdrop-blur-sm transition-all hover:shadow-md flex-wrap gap-4"
      >
        <div className="space-y-1">
          <h2 className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            {greeting},
            <span className="font-semibold text-foreground">Asif</span> 👋
          </h2>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Continue where you left off or explore new ideas today.
          </p>
        </div>

        <Link to="/account">
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
      </div>
      {boards?.length > 0 && (
        <h1 className="text-2xl font-semibold tracking-tight">
          Your Whiteboards
        </h1>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-red-500 text-center">Failed to load boards</p>
      ) : boards?.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No whiteboards yet. Click “+” to create one!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board: any) => {
            const isColab = board.collaborators.some(
              (colab: any) => colab?.userId === user?.id
            );
            return (
              <Card
                key={board.id}
                className="hover:shadow-md gap-0 transition cursor-pointer group relative p-0"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <CardHeader className="p-0">
                  <CardTitle className="text-xl flex items-center gap-3 border-b p-4">
                    <div className="bg-primary/20 text-primary p-1.5 rounded-lg">
                      <PenTool size={16} />
                    </div>
                    <p className="line-clamp-">
                      {board.title.slice(0, 20)}
                      {isColab && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Collab
                        </span>
                      )}
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4 space-y-2">
                  <div className="flex gap-2 items-center">
                    <UserCircle size={16} />
                    <p className="text-sm text-muted-foreground">
                      {board.owner?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Clock size={16} />
                    <p className="text-sm text-muted-foreground">
                      {new Date(board.updatedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <UserPlus size={16} />
                    <p className="text-sm text-muted-foreground">
                      {board.collaborators.length} collaborator
                      {board.collaborators.length !== 1 && "s"}
                    </p>
                  </div>
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBoardMutation.mutate(board.id);
                  }}
                >
                  {deleteBoardMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Whiteboard</DialogTitle>
            <DialogDescription>
              Give your new board a title and start collaborating instantly.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter board title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="my-3"
          />
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={createBoardMutation.isPending}
            >
              {createBoardMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Board"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
