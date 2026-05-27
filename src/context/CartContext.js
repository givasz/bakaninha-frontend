import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const key = item.cartKey;
      const existing = prev.find(i => i.cartKey === key);
      if (existing) {
        return prev.map(i => i.cartKey === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((cartKey) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey));
  }, []);

  const updateQty = useCallback((cartKey, delta) => {
    setItems(prev =>
      prev.map(i => i.cartKey === cartKey ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
