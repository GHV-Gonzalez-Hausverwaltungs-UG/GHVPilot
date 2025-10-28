import Image from "next/image";
import React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formdata } from "@/types/formdatatype";

export function ImagePreviewGrid({
  files,
  setFormData,
}: {
  files: File[];
  setFormData: React.Dispatch<React.SetStateAction<formdata>>;
}) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Mobile Long-Press Handler
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleDelete = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index),
    }));
  };

  const handleReplace = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const newFile = target?.files ? target.files[0] : undefined;
      if (newFile) {
        setFormData((prev) => {
          const updated = [...(prev.files || [])];
          updated[index] = newFile;
          return { ...prev, files: updated };
        });
      }
    };
    input.click();
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 bg-muted/30 p-4 rounded-lg">
        {files.map((file, index) => {
          const objectUrl = URL.createObjectURL(file);

          return (
            <ContextMenu key={index}>
              <ContextMenuTrigger
                asChild
                onTouchStart={() => {
                  // ✅ Timer-Start im Ref speichern
                  pressTimer.current = setTimeout(() => {
                    const evt = new MouseEvent("contextmenu", {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                    });
                    document.getElementById(`img-${index}`)?.dispatchEvent(evt);
                  }, 600);
                }}
                onTouchEnd={() => {
                  // ✅ Timer stoppen
                  if (pressTimer.current) {
                    clearTimeout(pressTimer.current);
                    pressTimer.current = null;
                  }
                }}
              >
                <div
                  id={`img-${index}`}
                  className="relative w-32 h-32 border border-border rounded-lg overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={objectUrl}
                    alt={file.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full transition group-hover:opacity-75"
                    onClick={() => {
                      setPreviewUrl(objectUrl);
                      setIsDialogOpen(true);
                    }}
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center text-white text-xs transition">
                    Halten oder Rechtsklick
                  </div>
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-40">
                <ContextMenuItem
                  onClick={() => {
                    setPreviewUrl(objectUrl);
                    setIsDialogOpen(true);
                  }}
                >
                  👀 Ansehen
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleReplace(index)}>
                  🔄 Ersetzen
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDelete(index)}
                  className="text-red-500"
                >
                  🗑️ Löschen
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Preview"
              width={800}
              height={800}
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
