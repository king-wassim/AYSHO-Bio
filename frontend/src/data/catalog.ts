export type CategoryId =
  | 'soins-visage'
  | 'corps'
  | 'cheveux'
  | 'bebes-mamans'
  | 'complements-alimentaires'

export interface Category {
  id: CategoryId
  name: string
  tagline: string
  description: string
  image: string
}

export interface Product {
  id: string
  name: string
  brand: string
  categoryId: CategoryId
  price: number
  oldPrice?: number
  image: string
  gallery?: string[]
  shortDescription: string
  description?: string
  volume: string
  badges?: string[]
  rating: number
  reviews: number
}

export const categories: Category[] = [
  {
    id: 'soins-visage',
    name: 'Soins visage',
    tagline: 'Une peau saine, rayonnante',
    description:
      'Crèmes, sérums et nettoyants dermocosmétiques pour tous les types de peau.',
    image:
      'https://images.pexels.com/photos/3851674/pexels-photo-3851674.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'corps',
    name: 'Corps',
    tagline: 'Prenez soin de votre corps',
    description:
      'Huiles, baumes et laits hydratants pour une peau douce et nourrie.',
    image:
      'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'cheveux',
    name: 'Cheveux',
    tagline: 'Des cheveux forts et brillants',
    description:
      'Shampoings, soins et sérums capillaires pour chaque nature de cheveu.',
    image:
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'bebes-mamans',
    name: 'Bébés & Mamans',
    tagline: 'Douceur et sécurité',
    description:
      'Soins adaptés aux bébés et aux mamans, testés sous contrôle dermatologique.',
    image:
      'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'complements-alimentaires',
    name: 'Compléments alimentaires',
    tagline: "Votre bien-être de l'intérieur",
    description:
      'Vitamines, minéraux et compléments pour soutenir votre vitalité.',
    image:
      'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
]

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Crème Hydratante visage',
    brand: 'Aqualia Thermal',
    categoryId: 'soins-visage',
    price: 42.5,
    oldPrice: 52.0,
    image:
      'https://images.pexels.com/photos/3851674/pexels-photo-3851674.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      "Hydratation intense 48h pour peaux sensibles, à l'eau thermale.",
    volume: '50 ml',
    badges: ['Promo', 'Best-seller'],
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 'p2',
    name: 'Sérum éclat vitamine C',
    brand: 'Dermabright',
    categoryId: 'soins-visage',
    price: 68.0,
    image:
      'https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Sérum anti-taches et anti-fatigue, teint unifié en 4 semaines.',
    volume: '30 ml',
    badges: ['Nouveau'],
    rating: 4.7,
    reviews: 89,
  },
  {
    id: 'p3',
    name: 'Gel nettoyant doux',
    brand: 'Cetaphil-style',
    categoryId: 'soins-visage',
    price: 28.9,
    image:
      'https://images.pexels.com/photos/6621337/pexels-photo-6621337.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Nettoyant sans savon pour peaux sensibles, ne dessèche pas la peau.',
    volume: '250 ml',
    rating: 4.6,
    reviews: 210,
  },
  {
    id: 'p4',
    name: 'Contour des yeux anti-fatigue',
    brand: 'Lumière',
    categoryId: 'soins-visage',
    price: 55.0,
    image:
      'https://images.pexels.com/photos/6786516/pexels-photo-6786516.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Réduit cernes et poches, regard reposé dès le réveil.',
    volume: '15 ml',
    rating: 4.5,
    reviews: 64,
  },
  {
    id: 'p5',
    name: 'Lait corps nourrissant',
    brand: 'Lipikar',
    categoryId: 'corps',
    price: 38.0,
    image:
      'https://images.pexels.com/photos/4205256/pexels-photo-4205256.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Lait corporel pour peaux sèches à atopiques, confort immédiat.',
    volume: '400 ml',
    badges: ['Best-seller'],
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 'p6',
    name: 'Huile de douche lipidique',
    brand: 'Cleansia',
    categoryId: 'corps',
    price: 32.5,
    image:
      'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Nettoyant sans savon, respecte le film hydrolipidique.',
    volume: '200 ml',
    rating: 4.4,
    reviews: 78,
  },
  {
    id: 'p7',
    name: 'Baume réparateur mains',
    brand: 'Cicabiafine',
    categoryId: 'corps',
    price: 19.9,
    image:
      'https://images.pexels.com/photos/4205256/pexels-photo-4205256.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Répare les mains sèches et crevassées dès la première application.',
    volume: '100 ml',
    rating: 4.6,
    reviews: 92,
  },
  {
    id: 'p8',
    name: 'Shampoing doux fréquence',
    brand: 'Dercos',
    categoryId: 'cheveux',
    price: 26.0,
    image:
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Shampoing sans sulfates pour usage quotidien, tous types de cheveux.',
    volume: '250 ml',
    rating: 4.5,
    reviews: 134,
  },
  {
    id: 'p9',
    name: 'Sérum anti-chute capillaire',
    brand: 'Aminexil',
    categoryId: 'cheveux',
    price: 89.0,
    oldPrice: 105.0,
    image:
      'https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Sérum anti-chute et densifiant, pour cheveux plus forts et plus denses.',
    volume: '60 ml',
    badges: ['Promo'],
    rating: 4.4,
    reviews: 67,
  },
  {
    id: 'p10',
    name: 'Masque nourrissant profond',
    brand: 'NutriHair',
    categoryId: 'cheveux',
    price: 34.5,
    image:
      'https://images.pexels.com/photos/3993447/pexels-photo-3993447.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Masque à la kératine pour cheveux secs et abîmés, réparation intense.',
    volume: '200 ml',
    rating: 4.6,
    reviews: 45,
  },
  {
    id: 'p11',
    name: 'Gel lavant doux bébé',
    brand: 'Mustibé',
    categoryId: 'bebes-mamans',
    price: 24.0,
    image:
      'https://images.pexels.com/photos/1660995/pexels-photo-1660995.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Gel lavant visage et corps, pour la toilette quotidienne du bébé.',
    volume: '500 ml',
    rating: 4.8,
    reviews: 198,
  },
  {
    id: 'p12',
    name: 'Crème change bébé',
    brand: 'Bépanthène',
    categoryId: 'bebes-mamans',
    price: 22.5,
    image:
      'https://images.pexels.com/photos/3933252/pexels-photo-3933252.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Crème pour le change, prévient et répare les rougeurs du siège.',
    volume: '100 g',
    badges: ['Best-seller'],
    rating: 4.9,
    reviews: 245,
  },
  {
    id: 'p13',
    name: "Huile de soin vergetures",
    brand: 'MamanDouce',
    categoryId: 'bebes-mamans',
    price: 45.0,
    image:
      'https://images.pexels.com/photos/4205256/pexels-photo-4205256.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      "Huile de massage préventive des vergetures, pour la grossesse.",
    volume: '100 ml',
    rating: 4.7,
    reviews: 73,
  },
  {
    id: 'p14',
    name: 'Vitamine C 1000 mg',
    brand: 'VitalC',
    categoryId: 'complements-alimentaires',
    price: 35.0,
    image:
      'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Complément alimentaire pour soutenir le système immunitaire.',
    volume: '60 comprimés',
    badges: ['Best-seller'],
    rating: 4.6,
    reviews: 167,
  },
  {
    id: 'p15',
    name: 'Magnésium marin + vitamine B6',
    brand: 'Stressless',
    categoryId: 'complements-alimentaires',
    price: 29.9,
    image:
      'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Anti-fatigue et anti-stress, pour retrouver énergie et sérénité.',
    volume: '90 gélules',
    rating: 4.5,
    reviews: 88,
  },
  {
    id: 'p16',
    name: 'Oméga-3 poisson',
    brand: 'Oceana',
    categoryId: 'complements-alimentaires',
    price: 49.0,
    oldPrice: 58.0,
    image:
      'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600',
    shortDescription:
      'Acides gras essentiels pour le cœur et le cerveau, qualité pharmaceutique.',
    volume: '60 capsules',
    badges: ['Promo'],
    rating: 4.7,
    reviews: 112,
  },
]

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}

export function getProductsByCategory(categoryId: CategoryId): Product[] {
  return products.filter((p) => p.categoryId === categoryId)
}

export function getCategoryById(id: CategoryId): Category | undefined {
  return categories.find((c) => c.id === id)
}
