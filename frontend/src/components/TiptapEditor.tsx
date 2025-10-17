import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List as BulletListIcon,
  ListOrdered as OrderedListIcon,
  Unlink as UnlinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TiptapEditor({
  onChange,
  value,
  placeholder = "Type your content here...",
}: any) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc pl-6",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal pl-6",
        },
      }),
      ListItem,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 min-h-[100px]",
      },
    },
  });

  useEffect(() => {
    if (editor && isLinkDialogOpen) {
      const { href } = editor.getAttributes("link");
      setLinkUrl(href || "");
    }
  }, [editor, isLinkDialogOpen]);

  const addLink = () => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setIsLinkDialogOpen(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  if (!editor) {
    return null;
  }

  return (
    <Card className="w-full p-0 rounded-lg shadow-xs">
      <CardContent className="space-y-2 p-0">
        <div className="flex gap-2 flex-wrap border-b p-2 bg-muted">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={editor.isActive("bold") ? "default" : "outline"}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <BoldIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={editor.isActive("italic") ? "default" : "outline"}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={editor.isActive("underline") ? "default" : "outline"}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Underline</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={editor.isActive("bulletList") ? "default" : "outline"}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <BulletListIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={editor.isActive("orderedList") ? "default" : "outline"}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <OrderedListIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ordered List</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Dialog
                  open={isLinkDialogOpen}
                  onOpenChange={setIsLinkDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={editor.isActive("link") ? "default" : "outline"}
                    >
                      <LinkIcon size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editor.isActive("link") ? "Edit Link" : "Add Link"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4">
                      <Input
                        placeholder="Enter URL"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsLinkDialogOpen(false);
                            setLinkUrl("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={addLink} disabled={!linkUrl}>
                          {editor.isActive("link") ? "Update Link" : "Add Link"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Link</p>
            </TooltipContent>
          </Tooltip>
          {editor.isActive("link") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={removeLink}>
                  <UnlinkIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove Link</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <ScrollArea className="h-[200px]">
          <EditorContent editor={editor} placeholder="Write something..." />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
