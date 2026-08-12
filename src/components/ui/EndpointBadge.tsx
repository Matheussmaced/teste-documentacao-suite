type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface EndpointBadgeProps {
  method: HttpMethod;
  path: string;
  visibility?: string;
}

export function EndpointBadge({ method, path, visibility }: EndpointBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono font-semibold border rounded px-2 py-0.5 ${methodColors[method]}`}>
        {method}
      </span>
      <code className="text-xs text-zinc-400 font-mono">{path}</code>
      {visibility && (
        <span className="ml-auto text-xs text-zinc-600 border border-zinc-800 rounded px-2 py-0.5">
          {visibility}
        </span>
      )}
    </div>
  );
}
