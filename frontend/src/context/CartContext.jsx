import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (food, selectedSize = null) => {
    const foodId = food._id || food.id;
    const targetKey = selectedSize ? `${foodId}-${selectedSize}` : foodId;

    // Determine the price of this specific size if it exists
    let finalPrice = food.price;
    if (selectedSize && food.sizes && food.sizes.length > 0) {
      const sizeObj = food.sizes.find((s) => s.size === selectedSize);
      if (sizeObj) {
        finalPrice = sizeObj.price;
      }
    }

    const existing = cart.find((item) => {
      const itemKey = item.selectedSize ? `${(item._id || item.id)}-${item.selectedSize}` : (item._id || item.id);
      return itemKey === targetKey;
    });

    if (existing) {
      setCart(
        cart.map((item) => {
          const itemKey = item.selectedSize ? `${(item._id || item.id)}-${item.selectedSize}` : (item._id || item.id);
          return itemKey === targetKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        })
      );
    } else {
      setCart([
        ...cart,
        {
          ...food,
          price: finalPrice,
          selectedSize: selectedSize,
          quantity: 1,
        },
      ]);
    }
  };

  const increaseQuantity = (cartItemId) => {
    setCart(
      cart.map((item) => {
        const itemKey = item.selectedSize ? `${(item._id || item.id)}-${item.selectedSize}` : (item._id || item.id);
        return itemKey === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item;
      })
    );
  };

  const decreaseQuantity = (cartItemId) => {
    setCart(
      cart
        .map((item) => {
          const itemKey = item.selectedSize ? `${(item._id || item.id)}-${item.selectedSize}` : (item._id || item.id);
          return itemKey === cartItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;