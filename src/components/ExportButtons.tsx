"use client";

import { useState } from "react";
import { Icon } from "./Icon";

function slug(s: string): string {
  const out = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "dashboard";
}

/**
 * Print + PDF export for a dashboard board.
 *
 * Print uses the browser's native print pipeline with the @media print
 * stylesheet in globals.css. PDF export rasterizes the target node with
 * html-to-image (which preserves the exact on-screen grid layout) and slices
 * the canvas into A4 landscape pages with jsPDF. Both libraries are
 * lazy-loaded on first use.
 */
export function ExportButtons({
  targetId,
  title,
  disabled,
}: {
  targetId: string;
  title: string;
  disabled?: boolean;
}) {
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf() {
    const node = document.getElementById(targetId);
    if (!node) return;
    setRendering(true);
    setError(null);
    document.body.classList.add("exporting");
    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      // Let the .exporting styles (hiding toolbar chrome) settle before
      // capturing the node.
      await new Promise((r) => setTimeout(r, 80));

      const canvas = await toCanvas(node, {
        pixelRatio: 2,
        backgroundColor: "#f4f5f7",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      const img = canvas.toDataURL("image/jpeg", 0.92);

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0.5) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      pdf.save(`${slug(title)}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      document.body.classList.remove("exporting");
      setRendering(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => window.print()}
        disabled={rendering}
      >
        <Icon name="printer" size={14} />
        Print
      </button>
      <button
        type="button"
        className="btn"
        onClick={exportPdf}
        disabled={disabled || rendering}
        title={
          disabled
            ? "Waiting for widget queries to finish"
            : "Download this board as a PDF"
        }
      >
        <Icon name="download" size={14} />
        {rendering ? "Rendering…" : "Export PDF"}
      </button>
      {error && (
        <span
          className="max-w-48 truncate text-xs text-accent"
          title={error}
        >
          {error}
        </span>
      )}
    </>
  );
}
