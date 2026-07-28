import { useState, type FormEvent } from 'react'
import { formatPrice } from '../data/catalog'
import { useCart } from '../store/CartContext'
import {
  CheckIcon,
  CloseIcon,
  BanknoteIcon,
  TruckIcon,
  ShieldIcon,
} from './icons'

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

interface CheckoutProps {
  onClose: () => void
}

interface CustomerInfo {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  governorate: string
  notes: string
}

const governorates = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili',
]

const empty: CustomerInfo = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  governorate: 'Tunis',
  notes: '',
}

export default function Checkout({ onClose }: CheckoutProps) {
const { items, totalPrice, clear } = useCart()
  const [form, setForm] = useState<CustomerInfo>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')

  const grandTotal = totalPrice

  const update = (field: keyof CustomerInfo, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof CustomerInfo, string>> = {}
    if (!form.firstName.trim()) next.firstName = 'Prénom requis'
    if (!form.lastName.trim()) next.lastName = 'Nom requis'
    if (!/^[0-9+\s]{8,}$/.test(form.phone.trim()))
      next.phone = 'Téléphone valide requis'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'E-mail invalide'
    if (!form.address.trim()) next.address = 'Adresse requise'
    if (!form.city.trim()) next.city = 'Ville requise'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      const payload = {
        data: {
          customerName: `${form.firstName} ${form.lastName}`,
          customerPhone: form.phone,
          customerAddress: `${form.address}, ${form.city}, ${form.governorate} - Notes: ${form.notes}`,
          totalPrice: grandTotal,
          state: 'pending',
          items: items.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      }

      const res = await fetch(`${STRAPI_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      interface OrderResponse {
        data: { documentId?: string; id?: string | number };
      }
      const resData = (await res.json()) as OrderResponse;

      const rawId = resData.data.documentId ?? String(resData.data.id ?? '');
      const id = 'AYSHO-' + rawId.slice(-6).toUpperCase()
      setOrderId(id)
      setSubmitted(true)
      clear()
    } catch (err) {
      console.error(err)
      alert("Une erreur s'est produite lors de la validation de la commande. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg animate-fade-up overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-8 text-center text-white">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/20">
              <CheckIcon className="size-8" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">
              Commande confirmée !
            </h2>
            <p className="mt-1 text-sm text-brand-50/90">
              Merci {form.firstName}, votre commande a bien été enregistrée.
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Numéro de commande</span>
                <span className="font-display font-bold text-brand-800">
                  {orderId}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Montant à payer</span>
                <span className="font-display font-bold text-brand-800">
                  {formatPrice(grandTotal)} DT
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Paiement</span>
                <span className="font-medium text-slate-700">
                  À la livraison (espèces)
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <p className="text-sm font-semibold text-brand-800">
                Prochaines étapes
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-brand-800/90">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  Notre équipe vous appellera au {form.phone} pour confirmer.
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  Livraison à {form.address}, {form.city} ({form.governorate}).
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  Préparez le montant exact en espèces pour le livreur.
                </li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Retour à la boutique
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-900/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-4 w-full max-w-2xl animate-fade-up overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sand-200 bg-white px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">
              Finaliser la commande
            </h2>
            <p className="text-xs text-slate-500">
              Paiement à la livraison · Livraison à domicile
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-sand-100"
            aria-label="Fermer"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="max-h-[75vh] overflow-y-auto">
          <div className="grid gap-6 p-6 md:grid-cols-5">
            {/* Coordinates */}
            <div className="space-y-4 md:col-span-3">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-800">
                  Vos coordonnées
                </h3>
                <p className="text-xs text-slate-500">
                  Ces informations sont envoy&eacute;es &agrave; l&apos;administrateur pour traiter votre commande.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Prénom"
                  required
                  value={form.firstName}
                  onChange={(v) => update('firstName', v)}
                  error={errors.firstName}
                />
                <Field
                  label="Nom"
                  required
                  value={form.lastName}
                  onChange={(v) => update('lastName', v)}
                  error={errors.lastName}
                />
              </div>

              <Field
                label="Téléphone"
                required
                type="tel"
                placeholder="+216 ..."
                value={form.phone}
                onChange={(v) => update('phone', v)}
                error={errors.phone}
              />

              <Field
                label="E-mail"
                type="email"
                placeholder="(optionnel)"
                value={form.email}
                onChange={(v) => update('email', v)}
                error={errors.email}
              />

              <Field
                label="Adresse de livraison"
                required
                placeholder="Rue, numéro, étage..."
                value={form.address}
                onChange={(v) => update('address', v)}
                error={errors.address}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Ville"
                  required
                  value={form.city}
                  onChange={(v) => update('city', v)}
                  error={errors.city}
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Gouvernorat
                  </label>
                  <select
                    value={form.governorate}
                    onChange={(e) => update('governorate', e.target.value)}
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {governorates.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Notes (optionnel)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={2}
                  placeholder="Indications pour le livreur..."
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="md:col-span-2">
              <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-800">
                  Récapitulatif
                </h3>
                <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-xs">
                      <span className="text-slate-600">
                        {product.name} × {quantity}
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatPrice(product.price * quantity)} DT
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-sand-200 pt-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice)} DT</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <TruckIcon className="size-4" /> Livraison
                    </span>
                    <span className="font-medium text-emerald-600">Gratuite</span>
                  </div>
                  <div className="flex justify-between border-t border-sand-200 pt-2 font-display text-base font-bold text-brand-900">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)} DT</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
                  <BanknoteIcon className="size-4" />
                  Paiement à la livraison (espèces)
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  <ShieldIcon className="size-4" />
                  Vos données restent confidentielles
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-2 text-xs font-medium text-slate-700">
                  <TruckIcon className="size-4" />
                  Livraison 24-48h
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-sand-200 bg-sand-50 px-6 py-4">
            <button
              type="submit"
              disabled={items.length === 0 || isSubmitting}
              className="w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Traitement en cours...' : `Confirmer la commande — ${formatPrice(grandTotal)} DT`}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              En validant, vous acceptez d&apos;&ecirc;tre contact&eacute; par AYSHO pour la livraison.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  error?: string
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  error,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-sand-200 focus:border-brand-500 focus:ring-brand-200'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
