export type SellerType = "physical" | "online" | "new";

export type Shop = {
  slug: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  sellerType: SellerType;
  logoHue: number;
};

export type ProductOffer = {
  shopSlug: string;
  price: number;
  stock: number;
  delivery: string;
};

export type Product = {
  slug: string;
  title: string;
  category: string;
  description: string;
  imageHue: number;
  offers: ProductOffer[];
};

export const cities = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Matara"];

export const categories = [
  { slug: "electronics", name: "Electronics", icon: "Smartphone" },
  { slug: "fashion", name: "Fashion", icon: "Shirt" },
  { slug: "books", name: "Books", icon: "BookOpen" },
  { slug: "beauty", name: "Beauty", icon: "Sparkles" },
  { slug: "home", name: "Home", icon: "Home" },
  { slug: "groceries", name: "Groceries", icon: "ShoppingBasket" },
  { slug: "mobile-accessories", name: "Mobile Accessories", icon: "Headphones" },
  { slug: "sports", name: "Sports", icon: "Dumbbell" },
  { slug: "jewelry", name: "Jewelry", icon: "Gem" },
];

export const shops: Shop[] = [
  {
    slug: "abc-electronics",
    name: "ABC Electronics",
    city: "Colombo",
    district: "Colombo",
    address: "No. 42, Main Street, Pettah, Colombo 11",
    phone: "+94 11 234 5678",
    email: "hello@abc-electronics.lk",
    category: "Electronics",
    description: "Three generations of trusted electronics retail in the heart of Pettah. Authorised resellers for major Sri Lankan brands.",
    rating: 4.8,
    reviews: 1284,
    sellerType: "physical",
    logoHue: 220,
  },
  {
    slug: "pettah-mobile-center",
    name: "Pettah Mobile Center",
    city: "Colombo",
    district: "Colombo",
    address: "First Cross Street, Pettah, Colombo 11",
    phone: "+94 77 555 1212",
    email: "shop@pettahmobile.lk",
    category: "Mobile Accessories",
    description: "Largest selection of phones, chargers and accessories in Pettah. Walk-in warranty.",
    rating: 4.6,
    reviews: 932,
    sellerType: "physical",
    logoHue: 12,
  },
  {
    slug: "kandy-fashion-house",
    name: "Kandy Fashion House",
    city: "Kandy",
    district: "Kandy",
    address: "Dalada Veediya, Kandy",
    phone: "+94 81 222 3344",
    email: "style@kandyfashion.lk",
    category: "Fashion",
    description: "Hill country fashion blending traditional Kandyan craft with modern silhouettes.",
    rating: 4.7,
    reviews: 612,
    sellerType: "physical",
    logoHue: 340,
  },
  {
    slug: "galle-home-store",
    name: "Galle Home Store",
    city: "Galle",
    district: "Galle",
    address: "Lighthouse Street, Galle Fort",
    phone: "+94 91 224 9090",
    email: "hello@gallehome.lk",
    category: "Home",
    description: "Curated homeware from southern artisans — ceramics, textiles, and wooden craft.",
    rating: 4.9,
    reviews: 388,
    sellerType: "physical",
    logoHue: 160,
  },
  {
    slug: "jaffna-book-bazaar",
    name: "Jaffna Book Bazaar",
    city: "Jaffna",
    district: "Jaffna",
    address: "KKS Road, Jaffna",
    phone: "+94 21 222 1010",
    email: "books@jaffnabazaar.lk",
    category: "Books",
    description: "Tamil, Sinhala and English literature, school texts and rare titles from the north.",
    rating: 4.5,
    reviews: 221,
    sellerType: "online",
    logoHue: 50,
  },
  {
    slug: "lanka-beauty-co",
    name: "Lanka Beauty Co.",
    city: "Negombo",
    district: "Gampaha",
    address: "Lewis Place, Negombo",
    phone: "+94 71 888 4242",
    email: "care@lankabeauty.lk",
    category: "Beauty",
    description: "Clean, cruelty-free beauty made in Sri Lanka with island botanicals.",
    rating: 4.4,
    reviews: 145,
    sellerType: "new",
    logoHue: 300,
  },
];

