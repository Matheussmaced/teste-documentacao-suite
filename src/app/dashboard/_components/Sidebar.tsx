'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

// ─────────────────────────────────────────────────────────────────
// Nav config — adicione novos itens aqui conforme os endpoints forem
// sendo implementados. Leaf = link direto. Group = flyout com filhos.
// ─────────────────────────────────────────────────────────────────

type Icon = (props: { className?: string }) => React.ReactNode;
type NavLeaf  = { key: string; label: string; href: string };
type NavGroup = { key: string; label: string; children: Array<NavLeaf | NavGroup> };
type NavRoot  = (NavLeaf | NavGroup) & { icon: Icon };

const navConfig: NavRoot[] = [
  {
    key: 'inicio',
    label: 'Início',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    key: 'certificacao',
    label: 'Certificação',
    icon: CertIcon,
    children: [
      {
        key: 'pessoas',
        label: 'Pessoas',
        children: [
          { key: 'pessoas-lista',  label: 'Listar',    href: '/dashboard/certificacao/pessoas' },
          { key: 'pessoas-novo',   label: 'Cadastrar', href: '/dashboard/certificacao/pessoas/novo' },
        ],
      },
      // Adicionar: Vendas, Aprovações, etc.
    ],
  },
  {
    key: 'configuracao',
    label: 'Configuração',
    href: '/dashboard/configuracao',
    icon: SettingsIcon,
  },
];

// ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const ref      = useRef<HTMLDivElement>(null);

  const [openL1, setOpenL1] = useState<string | null>(null);
  const [openL2, setOpenL2] = useState<string | null>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenL1(null);
        setOpenL2(null);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function toggleL1(key: string) {
    setOpenL1(prev => prev === key ? null : key);
    setOpenL2(null);
  }

  function toggleL2(key: string) {
    setOpenL2(prev => prev === key ? null : key);
  }

  function closeAll() {
    setOpenL1(null);
    setOpenL2(null);
  }

  function exitApp() {
    document.cookie = 'app_session=; path=/; max-age=0';
    router.push('/login');
  }

  const activeL1 = navConfig.find(n => n.key === openL1);
  const l1Children = activeL1 && 'children' in activeL1 ? activeL1.children : null;

  const activeL2 = l1Children?.find(n => n.key === openL2);
  const l2Children = activeL2 && 'children' in activeL2 ? activeL2.children : null;

  return (
    <div ref={ref} className="flex shrink-0 min-h-screen">

      {/* ── Sidebar principal ── */}
      <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800">
        <div className="px-4 py-5 border-b border-zinc-800">
          <Logo size="sm" subtitle="v2 · Console" />
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navConfig.map((item) => {
            if ('href' in item) {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeAll}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : ''}`} />
                  {item.label}
                </Link>
              );
            }

            const isOpen = openL1 === item.key;
            return (
              <button
                key={item.key}
                onClick={() => toggleL1(item.key)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  isOpen
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 shrink-0 ${isOpen ? 'text-blue-400' : ''}`} />
                  {item.label}
                </span>
                <ChevronRight className="w-3 h-3 opacity-40" />
              </button>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-zinc-800">
          <button
            onClick={exitApp}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Flyout L1 ── */}
      {l1Children && (
        <div className="w-44 flex flex-col bg-[#111318] border-r border-zinc-800 shadow-2xl">
          <div className="px-3 pt-5 pb-3 border-b border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              {activeL1!.label}
            </p>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {l1Children.map((child) => {
              if ('href' in child) {
                const active = pathname === child.href;
                return (
                  <Link key={child.key} href={child.href} onClick={closeAll}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    {child.label}
                  </Link>
                );
              }
              const isOpen = openL2 === child.key;
              return (
                <button key={child.key} onClick={() => toggleL2(child.key)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    isOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {child.label}
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Flyout L2 ── */}
      {l2Children && (
        <div className="w-44 flex flex-col bg-[#0d1014] border-r border-zinc-800 shadow-2xl">
          <div className="px-3 pt-5 pb-3 border-b border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              {activeL2!.label}
            </p>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {l2Children.map((leaf) => {
              if (!('href' in leaf)) return null;
              const active = pathname === leaf.href;
              return (
                <Link key={leaf.key} href={leaf.href} onClick={closeAll}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {leaf.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function CertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
