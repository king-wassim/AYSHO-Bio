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

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-16 lg:grid-cols-2 lg:py-24">
        {/* Texte */}
        <div className="text-center sm:text-left">
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-6xl lg:text-6xl">
            Votre santé {' '}
            <br />
            <span className="text-brand-600"> notre propriété.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-slate-600 sm:mx-0 sm:text-2xl">
            Aysho est une boutique de vente en ligne de produits alimentaires & cosmétiques 100% naturels.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={onShopNow}
              className="w-full rounded-xl bg-brand-700 px-9 py-5 text-lg font-bold text-white shadow-card transition hover:bg-brand-800 hover:shadow-lg sm:w-auto sm:text-xl"
            >
              Nos produits
            </button>
          </div>

          {/* Features */}
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex min-h-28 flex-col items-center gap-3 rounded-xl border border-sand-200 bg-white/70 p-5 text-center backdrop-blur sm:items-start sm:text-left"
              >
                <f.icon className="size-7 text-brand-600" />
                <span className="text-base font-semibold leading-tight text-slate-700 sm:text-lg">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Image — masquée sur mobile, visible à partir de lg */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-[2rem] bg-white p-3 shadow-card ring-1 ring-sand-200">
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