export const products: Product[] = [
  {
    slug: "iphone-15-fast-charger-20w",
    title: "iPhone 15 Fast Charger 20W (USB-C)",
    category: "Mobile Accessories",
    description: "Genuine 20W USB-C power adapter compatible with iPhone 15 / 15 Pro. 1 year shop warranty.",
    imageHue: 200,
    offers: [
      { shopSlug: "pettah-mobile-center", price: 2890, stock: 42, delivery: "Same-day Colombo" },
      { shopSlug: "abc-electronics", price: 3200, stock: 18, delivery: "2 day island-wide" },
      { shopSlug: "lanka-beauty-co", price: 3450, stock: 6, delivery: "3 day courier" },
    ],
  },
  {
    slug: "samsung-galaxy-a55-5g",
    title: "Samsung Galaxy A55 5G 256GB",
    category: "Electronics",
    description: "6.6\" Super AMOLED, 50MP triple camera, 5000mAh battery. Sri Lanka warranty.",
    imageHue: 260,
    offers: [
      { shopSlug: "abc-electronics", price: 142500, stock: 11, delivery: "Free Colombo delivery" },
      { shopSlug: "pettah-mobile-center", price: 139900, stock: 4, delivery: "Same-day Colombo" },
    ],
  },
  {
    slug: "handloom-kandyan-saree",
    title: "Handloom Kandyan Saree — Emerald",
    category: "Fashion",
    description: "100% cotton handloom saree woven in the Kandy hills. Includes matching blouse piece.",
    imageHue: 150,
    offers: [
      { shopSlug: "kandy-fashion-house", price: 8750, stock: 9, delivery: "3 day island-wide" },
    ],
  },
  {
    slug: "ceylon-cinnamon-1kg",
    title: "Premium Ceylon Cinnamon — 1kg",
    category: "Groceries",
    description: "True Ceylon cinnamon quills, grade Alba. Sourced direct from southern smallholders.",
    imageHue: 30,
    offers: [
      { shopSlug: "galle-home-store", price: 5400, stock: 30, delivery: "3 day courier" },
      { shopSlug: "lanka-beauty-co", price: 5900, stock: 12, delivery: "3 day courier" },
    ],
  },
  {
    slug: "anil-de-silva-collected-stories",
    title: "Collected Stories — Anil de Silva",
    category: "Books",
    description: "Hardcover anthology of short fiction from one of Sri Lanka's most celebrated voices.",
    imageHue: 80,
    offers: [
      { shopSlug: "jaffna-book-bazaar", price: 2150, stock: 24, delivery: "4 day courier" },
    ],
  },
  {
    slug: "coconut-oil-cold-pressed-500ml",
    title: "Cold-Pressed Virgin Coconut Oil 500ml",
    category: "Beauty",
    description: "Single-origin coconut oil from Puttalam, cold-pressed within 24 hours of harvest.",
    imageHue: 60,
    offers: [
      { shopSlug: "lanka-beauty-co", price: 1450, stock: 88, delivery: "3 day courier" },
      { shopSlug: "galle-home-store", price: 1650, stock: 22, delivery: "3 day courier" },
    ],
  },
];

export const findShop = (slug: string) => shops.find((s) => s.slug === slug);
export const findProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatLKR = (n: number) =>
  "Rs. " + n.toLocaleString("en-LK", { maximumFractionDigits: 0 });

export const sellerBadge = (t: SellerType) =>
  t === "physical"
    ? { label: "Verified Physical Store", tone: "trust" as const }
    : t === "online"
      ? { label: "Verified Online Seller", tone: "gold" as const }
      : { label: "New Seller Approved", tone: "muted" as const };
