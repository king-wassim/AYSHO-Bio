import { TruckIcon, ShieldIcon, BanknoteIcon, LeafIcon } from './icons'

interface HeroProps {
  onShopNow: () => void
}

const features = [
  { icon: BanknoteIcon, label: 'Paiement à la livraison' },
  { icon: TruckIcon, label: 'Livraison 24-48h' },
  { icon: ShieldIcon, label: 'Produits authentiques' },
  { icon: LeafIcon, label: 'Dermocosmétique' },
]

export default function Hero({ onShopNow }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-sand-50 to-brand-100">
      {/* Blobs décoratifs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sand-200 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-16 lg:grid-cols-2 lg:py-24">
        {/* Texte */}
        <div className="text-center sm:text-left">
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-5xl md:text-6xl">
            Votre santé {' '}
            <br />
            <span className="text-brand-600"> notre propriété.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-base">
            AYSHO Bio est une boutique de vente en ligne de produits alimentaires & cosmétiques 100% naturels.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={onShopNow}
              className="w-full rounded-xl bg-brand-700 px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800 hover:shadow-lg sm:w-auto"
            >
              Nos produits
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 bg-white/70 p-3 text-center backdrop-blur sm:items-start sm:text-left"
              >
                <f.icon className="h-5 w-5 text-brand-600" />
                <span className="text-xs font-medium leading-tight text-slate-700">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Image — masquée sur mobile, visible à partir de lg */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-3xl shadow-card ring-1 ring-sand-200">
            <img
              src="https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="Produits de parapharmacie AYSHO"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-900/70 to-transparent p-5">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">Best-seller</p>
                  <p className="font-display text-lg font-bold">Crème Hydratante visage</p>
                </div>
                <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                  42,500 DT
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 top-6 rotate-3 rounded-2xl bg-white p-3 shadow-card">
            <p className="text-xs font-semibold text-brand-700">Paiement</p>
            <p className="font-display text-sm font-bold text-slate-800">à la livraison</p>
          </div>
        </div>
      </div>
    </section>
  )
}
