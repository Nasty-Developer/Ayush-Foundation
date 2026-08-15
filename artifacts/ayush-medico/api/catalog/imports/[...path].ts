import type { IncomingMessage, ServerResponse } from 'node:http';

type VercelRequest = IncomingMessage & {
  url?: string;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
};

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '60mb',
  },
};

const FORWARDED_HEADERS = [
  'authorization',
  'content-type',
  'x-file-name',
  'x-import-job-id',
] as const;

async function readRawBody(request: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const apiBaseUrl = process.env.AYUSH_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBaseUrl) {
    response.status(503).json({
      error:
        'Inventory API is not configured for this deployment. Set AYUSH_API_BASE_URL to the deployed API server URL.',
    });
    return;
  }

  const requestUrl = new URL(request.url ?? '/', 'http://localhost');
  const importPath = requestUrl.pathname.replace(
    /^\/api\/catalog\/imports\/?/,
    '',
  );
  const targetUrl = `${apiBaseUrl}/api/catalog/imports/${importPath}${requestUrl.search}`;
  const headers = new Headers();

  for (const header of FORWARDED_HEADERS) {
    const value = request.headers[header];
    if (typeof value === 'string') headers.set(header, value);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await readRawBody(request);
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });
  const upstreamBody = await upstream.arrayBuffer();

  response.statusCode = upstream.status;
  response.setHeader(
    'content-type',
    upstream.headers.get('content-type') ?? 'application/json',
  );
  response.end(Buffer.from(upstreamBody));
}