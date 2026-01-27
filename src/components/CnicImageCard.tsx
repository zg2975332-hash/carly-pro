import { useState } from "react";
import { Camera, Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CnicImageCardProps {
  label: string;
  imageUrl?: string;
  onImageChange?: (file: File) => void;
  onRemove?: () => void;
  isEditing?: boolean;
}

const CnicImageCard = ({
  label,
  imageUrl,
  onImageChange,
  onRemove,
  isEditing = false,
}: CnicImageCardProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(file);
    }
  };

  const handleCapture = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onImageChange) {
          onImageChange(file);
        }
      };
      input.click();
    } catch (error) {
      console.error("Camera access error:", error);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-foreground">{label}</p>
      
      <div className="relative aspect-[1.6/1] rounded-xl border-2 border-dashed border-border bg-muted/50 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setPreviewOpen(true)}
            />
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="absolute bottom-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {isEditing && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : isEditing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Upload {label}</p>
            <div className="flex gap-2">
              <label className="cursor-pointer p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <ImageIcon className="w-5 h-5" />
              </label>
              <button
                type="button"
                onClick={handleCapture}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No image</p>
          </div>
        )}
      </div>

      {/* Full-screen preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-background/95 backdrop-blur-lg">
          <div className="relative w-full h-full flex items-center justify-center">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={label}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CnicImageCard;