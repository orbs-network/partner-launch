import { useEffect, useState } from "react";
import { createPreviewCardBlob } from "../components/completion/preview-share";

interface PreviewInput {
  name: string;
  brandColor: string;
  logoDataUrl?: string;
}

type PreviewResult =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; blob: Blob; url: string };

interface RenderedPreview {
  request: PreviewInput;
  result: PreviewResult;
}

/** One locally rendered image is used for both the preview and its download. */
export function usePreviewCard({ name, brandColor, logoDataUrl }: PreviewInput) {
  const [request, setRequest] = useState<PreviewInput>({ name, brandColor, logoDataUrl });
  const [rendered, setRendered] = useState<RenderedPreview | null>(null);
  const current = request.name === name && request.brandColor === brandColor && request.logoDataUrl === logoDataUrl;
  // A fresh request also distinguishes A → B → A from an earlier revoked image.
  if (!current) setRequest({ name, brandColor, logoDataUrl });
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void createPreviewCardBlob(request).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setRendered({ request, result: { status: "ready", blob, url: objectUrl } });
    }).catch(() => {
      if (active) setRendered({ request, result: { status: "error" } });
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request]);

  const preview: PreviewResult = current && rendered?.request === request ? rendered.result : { status: "loading" };
  return { preview, retry: () => setRequest((value) => ({ ...value })) };
}
