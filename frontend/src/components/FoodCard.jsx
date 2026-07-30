import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { NotificationContext } from "../context/NotificationContext";

// SVG placeholder for when food images fail to load
const FallbackImage = ({ name }) => (
  <div
    style={{
      width: "100%",
      height: "200px",
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#94a3b8",
      fontSize: "0.85rem",
      gap: "8px",
    }}
  >
    <span style={{ fontSize: "2.5rem" }}>🍽️</span>
    <span style={{ fontWeight: 500, textAlign: "center", padding: "0 1rem" }}>
      {name || "Delicious Food"}
    </span>
  </div>
);

function FoodCard({ food }) {
  const { addToCart } = useContext(CartContext);
  const { addNotification } = useContext(NotificationContext);
  const [imageError, setImageError] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    food.sizes && food.sizes.length > 0 ? food.sizes[0].size : null
  );

  // Dynamic price calculation based on selected size
  const currentPrice = selectedSize
    ? (food.sizes.find((s) => s.size === selectedSize)?.price || food.price)
    : food.price;

  // Simple heuristic for Veg / Non-Veg tagging
  const isNonVeg = 
    food.category?.toLowerCase().includes("chicken") || 
    food.category?.toLowerCase().includes("egg") || 
    food.category?.toLowerCase().includes("non-veg") ||
    food.name?.toLowerCase().includes("chicken") ||
    food.name?.toLowerCase().includes("egg");

  return (
    <div className="food-card">
      <div className="badge-container">
        <span className={`tag-badge ${isNonVeg ? "tag-nonveg" : "tag-veg"}`}>
          {isNonVeg ? "● Non-Veg" : "● Veg"}
        </span>
      </div>

      {imageError || !food.image ? (
        <FallbackImage name={food.name} />
      ) : (
        <img 
          src={food.image} 
          alt={food.name}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}

      <div className="food-info">
        <div className="food-meta">
          <span className="category-lbl">{food.category || "Fast Food"}</span>
          <span className="rating-lbl">⭐ {food.rating || "4.5"}</span>
        </div>

        <h3>{food.name}</h3>

        {/* Portion Size Selection */}
        {food.sizes && food.sizes.length > 0 && (
          <div className="size-selector-container" style={{ margin: "10px 0", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>Size:</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {food.sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setSelectedSize(s.size)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    border: selectedSize === s.size ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: selectedSize === s.size ? "var(--primary)" : "transparent",
                    color: selectedSize === s.size ? "white" : "var(--text)",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card-footer">
          <span className="price">₹{currentPrice}</span>
          {!food.available && (
            <div
              style={{
                color: "#ef4444",
                fontWeight: "bold",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              ❌ Out Of Stock
            </div>
          )}

          <button
            className="add-cart-btn"
            disabled={!food.available}
            style={{
              opacity: food.available ? 1 : 0.5,
              cursor: food.available ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              if (!food.available) return;

              addToCart(food, selectedSize);

              addNotification(
                "Added to Cart 🛒",
                `"${food.name}"${selectedSize ? ` (${selectedSize})` : ""} has been added to your cart.`
              );
            }}
          >
            {food.available ? "Add to Cart +" : "Out Of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodCard;