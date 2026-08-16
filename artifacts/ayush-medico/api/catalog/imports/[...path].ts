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

function sendJson(
  response: VercelResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(body));
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const apiBaseUrl = process.env.AYUSH_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBaseUrl) {
    sendJson(response, 503, {
      error:
        'Inventory API is not configured for this deployment. Set AYUSH_API_BASE_URL to the deployed API server URL.',
    });
    return;
  }

  try {
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
      upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
    );
    response.setHeader('cache-control', 'no-store');
    response.end(Buffer.from(upstreamBody));
  } catch (error) {
    sendJson(response, 502, {
      error: 'The inventory API could not be reached.',
      details: error instanceof Error ? error.message : 'Unknown proxy error.',
    });
  }
}