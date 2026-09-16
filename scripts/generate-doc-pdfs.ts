import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "@playwright/test";

export interface DocPdfConfig {
  sourceMd: string;
  targetPdf: string;
  title: string;
  subtitle: string;
  category: string;
  isArabic?: boolean;
}

const DOC_CONFIGS: DocPdfConfig[] = [
  {
    sourceMd: "docs/ARCHITECTURE.md",
    targetPdf: "docs/PDFs/ARCHITECTURE.pdf",
    title: "System Architecture & Engineering Blueprint",
    subtitle: "C4 Diagrams, State Machine & Advisory Locking Sequences",
    category: "Architecture Blueprint",
    isArabic: false,
  },
  {
    sourceMd: "docs/OPERATIONS_MANUAL.md",
    targetPdf: "docs/PDFs/OPERATIONS_MANUAL.pdf",
    title: "Kitchen & Restaurant Operations Manual",
    subtitle: "POS Runbook, Kitchen Kanban & Managerial Closing",
    category: "Operations Runbook",
    isArabic: false,
  },
  {
    sourceMd: "docs/API_REFERENCE.md",
    targetPdf: "docs/PDFs/API_REFERENCE.pdf",
    title: "REST API Specification & Reference",
    subtitle: "40 RESTful Endpoints, Schemas & Security Invariants",
    category: "Developer Reference",
    isArabic: false,
  },
  {
    sourceMd: "docs/DATA_DICTIONARY.md",
    targetPdf: "docs/PDFs/DATA_DICTIONARY.pdf",
    title: "Database Schema & Data Dictionary",
    subtitle: "PostgreSQL Models, Enums, Constraints & Indexes",
    category: "Data Architecture",
    isArabic: false,
  },
  {
    sourceMd: "docs/DEPLOYMENT_GUIDE.md",
    targetPdf: "docs/PDFs/DEPLOYMENT_GUIDE.pdf",
    title: "Cloud Deployment & Disaster Recovery Guide",
    subtitle: "Vercel Edge, Supabase Pooling & Migration Runbook",
    category: "DevOps & Infrastructure",
    isArabic: false,
  },
  {
    sourceMd: "docs/TESTING_REPORT.md",
    targetPdf: "docs/PDFs/TESTING_REPORT.pdf",
    title: "5-Pillar Comprehensive Testing Report",
    subtitle: "373+ Tests Passed: Logic, Security, Fuzzing & NFR Benchmarks",
    category: "Quality Assurance",
    isArabic: true,
  },
];

