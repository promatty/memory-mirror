"use client"

interface CaptionsProps {
  text: string
}

export function Captions({ text }: CaptionsProps) {
  return (
    <div className="h-full flex items-start justify-start">
      <div className="w-full p-4 rounded-lg border border-border bg-background min-h-[200px]">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          captions
        </h3>
        <p className="text-sm text-foreground leading-relaxed">
          {text || "Captions will appear here during playback..."}
        </p>
      </div>
    </div>
  )
}
