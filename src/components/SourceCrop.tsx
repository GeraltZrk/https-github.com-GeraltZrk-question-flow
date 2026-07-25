'use client';

interface Props {
  region: { id: string; imageId: string; bbox: { x: number; y: number; w: number; h: number }; rawText: string; cropHash: string };
}

export function SourceCrop({ region }: Props) {
  return (
    <div style={{ padding:"0.75rem", background:"#f5f5f5", borderRadius:6, fontSize:"0.85rem", marginTop:"0.5rem" }}>
      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
        <div><strong>Source:</strong> {region.id} ({region.imageId})</div>
        <div><strong>Position:</strong> x:{region.bbox.x} y:{region.bbox.y} {region.bbox.w}x{region.bbox.h}</div>
      </div>
      <div style={{ marginTop:"0.5rem", padding:"0.5rem", background:"#fff", borderRadius:4, border:"1px solid #ddd", fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
        {region.rawText}
      </div>
      <p style={{ marginTop:"0.25rem", color:"#999", fontSize:"0.75rem" }}>NOTE: Real image crop will display when demo images are available in public/demo/</p>
    </div>
  );
}
