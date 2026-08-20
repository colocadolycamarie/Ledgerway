import { Link } from 'wouter';

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-ledgerway-logo">
      <img src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg object-contain" />
      <span className={`text-[17px] font-extrabold tracking-[-.04em] ${dark ? 'text-white' : 'text-[#102641]'}`}>
        ledgerway
      </span>
    </Link>
  );
}
