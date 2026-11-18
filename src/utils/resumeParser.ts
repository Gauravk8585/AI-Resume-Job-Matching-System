import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateResumeFile(file: File): string | null {
  if (file.size > MAX_RESUME_BYTES) {
    return `File "${file.name}" exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
  }
  const lower = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx');

  if (!isPdf && !isDocx) {
    return `Unsupported format for "${file.name}". Please upload a PDF or DOCX file.`;
  }
  return null;
}

export async function extractTextFromResumeFile(file: File): Promise<{
  rawText: string;
  fileDataUrl: string;
}> {
  const lower = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const fileDataUrl = await readFileAsDataUrl(file);

  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      pages.push(strings.join(' '));
    }
    const rawText = pages.join('\n\n').replace(/\s+\n/g, '\n').trim();
    if (!rawText || rawText.length < 20) {
      throw new Error(
        'Could not extract selectable text from this PDF. Please ensure it is a text-based PDF (not a scanned image) or try DOCX.'
      );
    }
    return { rawText, fileDataUrl };
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = (result.value || '').trim();
    if (!rawText || rawText.length < 20) {
      throw new Error('Could not extract text from this DOCX file. Please check that the document contains text.');
    }
    return { rawText, fileDataUrl };
  }

  throw new Error('Unsupported resume file format. Only PDF and DOCX are supported.');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file for local preview.'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadResumeFile(fileName: string, rawText: string, fileDataUrl?: string) {
  const link = document.createElement('a');
  if (fileDataUrl && fileDataUrl.startsWith('data:')) {
    link.href = fileDataUrl;
    link.download = fileName;
  } else {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    link.href = URL.createObjectURL(blob);
    link.download = fileName.replace(/\.(pdf|docx)$/i, '.txt');
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
