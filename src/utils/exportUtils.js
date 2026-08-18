export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}

export function downloadTranscript(text, filename = 'voicescript-transcript', format = 'txt') {
  if (!text) return;

  let content = text;
  let fileType = 'text/plain;charset=utf-8';
  let ext = '.txt';

  if (format === 'md') {
    content = `# VoiceScript Transcript\n\n*Generated on ${new Date().toLocaleString()}*\n\n---\n\n${text}\n`;
    fileType = 'text/markdown;charset=utf-8';
    ext = '.md';
  }

  const blob = new Blob([content], { type: fileType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function calculateMetrics(text = '') {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      readingTime: '0 sec',
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;
  
  // Average speaking/reading rate ~150 words per minute
  const totalSeconds = Math.ceil((wordCount / 150) * 60);
  let readingTime = `${totalSeconds} sec`;
  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    readingTime = `${mins}m ${secs}s`;
  }

  return {
    wordCount,
    charCount,
    readingTime,
  };
}
