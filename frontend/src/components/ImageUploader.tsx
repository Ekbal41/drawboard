import { Upload } from "lucide-react";

interface ImageUploaderProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  preview?: string | null;
  label: string;
}

export default function ImageUploader({
  onChange,
  required = false,
  preview = null,
  label,
}: ImageUploaderProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <label className="cursor-pointer w-full">
        <div
          className="w-full h-34 p-4 bg-muted dark:border-secondary rounded-lg 
          border border-dashed flex items-center justify-center overflow-hidden"
        >
          {preview ? (
            <img
              src={preview}
              alt="Image Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/shop.png";
              }}
            />
          ) : (
            <Upload className="text-muted-foreground stroke-1" size={60} />
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </label>
      <p className="text-xs text-muted-foreground mt-3">
        {label} {required && "(Required)"}
      </p>
    </div>
  );
}
