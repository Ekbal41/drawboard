import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import DrawCanvas from "@/components/DrawCanvas";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Menu, X, UserMinus, UserPlus } from "lucide-react";

export default function DrawBoard() {
  const { user } = useAuth();
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [lines, setLines] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [expanded, setExpanded] = useState(false);
  const isRemoteUpdate = useRef(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cursors, setCursors] = useState<
    Record<
      string,
      {
        x: number;
        y: number;
        name: string;
        color: string;
      }
    >
  >({});

  const getUserColor = (userId: string) => {
    const figmaColors = [
      "#0D99FF",
      "#F24822",
      "#FF7B00",
      "#14AE5C",
      "#A259FF",
      "#E62C46",
      "#FFCD29",
      "#9C27B0",
    ];

    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return figmaColors[hash % figmaColors.length];
  };

  const {
    data: drawing,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["boardData", boardId],
    queryFn: () => api.get(`/main/boards/${boardId}`).then((res) => res.data),
    enabled: !!boardId,
  });

  useEffect(() => {
    if (drawing?.drawingData) {
      try {
        const parsed = JSON.parse(drawing.drawingData);
        if (Array.isArray(parsed)) {
          isRemoteUpdate.current = true;
          setLines(parsed);
        }
      } catch (err) {
        console.error("Failed to parse drawing data", err);
      }
    }
  }, [drawing]);

  const socket = useSocket(user?.id ?? "", {
    draw: (data: { drawing?: string }) => {
      if (data.drawing) {
        try {
          const parsed = JSON.parse(data.drawing);
          if (Array.isArray(parsed)) {
            isRemoteUpdate.current = true;
            setLines(parsed);
          }
        } catch (err) {
          console.error("Failed to parse socket drawing data", err);
        }
      }
    },
    "cursor-update": (data: {
      userId: string;
      userName: string;
      x: number;
      y: number;
    }) => {
      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          x: data.x,
          y: data.y,
          name: data.userName,
          color: getUserColor(data.userId),
        },
      }));
    },
    "cursor-remove": (data: { userId: string }) => {
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[data.userId];
        return newCursors;
      });
    },
  });

  useEffect(() => {
    if (!boardId || !socket) return;
    socket.emit("join-board", boardId);
  }, [boardId, socket]);

  const saveMutation = useMutation({
    mutationFn: async ({
      boardId,
      drawing,
    }: {
      boardId: string;
      drawing: string;
    }) => {
      await api.post("/main/boards/save", { boardId, drawing });
    },
    onSuccess: () => {
      toast.success("Board saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save board");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({
      boardId,
      userEmail,
    }: {
      boardId: string;
      userEmail: string;
    }) => {
      await api.post("/main/boards/collaborators", { boardId, userEmail });
    },
    onSuccess: () => {
      toast.success("Collaborator invited successfully!");
      setInviteEmail("");
      refetch();
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || "Failed to invite collaborator");
    },
  });

  const removeCollaborator = useMutation({
    mutationFn: async ({
      boardId,
      userId,
    }: {
      boardId: string;
      userId: string;
    }) => {
      await api.post("/main/boards/remove/collaborators", { boardId, userId });
    },
    onSuccess: () => {
      toast.success("Collaborator removed successfully!");
      refetch();
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || "Failed to remove collaborator");
    },
  });

  const handleSave = () => {
    if (!boardId) return;
    saveMutation.mutate({ boardId, drawing: JSON.stringify(lines) });
  };

  const handleLinesChange = (newLines: any[]) => {
    setLines(newLines);
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (boardId && socket) {
      socket.emit("draw", { boardId, drawing: JSON.stringify(newLines) });
    }
  };

  const handleBack = () => navigate("/dashboard");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSaveShortcut =
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (isSaveShortcut) {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [lines]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading board data...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          You're not signed in to Drawboard!
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Please sign in to access this drawing board and collaborate with
          others.
        </p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  const isCollaborator =
    drawing?.ownerId === user.id ||
    drawing?.collaborators?.some(
      (colab: any) => colab.user.email === user.email
    );
  const isOwner = drawing?.ownerId === user.id;

  if (!isCollaborator) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
        <Users className="size-16 text-primary mb-3" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          You don't have permission to access this board. Please ask the owner
          to invite you as a collaborator.
        </p>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-50 flex items-center justify-center">
      <DrawCanvas
        lines={lines}
        onLinesChange={handleLinesChange}
        onCursorMove={(x, y) => {
          if (boardId && socket && user) {
            socket.emit("cursor-move", {
              boardId,
              userId: user.id,
              userName: user.name || user.email,
              x,
              y,
            });
          }
        }}
        remoteCursors={cursors}
      />
      <div className="absolute top-6 z-50 left-6 flex items-center gap-2">
        <Button
          onClick={() => setExpanded(!expanded)}
          className="rounded-full"
          size={"icon"}
        >
          <Menu />
        </Button>
        {saveMutation.isPending && (
          <p className="flex items-center font-mono">
            <Loader2 className="animate-spin mr-2" />
            Saving...
          </p>
        )}
      </div>
      {expanded && (
        <div className="absolute top-6 z-50 left-6 flex flex-col bg-background rounded-2xl shadow-xl w-[320px] border">
          <div className="flex justify-between items-center border-b px-4 py-3 gap-4">
            <h1 className="text-lg font-semibold w-full">{drawing?.title}</h1>
            <Button
              onClick={() => setExpanded(!expanded)}
              className="rounded-full size-6"
              size={"icon"}
            >
              <X />
            </Button>
          </div>
          <div>
            <div className="px-4 py-3">
              <h3 className="text-lg font-semibold mb-3">Collaborators</h3>
              {isOwner && (
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    type="email"
                    placeholder="Collaborator's Email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (boardId)
                        inviteMutation.mutate({
                          boardId,
                          userEmail: inviteEmail,
                        });
                    }}
                    disabled={inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2 className="animate-spin size-4" />
                    ) : (
                      <UserPlus />
                    )}
                  </Button>
                </div>
              )}
              {drawing?.collaborators?.length > 0 ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  {drawing.collaborators.map((colab: any) => (
                    <li
                      key={colab.user.email}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-md transition hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-muted p-3">
                          <Users size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-primary">
                            {colab.user.name || "Unnamed"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {colab.user.email}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          size={"icon"}
                          variant={"ghost"}
                          className="rounded-full"
                          onClick={() => {
                            if (boardId) {
                              setRemovingId(colab.user.id);
                              removeCollaborator.mutate({
                                boardId,
                                userId: colab.user.id,
                              });
                            }
                          }}
                          disabled={
                            removingId === colab.user.id &&
                            removeCollaborator.isPending
                          }
                        >
                          {removingId === colab.user.id &&
                          removeCollaborator.isPending ? (
                            <Loader2 className="animate-spin size-4 ml-1" />
                          ) : (
                            <UserMinus size={16} />
                          )}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic">No collaborators yet.</p>
              )}
            </div>
            <div className="p-4 border-t space-y-4">
              <div
                className="text-sm bg-muted/50 border border-muted p-2 rounded break-words"
                style={{ wordBreak: "break-all" }}
              >
                {window.location.origin}/board/{boardId}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/board/${boardId}`
                  );
                  toast.success("Board link copied to clipboard!");
                }}
              >
                Copy Board Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
