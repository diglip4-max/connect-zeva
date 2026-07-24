import { useState, useEffect, useCallback } from "react";
import moment from "moment";

import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ExternalLink,
  Forward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "@/lib/formatDate";
import ForwardMessageDialog from "./ForwardMessageDialog";

function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// office docs (word/excel/ppt) ke liye Google Docs Viewer se preview
const OFFICE_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const AttachmentViewer = () => {
  const attachment = useUIStore((s) => s.viewerAttachment);
  const gallery = useUIStore((s) => s.viewerGallery);
  const attachmentSenderInfo = useUIStore((s) => s.attachmentSenderInfo);
  const selectedMessageId = useUIStore((s) => s.selectedMessageId);
  const canForward = selectedMessageId !== null;
  const openViewer = useUIStore((s) => s.openViewer);
  const closeViewer = useUIStore((s) => s.closeViewer);

  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentIndex = gallery.findIndex((g) => g.url === attachment?.url);
  const hasGalleryNav = gallery.length > 1 && currentIndex !== -1;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  useEffect(() => {
    resetTransform();
  }, [attachment?.url, resetTransform]);

  const goToNext = useCallback(() => {
    if (!hasGalleryNav) return;
    const nextIndex = (currentIndex + 1) % gallery.length;
    openViewer(gallery[nextIndex] as any, gallery);
  }, [hasGalleryNav, currentIndex, gallery, openViewer]);

  const goToPrev = useCallback(() => {
    if (!hasGalleryNav) return;
    const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    openViewer(gallery[prevIndex] as any, gallery);
  }, [hasGalleryNav, currentIndex, gallery, openViewer]);

  // keyboard shortcuts
  useEffect(() => {
    if (!attachment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attachment, closeViewer, goToNext, goToPrev]);

  if (!attachment) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: try opening in new tab if fetch fails
      window.open(attachment.url, "_blank");
    }
  };
  const isOfficeDoc = OFFICE_MIME_TYPES.includes(attachment.mimeType);
  const isPdf = attachment.mimeType === "application/pdf";

  console.log({
    canForward,
    isForwardModalOpen,
    selectedMessageId,
    attachmentSenderInfo,
  });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background backdrop-blur-sm">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 bg-card/50 px-3 backdrop-blur-sm md:px-4">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={attachmentSenderInfo?.avatarUrl || ""} alt={""} />
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {getInitials(attachmentSenderInfo?.name || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="truncate text-sm font-medium">
              {attachmentSenderInfo?.name || ""} <span className="mx-2">⋅</span>
              {attachment.fileName}
            </p>
            {attachment.fileSize > 0 && (
              <p className="text-xs text-white/60">
                {moment(attachmentSenderInfo?.date || "").format(
                  "DD/MM/YYYY [at] hh:mm A",
                )}
                <span className="mx-2">⋅</span>
                {formatFileSize(attachment.fileSize)}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {attachment.type === "image" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}

          {canForward && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIsForwardModalOpen(true)}
              title="Forward"
            >
              <Forward className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={closeViewer}
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        {/* Prev/Next nav - sirf gallery mode me */}
        {hasGalleryNav && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {attachment.type === "image" && (
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-h-full max-w-full object-contain transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            draggable={false}
          />
        )}

        {attachment.type === "video" && (
          <video
            src={attachment.url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg"
          />
        )}

        {attachment.type === "audio" && (
          <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white/5 p-10">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <p className="text-center text-sm text-white/80">
              {attachment.fileName}
            </p>
            <audio src={attachment.url} controls autoPlay className="w-full" />
          </div>
        )}

        {isPdf && (
          <iframe
            src={attachment.url}
            title={attachment.fileName}
            className="h-full w-full max-w-screen-2xl rounded-lg bg-white"
          />
        )}

        {isOfficeDoc && (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(attachment.url)}&embedded=true`}
            title={attachment.fileName}
            className="h-full w-full max-w-4xl rounded-lg bg-white"
          />
        )}

        {attachment.type === "file" && !isPdf && !isOfficeDoc && (
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
              <FileText className="h-9 w-9" />
            </div>
            <div>
              <p className="text-sm font-medium">{attachment.fileName}</p>
              <p className="mt-1 text-xs text-white/60">
                Preview not available for this file type
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => window.open(attachment.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery position indicator */}
      {hasGalleryNav && (
        <div className="pb-4 text-center text-xs text-white/60">
          {currentIndex + 1} / {gallery.length}
        </div>
      )}

      {/* Forward dialog */}
      <ForwardMessageDialog
        messageId={selectedMessageId}
        open={isForwardModalOpen}
        onOpenChange={setIsForwardModalOpen}
      />
    </div>
  );
};

export default AttachmentViewer;
