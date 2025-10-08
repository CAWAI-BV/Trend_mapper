export function normalizeText(input: string): string {
  const withoutControl = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const normalizedWhitespace = withoutControl
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

  return normalizedWhitespace;
}

export function enforceCharacterLimit(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  return text.slice(0, limit);
}
