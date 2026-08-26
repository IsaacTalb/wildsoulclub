"use client";

import { PointerEvent, useRef, useState } from "react";
import { ImageIcon, Move } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  fieldKey: string;
  imageUrl?: string | null;
  required?: boolean;
  xField: string;
  yField: string;
  initialX?: number | null;
  initialY?: number | null;
};

function position(value: number | null | undefined) {
  return Math.min(100, Math.max(0, Number(value ?? 50)));
}

export function BannerPositionField({
  fieldKey,
  imageUrl,
  required,
  xField,
  yField,
  initialX,
  initialY,
}: Props) {
  const [preview, setPreview] = useState(imageUrl ?? "");
  const [x, setX] = useState(() => position(initialX));
  const [y, setY] = useState(() => position(initialY));
  const drag = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);

  function selectImage(file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return url;
    });
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveImage(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setX(
      position(
        drag.current.x -
          ((event.clientX - drag.current.pointerX) / bounds.width) * 100,
      ),
    );
    setY(
      position(
        drag.current.y -
          ((event.clientY - drag.current.pointerY) / bounds.height) * 100,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <Input
        id={fieldKey}
        name={`${fieldKey}_file`}
        type="file"
        accept="image/*"
        required={required && !imageUrl}
        onChange={(event) => selectImage(event.target.files?.[0])}
      />
      <input name={fieldKey} type="hidden" defaultValue={imageUrl ?? ""} />
      <input name={xField} type="hidden" value={x} readOnly />
      <input name={yField} type="hidden" value={y} readOnly />
      {preview ? (
        <div className="space-y-2">
          <div
            className="relative aspect-[16/7] touch-none cursor-move select-none overflow-hidden rounded-lg border bg-neutral-950"
            onPointerDown={startDrag}
            onPointerMove={moveImage}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            role="img"
            aria-label="Desktop and tablet banner crop preview"
          >
            {/* A plain img is intentional: this preview may point at a temporary blob URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
              style={{ objectPosition: `${x}% ${y}%` }}
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10 text-white">
              <span className="flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium shadow-sm">
                <Move className="h-3.5 w-3.5" />
                Drag to reposition
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tablet and desktop preview (16:7). Drag the image or use the
            controls below. Mobile keeps the normal centered image.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              Horizontal ({Math.round(x)}%)
              <input
                className="w-full accent-foreground"
                type="range"
                min="0"
                max="100"
                value={x}
                onChange={(event) => setX(Number(event.target.value))}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Vertical ({Math.round(y)}%)
              <input
                className="w-full accent-foreground"
                type="range"
                min="0"
                max="100"
                value={y}
                onChange={(event) => setY(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
          <ImageIcon className="mr-2 h-4 w-4" />
          Choose an image to position it
        </div>
      )}
    </div>
  );
}
