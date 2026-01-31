import jsPDF from "jspdf";
import { RenderableSection, KDPSettings, Margins } from "./types";
import { getBleedDimensions } from "./kdp-rules";

interface PDFOptions {
  sections: RenderableSection[];
  settings: KDPSettings;
  margins: Margins;
  bookTitle: string;
}

export async function generatePDF(options: PDFOptions): Promise<Blob> {
  const { sections, settings, margins, bookTitle } = options;
  const { trimSize, bleed } = settings;

  // PDF dimensions in points (72 pts per inch)
  let pageW = trimSize.width;
  let pageH = trimSize.height;

  if (bleed) {
    const bleedDims = getBleedDimensions(trimSize);
    pageW = bleedDims.width;
    pageH = bleedDims.height;
  }

  const pageWPt = pageW * 72;
  const pageHPt = pageH * 72;

  const doc = new jsPDF({
    unit: "pt",
    format: [pageWPt, pageHPt],
    orientation: "portrait",
  });

  const marginTopPt = margins.top * 72;
  const marginBottomPt = margins.bottom * 72;
  const marginInsidePt = margins.inside * 72;
  const marginOutsidePt = margins.outside * 72;

  // Bleed offset (shift content when bleed is on)
  const bleedOffsetX = bleed ? 0 : 0; // Inside edge has no bleed
  const bleedOffsetTop = bleed ? 0.125 * 72 : 0;

  const fontSize = settings.fontSize;
  const lineHeightMult = settings.lineHeight;
  const lineHeightPt = fontSize * lineHeightMult;

  const fontFamily =
    settings.fontFamily === "serif" ? "times" :
    settings.fontFamily === "sans-serif" ? "helvetica" : "courier";

  doc.setFont(fontFamily, "normal");
  doc.setFontSize(fontSize);

  let pageNum = 0;
  let isFirstPage = true;

  function newPage() {
    if (!isFirstPage) {
      doc.addPage([pageWPt, pageHPt], "portrait");
    }
    isFirstPage = false;
    pageNum++;
  }

  function getMarginLeft(): number {
    const isRecto = pageNum % 2 === 1;
    return (isRecto ? marginInsidePt : marginOutsidePt) + bleedOffsetX;
  }

  function getTextWidth(): number {
    return pageWPt - marginInsidePt - marginOutsidePt - bleedOffsetX;
  }

  function addPageNumber() {
    doc.setFontSize(9);
    doc.setFont(fontFamily, "normal");
    const numStr = String(pageNum);
    const textW = doc.getTextWidth(numStr);
    const x = (pageWPt - textW) / 2;
    const y = pageHPt - marginBottomPt / 2 + bleedOffsetTop;
    doc.text(numStr, x, y);
    doc.setFontSize(fontSize);
  }

  const textWidth = getTextWidth();
  const usableHeight = pageHPt - marginTopPt - marginBottomPt;

  // Render all sections
  for (const section of sections) {
    const { kind } = section;

    // --- Title page: centered large bold title, author below ---
    if (kind === "title-page") {
      newPage();
      doc.setFont(fontFamily, "bold");

      const titleFontSize = fontSize + 14;
      doc.setFontSize(titleFontSize);
      const titleLines = doc.splitTextToSize(section.title, textWidth);
      const titleLineH = titleFontSize * lineHeightMult;

      // Center vertically
      const authorFontSize = fontSize + 2;
      const totalContentH = titleLines.length * titleLineH + authorFontSize * lineHeightMult * 2;
      let cursorY = marginTopPt + bleedOffsetTop + (usableHeight - totalContentH) / 2;

      // Center title horizontally
      for (const tLine of titleLines) {
        const tw = doc.getTextWidth(tLine);
        const tx = (pageWPt - tw) / 2;
        doc.text(tLine, tx, cursorY);
        cursorY += titleLineH;
      }

      // Author name below title
      cursorY += titleLineH;
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(authorFontSize);
      if (section.content) {
        const aw = doc.getTextWidth(section.content);
        const ax = (pageWPt - aw) / 2;
        doc.text(section.content, ax, cursorY);
      }

      // Reset font
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(fontSize);
      // No page number for title page
      continue;
    }

    // --- Copyright page: small font, bottom-aligned ---
    if (kind === "copyright-page") {
      newPage();
      const copyrightFontSize = fontSize - 2;
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(copyrightFontSize);
      const copyrightLineH = copyrightFontSize * lineHeightMult;

      const marginLeft = getMarginLeft();
      const paragraphs = section.content.split("\n");
      const allLines: string[] = [];

      for (const para of paragraphs) {
        if (para.trim() === "") {
          allLines.push("");
        } else {
          const wrapped = doc.splitTextToSize(para, textWidth);
          allLines.push(...wrapped);
        }
      }

      // Position from bottom
      const totalH = allLines.length * copyrightLineH;
      let cursorY = pageHPt - marginBottomPt + bleedOffsetTop - totalH;
      cursorY = Math.max(cursorY, marginTopPt + bleedOffsetTop);

      for (const line of allLines) {
        if (line === "") {
          cursorY += copyrightLineH * 0.5;
        } else {
          doc.text(line, marginLeft, cursorY);
          cursorY += copyrightLineH;
        }
      }

      // Reset font
      doc.setFontSize(fontSize);
      // No page number for copyright page
      continue;
    }

    // --- Dedication: centered italic ---
    if (kind === "dedication") {
      newPage();
      doc.setFont(fontFamily, "italic");
      doc.setFontSize(fontSize);

      const marginLeft = getMarginLeft();
      const paragraphs = section.content.split("\n");
      const allLines: string[] = [];

      for (const para of paragraphs) {
        if (para.trim() === "") {
          allLines.push("");
        } else {
          const wrapped = doc.splitTextToSize(para, textWidth);
          allLines.push(...wrapped);
        }
      }

      // Center vertically
      const totalH = allLines.length * lineHeightPt;
      let cursorY = marginTopPt + bleedOffsetTop + (usableHeight - totalH) / 2;

      for (const line of allLines) {
        if (line === "") {
          cursorY += lineHeightPt * 0.5;
        } else {
          // Center horizontally
          const lw = doc.getTextWidth(line);
          const lx = (pageWPt - lw) / 2;
          doc.text(line, lx, cursorY);
          cursorY += lineHeightPt;
        }
      }

      // Reset font
      doc.setFont(fontFamily, "normal");
      // No page number for dedication
      continue;
    }

    // --- Chapters + back matter: existing logic with page numbers ---
    newPage();

    const marginLeft = getMarginLeft();
    let cursorY = marginTopPt + bleedOffsetTop;

    // Section title
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSize + 6);
    const titleLines = doc.splitTextToSize(section.title, textWidth);
    const titleLineHeight = (fontSize + 6) * lineHeightMult;

    // Add some space before title
    cursorY += titleLineHeight;

    for (const tLine of titleLines) {
      doc.text(tLine, marginLeft, cursorY);
      cursorY += titleLineHeight;
    }

    // Space after title
    cursorY += lineHeightPt;

    // Reset to body font
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(fontSize);

    // Render body text
    const paragraphs = section.content.split("\n");

    for (const para of paragraphs) {
      if (para.trim() === "") {
        cursorY += lineHeightPt * 0.5;
        if (cursorY > pageHPt - marginBottomPt + bleedOffsetTop) {
          if (section.showPageNumber) addPageNumber();
          newPage();
          cursorY = marginTopPt + bleedOffsetTop;
        }
        continue;
      }

      const wrappedLines = doc.splitTextToSize(para, textWidth);

      for (const wLine of wrappedLines) {
        if (cursorY + lineHeightPt > pageHPt - marginBottomPt + bleedOffsetTop) {
          if (section.showPageNumber) addPageNumber();
          newPage();
          cursorY = marginTopPt + bleedOffsetTop;
        }

        const ml = getMarginLeft();
        doc.text(wLine, ml, cursorY);
        cursorY += lineHeightPt;
      }
    }

    if (section.showPageNumber) addPageNumber();
  }

  // Ensure even page count
  if (pageNum % 2 !== 0) {
    newPage();
    // blank page
  }

  // Set PDF metadata
  doc.setProperties({
    title: bookTitle,
    creator: "KDP Formatter",
  });

  return doc.output("blob");
}
