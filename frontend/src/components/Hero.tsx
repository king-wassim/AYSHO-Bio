import { TruckIcon, ShieldIcon, BanknoteIcon } from './icons'

interface HeroProps {
  onShopNow: () => void
}

const features = [
  { icon: BanknoteIcon, label: 'Paiement à la livraison' },
  { icon: TruckIcon, label: 'Livraison gratuite 24-48h' },
  { icon: ShieldIcon, label: 'Produits authentiques' },
  //{ icon: LeafIcon, label: 'Dermocosmétique' },
]

export default function Hero({ onShopNow }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-sand-50 to-brand-100">
      {/* Blobs décoratifs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-brand-200 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-sand-200 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:gap-8 sm:py-16 lg:grid-cols-2 lg:py-24">
        {/* Texte */}
        <div className="text-center sm:text-left">
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-brand-900 sm:mt-5 sm:text-6xl lg:text-6xl">
            Votre santé {' '}
            <br />
            <span className="text-brand-600"> notre propriété.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:mt-7 sm:mx-0 sm:text-2xl">
            Aysho est une boutique de vente en ligne de produits alimentaires & cosmétiques 100% naturels.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={onShopNow}
              className="w-full rounded-xl bg-brand-700 px-6 py-4 text-base font-bold text-white shadow-card transition hover:bg-brand-800 hover:shadow-lg sm:w-auto sm:px-9 sm:py-5 sm:text-xl"
            >
              Nos produits
            </button>
          </div>

          {/* Features */}
          <div className="mt-7 grid grid-cols-3 gap-2 sm:mt-9 sm:gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex min-h-24 flex-col items-center gap-2 rounded-xl border border-sand-200 bg-white/70 p-2.5 text-center backdrop-blur sm:min-h-28 sm:items-start sm:gap-3 sm:p-5 sm:text-left"
              >
                <f.icon className="size-5 text-brand-600 sm:size-7" />
                <span className="text-[11px] font-semibold leading-tight text-slate-700 sm:text-lg">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Image responsive : taille moyenne sur mobile, format desktop préservé */}
        <div className="relative order-first lg:order-none">
          <div className="relative mx-auto aspect-square w-full max-w-32 overflow-hidden rounded-[2rem] bg-white p-2 shadow-card ring-1 ring-sand-200 sm:max-w-xs sm:p-3 lg:max-w-md">
            <img
              src="/LOGO.jpg"
              alt="Logo AYSHO"
              className="size-full rounded-3xl object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
