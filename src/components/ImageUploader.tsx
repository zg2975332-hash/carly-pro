import { useState } from "react";
import { Camera, Image as ImageIcon, X, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  maxImages?: number;
  isEditing?: boolean;
}

const ImageUploader = ({
  images,
  onImagesChange,
  onUpload,
  maxImages = 15,
  isEditing = false,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        if (images.length + newUrls.length >= maxImages) break;
        const url = await onUpload(file);
        newUrls.push(url);
      }
      onImagesChange([...images, ...newUrls]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && images.length < maxImages) {
        setUploading(true);
        try {
          const url = await onUpload(file);
          onImagesChange([...images, url]);
        } catch (error) {
          console.error("Capture upload failed:", error);
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
            onClick={() => {
              setSelectedIndex(index);
              setPreviewImage(url);
            }}
          >
            <img
              src={url}
              alt={`Car image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {isEditing && images.length < maxImages && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <div className="flex gap-1">
                  <label className="cursor-pointer p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <ImageIcon className="w-4 h-4" />
                  </label>
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {images.length}/{maxImages}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {images.length === 0 && !isEditing && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-background/95 backdrop-blur-lg">
          <div className="relative">
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
              />
            )}
            
            {/* Navigation dots */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {images.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIndex(index);
                      setPreviewImage(url);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      selectedIndex === index ? "bg-primary w-4" : "bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUploader;