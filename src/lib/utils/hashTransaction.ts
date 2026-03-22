export async function hashTransaction(
  date: string,
  description: string,
  amount: number,
): Promise<string> {
  const text = `${date}|${description.trim().toLowerCase()}|${amount.toFixed(2)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
