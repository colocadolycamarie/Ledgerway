import { shadcn } from '@clerk/themes';
import { BASE_PATH } from '@/lib/constants';

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: BASE_PATH || '/',
    logoImageUrl: `${window.location.origin}${BASE_PATH}/logo.png`,
  },
  variables: {
    colorPrimary: '#0c315d',
    colorForeground: '#102641',
    colorMutedForeground: '#5d6c7e',
    colorDanger: '#b83a32',
    colorBackground: '#ffffff',
    colorInput: '#f8f6f1',
    colorInputForeground: '#102641',
    colorNeutral: '#d6e0e8',
    fontFamily: 'Plus Jakarta Sans',
    borderRadius: '0.7rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#102641] font-extrabold',
    headerSubtitle: 'text-[#5d6c7e]',
    socialButtonsBlockButtonText: 'text-[#102641]',
    formFieldLabel: 'text-[#102641] font-semibold',
    footerActionLink: 'text-[#8b610c] font-semibold',
    footerActionText: 'text-[#5d6c7e]',
    dividerText: 'text-[#5d6c7e]',
    formFieldInput: 'bg-[#f8f6f1] text-[#102641]',
    formButtonPrimary: 'bg-[#0c315d] hover:bg-[#102641]',
  },
};
