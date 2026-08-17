export function StatusBadge({ value }: { value?: string | null }) {
  const v = (value || 'pending').toLowerCase().replace(/_/g, ' ');
  const tone = v.includes('approved') || v.includes('paid') || v.includes('matched') || v.includes('active') || v.includes('issued') || v.includes('received') ? 'good' : v.includes('reject') || v.includes('exception') || v.includes('overdue') || v.includes('dispute') ? 'bad' : v.includes('draft') || v.includes('pending') || v.includes('review') ? 'warn' : 'neutral';
  return <span className={`status status-${tone}`} data-testid={`status-${v.replaceAll(' ', '-')}`}><i />{v}</span>;
}
