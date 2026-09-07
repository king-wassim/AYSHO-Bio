import {
  TruckIcon,
  BanknoteIcon,
  ShieldIcon,
  PhoneIcon,
  MailIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from './icons'

const reassurance = [
  { icon: BanknoteIcon, title: 'Paiement à la livraison', text: 'Payez en espèces au livreur, en toute confiance.' },
  { icon: TruckIcon, title: 'Livraison Tunisie', text: 'Partout en Tunisie en 24 à 48h.' },
  { icon: ShieldIcon, title: 'Produits authentiques', text: 'Dermocosmétique original, sources officielles.' },

]

const contactLinks = [
  { label: 'contact@aysho.tn', href: 'mailto:contact@aysho.tn', icon: MailIcon },
  { label: 'aysho.tn', href: 'https://www.facebook.com/share/1EGenJG1rd/', icon: FacebookIcon },
  { label: 'aysho.tn', href: 'https://www.instagram.com/aysho.tn?igsi=ZmJ4NGlpcnl5azNv', icon: InstagramIcon },
  { label: 'aysho.tn', href: 'https://tiktok.com/@aysho.tn', icon: TikTokIcon },
]

export default function Footer() {
  return (
    <footer className="mt-8 bg-brand-900 text-brand-50">
      {/* Reassurance strip */}
      <div className="border-b border-brand-800">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 sm:gap-6 sm:py-10 lg:grid-cols-4">
          {reassurance.map((r) => (
            <div key={r.title} className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-brand-200">
                <r.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  {r.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-brand-200">
                  {r.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5a3 3 0 0 1 3 3v3h3a3 3 0 0 1 0 6h-3v3a3 3 0 0 1-6 0v-3H6a3 3 0 0 1 0-6h3V8a3 3 0 0 1 3-3z" />
              </svg>
            </div>
            <div>
              <span className="block font-display text-2xl font-extrabold tracking-tight text-white">
                Aysho
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
          Aysho est une boutique de vente en ligne de produits alimentaires & cosmétiques 100% naturels.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-200">
            <PhoneIcon className="size-4" />
            <span>92 901 310</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Contactez-nous
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contactLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-sm text-brand-200 transition hover:bg-brand-800 hover:text-white"
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="border-t border-brand-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-brand-300 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Aysho — Tous droits réservés.</p>
          <p className="max-w-full">Livraison à domicile · Paiement à la livraison · Tunisie</p>
        </div>
      </div>
    </footer>
  )
}
