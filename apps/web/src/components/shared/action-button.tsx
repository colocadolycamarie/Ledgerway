import type { ButtonHTMLAttributes } from 'react';

export function ActionButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const testId = (props as Record<string, unknown>)['data-testid'] as string | undefined;
  return (
    <button {...props} className={`button ${className}`} data-testid={testId || 'button-action'}>
      {children}
    </button>
  );
}
