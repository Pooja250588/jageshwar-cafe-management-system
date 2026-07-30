import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

function Home() {
  const navigate = useNavigate();
  const [featuredFoods, setFeaturedFoods] = useState([]);

  useEffect(() => {
    API.get("/foods")
      .then((res) => {
        const targetNames = ["panipuri", "bhel", "manchurian"];
        const matched = res.data.filter((food) =>
          targetNames.includes(food.name?.toLowerCase())
        );
        // Sort to match the target order
        matched.sort((a, b) => {
          return targetNames.indexOf(a.name?.toLowerCase()) - targetNames.indexOf(b.name?.toLowerCase());
        });
        setFeaturedFoods(matched);
      })
      .catch((err) => {
        console.error("Failed to load featured foods:", err);
      });
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Delicious Food, Delivered to <span>Your Village</span>
          </h1>
          <p>
            Experience premium restaurant-grade taste from Jageshwar Cafe & Restaurant, right here in Jawra. Hot, fresh, and delivered straight to your doorstep.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/menu")}>
              🛍️ Order Now
            </button>
            <button className="secondary-btn" onClick={() => navigate("/menu")}>
              📖 View Menu
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"
            alt="Jageshwar Cafe Delicious Platter"
          />
        </div>
      </section>

      {/* Featured / Popular Foods */}
      <section className="featured-foods">
        <h2>Popular Delights 🔥</h2>
        <div className="featured-grid">
          {featuredFoods.length > 0 ? (
            featuredFoods.map((food) => (
              <div key={food._id} className="featured-card" style={{ cursor: "pointer" }} onClick={() => navigate("/menu")}>
                <img
                  src={food.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500"}
                  alt={food.name}
                />
                <h3>{food.name}</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>
                  Freshly prepared from our menu. Category: {food.category}
                </p>
                <p className="price">₹{food.price}</p>
              </div>
            ))
          ) : (
            <>
              <div className="featured-card" style={{ cursor: "pointer" }} onClick={() => navigate("/menu")}>
                <img
                  src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500"
                  alt="Panipuri"
                />
                <h3>Panipuri</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>
                  Crispy puri filled with spicy, tangy flavored water and potatoes.
                </p>
                <p className="price">₹19</p>
              </div>

              <div className="featured-card" style={{ cursor: "pointer" }} onClick={() => navigate("/menu")}>
                <img
                  src="https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500"
                  alt="Bhel"
                />
                <h3>Bhel</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>
                  A savory snack made of puffed rice, vegetables and tangy tamarind sauce.
                </p>
                <p className="price">₹39</p>
              </div>

              <div className="featured-card" style={{ cursor: "pointer" }} onClick={() => navigate("/menu")}>
                <img
                  src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500"
                  alt="Manchurian"
                />
                <h3>Manchurian</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>
                  Spicy, deep-fried veggie balls tossed in tangy and savory Chinese sauces.
                </p>
                <p className="price">₹28</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-us">
        <h2>Why Order From Us? ⭐</h2>
        <div className="why-grid">
          <div>
            <span style={{ fontSize: "3rem" }}>🚀</span>
            <h3>Superfast Village Delivery</h3>
            <p>We deliver hot food directly to your home anywhere in Jawra and neighboring villages in Tehsil Athner.</p>
          </div>
          <div>
            <span style={{ fontSize: "3rem" }}>🥗</span>
            <h3>100% Fresh Ingredients</h3>
            <p>Vegetables, milk, and cheese are sourced fresh daily to ensure healthy and delicious meals.</p>
          </div>
          <div>
            <span style={{ fontSize: "3rem" }}>👨‍🍳</span>
            <h3>Experienced Chefs</h3>
            <p>Experienced team crafting delectable fast food, mocktails, sweets, and bakery treats.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section-modern">
        <div className="contact-card-modern">
          <div className="contact-info-col">
            <h3>Visit Jageshwar Cafe & Restaurant ☕</h3>
            <p>
              Craving something delicious? Come sit with friends or order online for lightning-fast village delivery.
            </p>
            <div className="contact-details-list">
              <div className="contact-detail-item">
                <span className="icon">📍</span>
                <div className="text">
                  <h5>Location</h5>
                  <p>Near Post Office ,jio tower, Jawara, Tehsil Athner, District Betul, PIN Code: 460110</p>
                </div>
              </div>
              <div className="contact-detail-item">
                <span className="icon">🕒</span>
                <div className="text">
                  <h5>Operational Hours</h5>
                  <p>Open Daily: 04:00 PM - 11:00 PM</p>
                </div>
              </div>
              <div className="contact-detail-item">
                <span className="icon">📞</span>
                <div className="text">
                  <h5>Phone & Support</h5>
                  <p>+91 9009193842,9302806091,9617435369(Support line for bulk & party orders)

                  </p>
                   <p>
                     jageshwargroup611@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;