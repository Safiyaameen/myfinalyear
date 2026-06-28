import { useEffect, useState } from "react";

export type CartItem = {
  productSlug: string;
  shopSlug: string;
  qty: number;
};

const KEY = "shopcity_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("shopcity:cart"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("shopcity:cart", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("shopcity:cart", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return items;
}

export function addToCart(productSlug: string, shopSlug: string, qty = 1) {
  const cur = read();
  const idx = cur.findIndex((i) => i.productSlug === productSlug && i.shopSlug === shopSlug);
  if (idx >= 0) cur[idx].qty += qty;
  else cur.push({ productSlug, shopSlug, qty });
  write(cur);
}

export function updateQty(productSlug: string, shopSlug: string, qty: number) {
  const cur = read().map((i) =>
    i.productSlug === productSlug && i.shopSlug === shopSlug ? { ...i, qty } : i,
  );
  write(cur.filter((i) => i.qty > 0));
}

export function removeFromCart(productSlug: string, shopSlug: string) {
  write(read().filter((i) => !(i.productSlug === productSlug && i.shopSlug === shopSlug)));
}

export function clearCart() {
  write([]);
}
