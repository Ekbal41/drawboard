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
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [newTitle, setNewTitle] = useState("");

  // 🧩 Fetch all boards
  const {
    data: boards,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await api.get("/main/boards");
      return res.data;
    },
  });

  // 🧩 Create a new board
  const createBoardMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post("/main/boards", { title });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Board created successfully");
      refetch();
      setNewTitle("");
    },
    onError: () => toast.error("Failed to create board"),
  });

  // 🧩 Delete a board
  const deleteBoardMutation = useMutation({
    mutationFn: async (id) => {
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Enter board title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleCreate} disabled={createBoardMutation.isPending}>
          {createBoardMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" /> Create
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-red-500">Failed to load boards</p>
      ) : boards?.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No boards yet. Create one!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board: any) => (
            <Card
              key={board.id}
              className="hover:shadow-md transition cursor-pointer"
              onClick={() => (window.location.href = `/board/${board.id}`)}
            >
              <CardHeader>
                <CardTitle>{board.title}</CardTitle>
                <CardDescription>
                  Owner: {board.owner?.name || "Unknown"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {board.collaborators.length} collaborator
                  {board.collaborators.length !== 1 && "s"}
                </p>
              </CardContent>
              <CardFooter className="justify-end">
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
    </div>
  );
}