function buildHtmlTemplate(contentHtml: string, config: DocPdfConfig): string {
  const dir = config.isArabic ? "rtl" : "ltr";
  const lang = config.isArabic ? "ar" : "en";
  const dateStr = config.isArabic ? "16 سبتمبر 2026" : "September 16, 2026";
  const fontFamilies = config.isArabic
    ? "'Cairo', 'Tajawal', sans-serif"
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <!-- Google Fonts: Inter, Cairo, JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  
  <!-- Mermaid.js for Vector Diagram Rendering -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>

  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 14mm 20mm 14mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: ${fontFamilies};
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Executive Header Banner */
    .doc-header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .doc-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-badge {
      width: 44px;
      height: 44px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .brand-meta h1 {
      margin: 0;
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .brand-meta p {
      margin: 3px 0 0 0;
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 500;
    }

    .doc-meta-badge {
      text-align: ${config.isArabic ? "left" : "right"};
      font-size: 8pt;
      color: #475569;
    }

    .meta-tag {
      display: inline-block;
      padding: 2.5px 9px;
      background: #f1f5f9;
      color: #0f172a;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 7.5pt;
      border: 1px solid #cbd5e1;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Typography & Hierarchy */
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
    }

    h1 {
      font-size: 16pt;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
    }

    h2 {
      font-size: 13pt;
      border-right: ${config.isArabic ? "4px solid #0f172a" : "none"};
      border-left: ${config.isArabic ? "none" : "4px solid #0f172a"};
      padding-right: ${config.isArabic ? "10px" : "0"};
      padding-left: ${config.isArabic ? "0" : "10px"};
      margin-top: 20px;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 11pt;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 6px;
    }

    p, li {
      margin-top: 0;
      margin-bottom: 8px;
      color: #334155;
    }

    ul, ol {
      padding-right: ${config.isArabic ? "20px" : "0"};
      padding-left: ${config.isArabic ? "0" : "20px"};
      margin-bottom: 10px;
    }

    li {
      margin-bottom: 3px;
    }

    strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Code & Inlines */
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      direction: ltr;
      display: inline-block;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.45;
      direction: ltr;
      text-align: left;
      margin: 12px 0;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
    }

    th, td {
      padding: 6px 8px;
      text-align: ${config.isArabic ? "right" : "left"};
      vertical-align: top;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 700;
      font-size: 8.5pt;
      border-bottom: 2px solid #94a3b8;
    }

    tr:nth-child(even) td {
      background: #fbfcfe;
    }

    /* Blockquotes */
    blockquote {
      border-right: ${config.isArabic ? "4px solid #3b82f6" : "none"};
      border-left: ${config.isArabic ? "none" : "4px solid #3b82f6"};
      background: #eff6ff;
      color: #1e40af;
      margin: 12px 0;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    blockquote p:last-child {
      margin-bottom: 0;
    }

    /* Mermaid Diagrams */
    .mermaid {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin: 14px 0;
      text-align: center;
      page-break-inside: avoid;
      display: flex;
      justify-content: center;
    }

    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Executive Footer Stamp */
    .footer-stamp {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-brand">
      <div class="brand-logo-badge">🍣</div>
      <div class="brand-meta">
        <h1>${config.title}</h1>
        <p>${config.subtitle}</p>
      </div>
    </div>
    <div class="doc-meta-badge">
      <div class="meta-tag">${config.category}</div>
      <div><strong>Effective Date:</strong> ${dateStr}</div>
      <div><strong>System:</strong> Order Control System v1.0</div>
    </div>
  </div>

  <main class="doc-content">
    ${contentHtml}
  </main>

  <div class="footer-stamp">
    <div>Order Control System — Multi-Brand Dark Kitchen Operating Platform</div>
    <div>Confidential & Proprietary &copy; 2026</div>
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      fontFamily: 'Inter, Cairo, sans-serif',
      flowchart: { htmlLabels: true, curve: 'basis' }
    });
  </script>
</body>
</html>`;
}

function preprocessMarkdown(rawMd: string): string {
  return rawMd.replace(/```mermaid([\s\S]*?)```/g, (_match, code) => {
    return `<div class="mermaid">\n${code.trim()}\n</div>`;
  });
}

export async function compileDocToPdf(config: DocPdfConfig) {
  const rootDir = process.cwd();
  const sourcePath = path.join(rootDir, config.sourceMd);
  const targetPath = path.join(rootDir, config.targetPdf);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️ Source file not found: ${config.sourceMd}`);
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  console.log(`\n📄 Compiling ${config.sourceMd} ➔ ${config.targetPdf}...`);
  const rawMd = fs.readFileSync(sourcePath, "utf-8");
  const processedMd = preprocessMarkdown(rawMd);
  const contentHtml = await marked.parse(processedMd);
  const fullHtml = buildHtmlTemplate(contentHtml, config);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle" });

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500); // Allow mermaid svg to render

    await page.pdf({
      path: targetPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        bottom: "16mm",
        left: "12mm",
        right: "12mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; padding: 0 12mm; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
        <span>Order Control System — ${config.title}</span>
        <span>Official Engineering Document</span>
      </div>`,
      footerTemplate: `<div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; padding: 0 12mm; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 4px;">
        <span>Confidential — Dark Kitchen Operating Platform</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
    });

    const stats = fs.statSync(targetPath);
    console.log(`✅ Generated ${config.targetPdf} (${(stats.size / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const targetArg = process.argv[2];

  const configsToRun = targetArg
    ? DOC_CONFIGS.filter((c) => c.sourceMd.includes(targetArg) || c.targetPdf.includes(targetArg))
    : DOC_CONFIGS;

  if (configsToRun.length === 0) {
    console.error(`No matching doc configuration found for argument: ${targetArg}`);
    process.exit(1);
  }

  console.log("================================================================================");
  console.log("🖨️  ORDER CONTROL SYSTEM — EXECUTIVE PDF COMPILATION ENGINE");
  console.log("================================================================================");

  for (const cfg of configsToRun) {
    try {
      await compileDocToPdf(cfg);
    } catch (err) {
      console.error(`❌ Failed to compile ${cfg.sourceMd}:`, err);
    }
  }

  console.log("\n🎉 ALL PDF COMPILATIONS COMPLETE!\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("FATAL: PDF generator failed:", err);
    process.exit(1);
  });
}
