'use client';

import { useState } from 'react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="shrink-0 px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-[11px] text-zinc-300 transition-colors"
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

export function GatewayPayload({ payload }: { payload: Record<string, unknown> }) {
  const pixKey = typeof payload.Key === 'string' ? payload.Key : null;
  const qrCode = typeof payload.QrCode === 'string' ? payload.QrCode : null;
  const barcode = typeof (payload.BarCode ?? payload.Barcode ?? payload.barcode) === 'string'
    ? String(payload.BarCode ?? payload.Barcode ?? payload.barcode)
    : null;
  const message = typeof payload.Message === 'string' ? payload.Message : null;
  const description = typeof payload.Description === 'string' ? payload.Description : null;

  const isPix = !!(pixKey || qrCode);
  const isBoleto = !!barcode;

  if (isPix) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">PIX</p>
        {qrCode && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR Code PIX" className="w-48 h-48 rounded-lg bg-white p-1" />
          </div>
        )}
        {pixKey && (
          <div>
            <p className="text-[11px] text-zinc-500 mb-1.5">Pix Copia e Cola</p>
            <div className="flex items-start gap-2">
              <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-[11px] font-mono text-zinc-400 break-all">
                {pixKey}
              </div>
              <CopyButton text={pixKey} />
            </div>
          </div>
        )}
        {message && <p className="text-xs text-zinc-500">{message}</p>}
        {description && <p className="text-[11px] text-zinc-600">{description}</p>}
      </div>
    );
  }

  if (isBoleto) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Boleto</p>
        <div>
          <p className="text-[11px] text-zinc-500 mb-1.5">Linha digitável</p>
          <div className="flex items-start gap-2">
            <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-[11px] font-mono text-zinc-400 break-all">
              {barcode}
            </div>
            <CopyButton text={barcode!} />
          </div>
        </div>
        {message && <p className="text-xs text-zinc-500">{message}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-[11px] text-zinc-500 mb-1.5">Dados do gateway</p>
      <div className="bg-zinc-800/50 rounded-lg p-3 text-xs font-mono text-zinc-400 break-all whitespace-pre-wrap">
        {JSON.stringify(payload, null, 2)}
      </div>
    </div>
  );
}
