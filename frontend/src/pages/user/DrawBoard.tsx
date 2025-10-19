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
import { Loader2, Users, Menu, X } from "lucide-react";

export default function DrawBoard() {
  const { user } = useAuth();
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [lines, setLines] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [expanded, setExpanded] = useState(false);
  const isRemoteUpdate = useRef(false);

  const { data: drawing, isLoading } = useQuery({
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
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || "Failed to invite collaborator");
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
          You're not signed in
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

  if (!isCollaborator) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
        <Users className="w-12 h-12 text-gray-400 mb-3" />
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
      <DrawCanvas lines={lines} onLinesChange={handleLinesChange} />
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
        <div className="absolute top-6 z-50 left-6 flex flex-col gap-5 bg-white p-5 rounded-2xl shadow-xl w-[320px] border border-gray-200">
          <div className="flex justify-between items-center border-b pb-3 border-gray-200">
            <h1 className="text-lg font-semibold text-gray-800 truncate w-full">
              {drawing?.title}
            </h1>
            <Button
              onClick={() => setExpanded(!expanded)}
              className="rounded-full size-6"
              size={"icon"}
            >
              <X />
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Collaborators
            </h3>
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
                    inviteMutation.mutate({ boardId, userEmail: inviteEmail });
                }}
                disabled={inviteMutation.isPending}
              >
                Invite
              </Button>
            </div>
            {drawing?.collaborators?.length > 0 ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {drawing.collaborators.map((colab: any) => (
                  <li
                    key={colab.user.email}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 transition"
                  >
                    <div className="rounded-full bg-muted p-3">
                      <Users size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {colab.user.name || "Unnamed"}
                      </p>
                      <p>({colab.user.email})</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No collaborators yet.
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div
                className="text-sm text-gray-600 bg-muted p-2 rounded break-words"
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
