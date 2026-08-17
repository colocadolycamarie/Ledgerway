import { Landmark } from 'lucide-react';
import { Link } from 'wouter';

export function Logo({ dark = false }: { dark?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-ledgerway-logo"><span className={`grid size-8 place-items-center rounded-lg ${dark ? 'bg-cyan-400 text-[#102641]' : 'bg-[#0c315d] text-white'}`}><Landmark size={17} strokeWidth={2.5} /></span><span className={`text-[17px] font-extrabold tracking-[-.04em] ${dark ? 'text-white' : 'text-[#102641]'}`}>ledgerway</span></Link>;
}
