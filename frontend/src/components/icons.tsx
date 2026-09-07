import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps): IconProps => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...props,
})

export const ShoppingBagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

export const CartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

export const MinusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14" />
  </svg>
)

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export const MenuIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 12h16" />
    <path d="M4 6h16" />
    <path d="M4 18h16" />
  </svg>
)

export const StarIcon = (props: IconProps) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export const TruckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-1" />
    <circle cx="7.5" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
  </svg>
)

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const PhoneIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
  </svg>
)

export const MailIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const FacebookIcon = (props: IconProps) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v8h4v-8h3.2l.8-4H13V9c0-.67.33-1 1-1Z" />
  </svg>
)

export const InstagramIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const TikTokIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M15 3v11a4 4 0 1 1-4-4" />
    <path d="M15 3c.7 2.5 2.2 4 5 4" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const HeartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  </svg>
)

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const BanknoteIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
)

export const LeafIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 9.3-3.5 15.8-8.2 17.04Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
)
