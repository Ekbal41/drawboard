import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Plus, Trash, User } from "lucide-react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [open, setOpen] = useState(false);

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

  return (
    <div className="relative space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Whiteboards</h1>
        <Link to="/account">
          <Button variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
      </div>

      {/* Board Grid */}
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
          {boards.map((board: any) => (
            <Card
              key={board.id}
              className="hover:shadow-md transition cursor-pointer group"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <CardHeader>
                <CardTitle>{board.title}</CardTitle>
                <CardDescription>
                  Owner: {board.owner?.name || "Unknown"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {board.collaborators.length} collaborator
                  {board.collaborators.length !== 1 && "s"}
                </p>
              </CardContent>
              <CardFooter className="justify-end opacity-0 group-hover:opacity-100 transition">
                <Button
                  variant="destructive"
                  size="icon"
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
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
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
