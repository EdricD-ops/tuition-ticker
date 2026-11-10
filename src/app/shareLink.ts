import type { TickerConfig } from '../core';
import { parseConfig } from './configIO';

/**
 * Share links carry the whole config in the URL hash (`#share=…`), so it never reaches a
 * server. The payload is `1.` + base64url(deflate-raw(JSON)).
 */
export const SHARE_PARAM = 'share';
const VERSION = '1';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeConfig(config: TickerConfig): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(config));
  return `${VERSION}.${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`;
}

/** Decodes a share payload. Null for anything malformed or not a Tuition Ticker config. */
export async function decodeConfig(payload: string): Promise<TickerConfig | null> {
  const [version, data] = payload.split('.', 2);
  if (version !== VERSION || !data) return null;
  try {
    const bytes = await pipe(fromBase64Url(data), new DecompressionStream('deflate-raw'));
    return parseConfig(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** Full link for `config`, based on the page's own address (any query is kept, hash replaced). */
export async function shareUrl(config: TickerConfig, href: string): Promise<string> {
  const url = new URL(href);
  url.searchParams.delete('view');
  url.hash = `${SHARE_PARAM}=${await encodeConfig(config)}`;
  return url.toString();
}

/** The share payload in a URL hash, if any. */
export function sharePayload(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get(SHARE_PARAM);
}

/** Drops the share payload from the address bar so a reload doesn't import it again. */
export function clearShareHash(): void {
  try {
    const url = new URL(location.href);
    url.hash = '';
    history.replaceState(history.state, '', url.toString());
  } catch {
    // Ignore: worst case the import prompt shows again on reload.
  }
}
