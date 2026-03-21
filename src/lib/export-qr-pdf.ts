// @ts-nocheck
import QRCode from "qrcode";
import jsPDF from "jspdf";

export interface QRItem {
  code: string;
  prize?: string | null;
}

export async function exportQRPdf(items: QRItem[], campaignName: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // A4 = 210 x 297 mm
  const PAGE_W = 210;
  const PAGE_H = 297;
  const COLS = 4;
  const ROWS = 7;
  const PER_PAGE = COLS * ROWS; // 28

  const MARGIN_X = 10;
  const MARGIN_Y = 14;
  const CELL_W = (PAGE_W - MARGIN_X * 2) / COLS;  // ~47.5 mm
  const CELL_H = (PAGE_H - MARGIN_Y * 2) / ROWS;  // ~38.4 mm
  const QR_SIZE = 28; // mm

  const totalPages = Math.ceil(items.length / PER_PAGE);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    // Header
    doc.setFillColor(109, 10, 10); // crimson
    doc.rect(0, 0, PAGE_W, 10, "F");
    doc.setTextColor(232, 184, 32); // gold
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`ปังจัง Lucky Draw — ${campaignName}`, MARGIN_X, 6.5);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(7);
    doc.text(`หน้า ${page + 1}/${totalPages}  |  รหัส ${page * PER_PAGE + 1}–${Math.min((page + 1) * PER_PAGE, items.length)} จาก ${items.length}`, PAGE_W - MARGIN_X, 6.5, { align: "right" });

    const pageItems = items.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = MARGIN_X + col * CELL_W;
      const cy = MARGIN_Y + row * CELL_H;

      // Cell border (dashed cut line)
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([1, 1.5], 0);
      doc.setLineWidth(0.2);
      doc.rect(cx + 1, cy + 1, CELL_W - 2, CELL_H - 2);
      doc.setLineDashPattern([], 0);

      // Gold top accent line
      doc.setDrawColor(232, 184, 32);
      doc.setLineWidth(0.6);
      doc.line(cx + 3, cy + 2.5, cx + CELL_W - 3, cy + 2.5);
      doc.setLineWidth(0.2);

      // Logo circle
      doc.setFillColor(109, 10, 10);
      doc.circle(cx + CELL_W / 2, cy + 8, 3.8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("ป", cx + CELL_W / 2, cy + 9.1, { align: "center" });

      // Brand name
      doc.setTextColor(109, 10, 10);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "bold");
      doc.text("ปังจัง", cx + CELL_W / 2, cy + 14, { align: "center" });

      // QR Code
      try {
        const url = `${typeof window !== "undefined" ? window.location.origin : "https://pangjang.com"}/?code=${item.code}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
          color: { dark: "#3d0404", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        const qrX = cx + (CELL_W - QR_SIZE) / 2;
        const qrY = cy + 15.5;
        // White bg for QR
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - 0.5, qrY - 0.5, QR_SIZE + 1, QR_SIZE + 1, 1, 1, "F");
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
      } catch (e) {
        console.error("QR error:", e);
      }

      // Code text
      doc.setTextColor(40, 4, 4);
      doc.setFontSize(7);
      doc.setFont("courier", "bold");
      doc.text(item.code, cx + CELL_W / 2, cy + CELL_H - 6.5, { align: "center" });

      // Prize label (if any)
      if (item.prize) {
        doc.setFillColor(232, 184, 32);
        doc.roundedRect(cx + 3, cy + CELL_H - 5.5, CELL_W - 6, 4, 1, 1, "F");
        doc.setTextColor(61, 31, 0);
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.text(`🏆 ${item.prize}`, cx + CELL_W / 2, cy + CELL_H - 3, { align: "center" });
      } else {
        doc.setTextColor(150, 100, 100);
        doc.setFontSize(5);
        doc.setFont("helvetica", "normal");
        doc.text("ลุ้นโชค", cx + CELL_W / 2, cy + CELL_H - 3, { align: "center" });
      }
    }
  }

  const filename = `pangjang-qr-${campaignName.replace(/\s+/g, "-")}-${items.length}codes.pdf`;
  doc.save(filename);
}
