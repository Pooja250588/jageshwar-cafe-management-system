import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function Cart() {
  const navigate = useNavigate();
  const { cart, increaseQuantity, decreaseQuantity } = useContext(CartContext);

  const { user } = useContext(AuthContext);

  const isJawraVillage = (villageName) => {
    if (!villageName) return true;
    const v = villageName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    return [
      "jawra",
      "jawara",
      "jaora",
      "javra",
      "jawrah",
    ].includes(v);
  };

  const isJawra = user ? isJawraVillage(user.village) : true;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const packagingFee = cart.length > 0 ? 10 : 0;
  const deliveryFee = cart.length > 0 ? (isJawra ? 0 : 20) : 0;
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + packagingFee + deliveryFee + taxes;

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "2rem", textAlign: "center" }}>Your Food Cart 🛒</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "24px", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "4rem" }}>🛒</span>
          <h2 style={{ margin: "1.5rem 0 0.5rem" }}>Your cart is empty</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Add some delicious foods from our menu to satisfy your hunger!
          </p>
          <button className="primary-btn" onClick={() => navigate("/menu")}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="cart-grid">
          {/* Cart Items List */}
          <div className="cart-items-container">
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Selected Items</h2>
            {cart.map((item) => {
              const itemId = item._id || item.id;
              const cartItemId = item.selectedSize ? `${itemId}-${item.selectedSize}` : itemId;
              return (
                <div className="cart-item" key={cartItemId}>
                  <div className="cart-item-details">
                    <h3>
                      {item.name}
                      {item.selectedSize && (
                        <span style={{ fontSize: "0.85rem", color: "var(--primary)", marginLeft: "8px", fontWeight: "bold" }}>
                          ({item.selectedSize})
                        </span>
                      )}
                    </h3>
                    <p>₹{item.price}</p>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => decreaseQuantity(cartItemId)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(cartItemId)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bill Summary */}
          <div className="cart-summary-card">
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Bill Details</h2>
            
            <div className="summary-row">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery Partner Fee</span>
              <span>{deliveryFee > 0 ? `₹${deliveryFee}` : <span style={{ color: "#2ecc71", fontWeight: "bold" }}>FREE (Jawra)</span>}</span>
            </div>
            
            <div className="summary-row">
              <span>Restaurant Packaging</span>
              <span>₹{packagingFee}</span>
            </div>
            
            <div className="summary-row">
              <span>Taxes & Charges (5% GST)</span>
              <span>₹{taxes}</span>
            </div>

            <div className="summary-row total">
              <span>To Pay</span>
              <span>₹{grandTotal}</span>
            </div>

            <button
              className="primary-btn"
              style={{ width: "100%", marginTop: "1.5rem", justifyContent: "center" }}
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;