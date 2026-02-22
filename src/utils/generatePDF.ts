import html2pdf from 'html2pdf.js';

interface OnePagerData {
  title: string;
  context_line: string;
  sections: Array<{
    title: string;
    points: string[];
  }>;
}

interface ScriptLine {
  type: 'opener' | 'line' | 'pause' | 'transition' | 'closer';
  text?: string;
  note?: string;
  duration?: string;
  emphasis?: string | null;
}

interface ScriptData {
  title: string;
  context_line: string;
  total_duration: string;
  lines: ScriptLine[];
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBold(text: string): string {
  return esc(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

const RESET_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #ffffff !important; color: #333333 !important; font-family: system-ui, -apple-system, sans-serif; }
  strong { font-weight: 700; }
`;

function buildOnePagerHTML(data: OnePagerData, showWatermark: boolean): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let sectionsHTML = '';
  for (const section of data.sections) {
    let pointsHTML = '';
    for (const point of section.points) {
      pointsHTML += `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
          <div style="width:5px;height:5px;border-radius:50%;background:#333333;margin-top:8px;flex-shrink:0;"></div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#333333;">${formatBold(point)}</p>
        </div>`;
    }
    sectionsHTML += `
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <h3 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 12px 0;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:0.5px;">${esc(section.title)}</h3>
        ${pointsHTML}
      </div>`;
  }

  return `<!DOCTYPE html><html><head><style>${RESET_CSS}</style></head><body style="background:#ffffff !important;color:#333333 !important;padding:0;">
    <div style="background:#ffffff;color:#333333;padding:0;">
      <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;font-family:Georgia,serif;">${esc(data.title)}</h1>
      <p style="font-size:13px;color:#666666;margin:0 0 24px 0;">${esc(data.context_line)}</p>
      <div style="height:2px;background:#1a1a1a;margin-bottom:28px;"></div>
      ${sectionsHTML}
      ${showWatermark ? `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e0e0e0;"><p style="font-size:10px;color:#999999;margin:0;text-align:center;">Created with PitchVoid · ${date}</p></div>` : ''}
    </div>
  </body></html>`;
}

function buildScriptHTML(data: ScriptData, showWatermark: boolean): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let lineNumber = 0;
  let linesHTML = '';

  for (const line of data.lines) {
    if (line.type === 'opener') {
      linesHTML += `
        <p style="font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:1px;margin:24px 0 8px 0;">OPEN WITH</p>
        <p style="font-size:14px;line-height:1.8;color:#1a1a1a;margin:0 0 4px 0;font-family:Georgia,serif;">${formatBold(line.text || '')}</p>
        ${line.note ? `<p style="font-size:11px;color:#999999;font-style:italic;margin:0 0 16px 0;">${esc(line.note)}</p>` : ''}`;
    } else if (line.type === 'line') {
      lineNumber++;
      linesHTML += `
        <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;page-break-inside:avoid;">
          <span style="font-size:11px;color:#aaaaaa;font-weight:600;flex-shrink:0;padding-top:3px;">${String(lineNumber).padStart(2, '0')}</span>
          <p style="font-size:14px;line-height:1.8;color:#333333;margin:0;font-family:Georgia,serif;">${formatBold(line.text || '')}</p>
        </div>`;
    } else if (line.type === 'pause') {
      linesHTML += `
        <p style="text-align:center;font-size:14px;color:#cccccc;margin:20px 0 4px 0;">·  ·  ·</p>
        <p style="text-align:center;font-size:11px;color:#999999;font-style:italic;margin:0 0 20px 0;">${esc(line.note || '')}</p>`;
    } else if (line.type === 'transition') {
      linesHTML += `
        <p style="font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:1px;margin:24px 0 12px 0;">${esc(line.text || '')}</p>`;
    } else if (line.type === 'closer') {
      linesHTML += `
        <div style="height:1px;background:#e0e0e0;margin:28px 0;"></div>
        <p style="font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">CLOSE WITH</p>
        <p style="font-size:14px;line-height:1.8;color:#1a1a1a;margin:0 0 4px 0;font-family:Georgia,serif;">${formatBold(line.text || '')}</p>
        ${line.note ? `<p style="font-size:11px;color:#999999;font-style:italic;margin:0;">${esc(line.note)}</p>` : ''}`;
    }
  }

  return `<!DOCTYPE html><html><head><style>${RESET_CSS}</style></head><body style="background:#ffffff !important;color:#333333 !important;padding:0;">
    <div style="background:#ffffff;color:#333333;padding:0;">
      <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;font-family:Georgia,serif;">${esc(data.title)}</h1>
      <p style="font-size:13px;color:#666666;margin:0 0 24px 0;">${esc(data.context_line)}  ·  ${esc(data.total_duration)}</p>
      <div style="height:2px;background:#1a1a1a;margin-bottom:28px;"></div>
      ${linesHTML}
      ${showWatermark ? `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e0e0e0;"><p style="font-size:10px;color:#999999;margin:0;text-align:center;">Created with PitchVoid · ${date}</p></div>` : ''}
    </div>
  </body></html>`;
}

/**
 * Renders HTML inside an isolated iframe so no dark-theme styles leak in,
 * then uses html2pdf to capture it as a clean white PDF.
 */
async function renderInIframe(html: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '7.5in';
    iframe.style.height = '10in';
    iframe.style.border = 'none';
    iframe.style.background = '#ffffff';
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) throw new Error('Could not access iframe document');

        doc.open();
        doc.write(html);
        doc.close();

        // Wait for fonts/layout
        await new Promise(r => setTimeout(r, 300));

        const content = doc.body;

        await html2pdf().set({
          margin: [0.75, 0.75, 0.75, 0.75],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
            windowWidth: 672, // 7in * 96dpi
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        }).from(content).save();

        document.body.removeChild(iframe);
        resolve();
      } catch (err) {
        document.body.removeChild(iframe);
        reject(err);
      }
    };

    // Trigger load
    iframe.srcdoc = html;
  });
}

export async function exportOnePagerPDF(data: OnePagerData, isPro: boolean): Promise<void> {
  const html = buildOnePagerHTML(data, !isPro);
  const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}-pitchvoid.pdf`;
  await renderInIframe(html, filename);
}

export async function exportScriptPDF(data: ScriptData, isPro: boolean): Promise<void> {
  const html = buildScriptHTML(data, !isPro);
  const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()}-script-pitchvoid.pdf`;
  await renderInIframe(html, filename);
}
