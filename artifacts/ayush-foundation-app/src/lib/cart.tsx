import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartProduct = {
  id: number;
  sourceProductId: string;
  name: string;
  company: string | null;
  imageUrl?: string | null;
  salePrice: string | null;
  mrp?: string | null;
  quantity: string | null;
  prescriptionRequired?: boolean;
  dosageForm?: string | null;
  packSize?: string | null;
};

export type CartItem = { product: CartProduct; quantity: number };
type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hasPrescriptionItem: boolean;
  add: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'ayush-foundation-cart';
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[];
      return Array.isArray(saved) ? saved.filter((item) => item?.product?.id && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + (Number(item.product.salePrice) || 0) * item.quantity, 0),
    hasPrescriptionItem: items.some((item) => Boolean(item.product.prescriptionRequired)),
    add(product, quantity = 1) {
      setItems((current) => {
        const existing = current.find((item) => item.product.id === product.id);
        if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item);
        return [...current, { product, quantity: Math.max(1, Math.min(99, quantity)) }];
      });
    },
    updateQuantity(id, quantity) {
      setItems((current) => quantity < 1 ? current.filter((item) => item.product.id !== id) : current.map((item) => item.product.id === id ? { ...item, quantity: Math.min(99, Math.floor(quantity)) } : item));
    },
    remove(id) {
      setItems((current) => current.filter((item) => item.product.id !== id));
    },
    clear() {
      setItems([]);
    },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}