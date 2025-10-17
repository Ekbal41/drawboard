import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router"; // make sure it's react-router-dom
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import api from "@/api/axios";



export default function DrawBoard() {
  const { user } = useAuth();
  const { boardId } = useParams<any>();
  const navigate = useNavigate();
  const [text, setText] = useState("");

  // Socket for live collaboration
  const socket = useSocket(user?.id ?? "", {
    draw: (data: { color?: string }) => {
      console.log("Received changes:", data);
      if (data.color !== undefined) setText(data.color);
    },
  });

  useEffect(() => {
    if (!boardId || !socket) return;
    socket.emit("join-board", boardId);
  }, [boardId, socket]);

  // React Query mutation to save board data
  const saveMutation = useMutation<
    void,
    Error,
    { boardId: string; drawing: string }
  >(
    async ({ boardId, drawing }) => {
      await api.post("/main/boards/save", { boardId, drawing });
    },
    {
      onSuccess: () => {
        alert("Board saved successfully!");
      },
      onError: (err) => {
        console.error(err);
        alert("Failed to save board");
      },
    }
  );

  const handleSave = () => {
    if (!boardId) return;
    saveMutation.mutate({ boardId, drawing: text });
  };

  const handleBack = () => navigate("/boards"); // Adjust route as needed

  return (
    <div className="relative w-screen h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 flex flex-col gap-4 bg-white p-5 rounded-lg shadow-lg min-w-[300px]">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Board Input:</label>
          <Input
            type="text"
            value={text}
            onChange={(e) => {
              const value = e.target.value;
              setText(value);
              if (boardId) socket?.emit("draw", { boardId, color: value });
            }}
            placeholder="Type something for collaborators..."
          />
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save
          </Button>
          <Button
            onClick={handleBack}
            className="bg-gray-300 hover:bg-gray-400 text-black"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
