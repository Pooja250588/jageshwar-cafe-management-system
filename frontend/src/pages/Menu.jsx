import { useState, useEffect } from "react";
import API from "../utils/api";
import FoodCard from "../components/FoodCard";

function Menu() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Cold Coffee",
    "Snacks & Chaat",
    "Indo-Chinese",
    "Cheesy Pizza",
    "Special Combo",
    "Tea & Coffee",
    "Dessert",
    "Beverage",
    "Lunch",
    "Dinner"
  ];

  useEffect(() => {
    API.get("/foods")
      .then((res) => {
        setFoods(res.data);
      })
      .catch((err) => {
        console.error("Failed to load food menu:", err);
      });
  }, []);

 const filteredFoods = foods.filter((food) => {
  const matchesSearch = food.name
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesCategory =
    activeCategory === "All" ||
    food.category?.toLowerCase() === activeCategory.toLowerCase();

  const isAvailable = food.available === true;

  return matchesSearch && matchesCategory && isAvailable;
});

  return (
    <div className="menu-page">
      <h1>Our Delicious Menu 🍕</h1>

      <div className="menu-controls">
        <div className="search-box-container">
          <input
            type="text"
            placeholder="Search for dishes, cakes, drinks..."
            className="search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredFoods.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <h2>No dishes found</h2>
          <p>Try searching for another item or check different categories.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredFoods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Menu;