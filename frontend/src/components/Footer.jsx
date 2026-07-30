import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer-modern">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="logo" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.jpeg" alt="Jageshwar Cafe Logo" style={{ height: "40px", width: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }} />
            <h2 style={{ color: "white", fontSize: "1.3rem", margin: 0 }}>Jageshwar Cafe</h2>
          </div>
          <p>Delivering fresh fast food, bakery items, cakes, and village hospitality in Jawra & Athner, Betul region.</p>
        </div>

        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link to="/" style={{ color: "#94a3b8", textDecoration: "none" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Home</Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link to="/menu" style={{ color: "#94a3b8", textDecoration: "none" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Online Menu</Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link to="/orders" style={{ color: "#94a3b8", textDecoration: "none" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Track Orders</Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link to="/reviews" style={{ color: "#94a3b8", textDecoration: "none" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Customer Reviews</Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link to="/support" style={{ color: "#94a3b8", textDecoration: "none" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Customer Support</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Operational Hours</h3>
          <p>🕒 Open Daily</p>
          <p>04:00 PM - 11:00 PM</p>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "5px" }}>
            *Holiday hours may vary on local festivals.
          </p>
        </div>

        <div className="footer-col">
          <h3>Direct Booking</h3>
          <p>WhatsApp your bulk party or custom cake orders directly:</p>
          <a
            href="https://wa.me/919009193842"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "inline-block", marginTop: "10px" }}
          >
            <button className="primary-btn" style={{ padding: "10px 18px", fontSize: "0.85rem" }}>
              💬 Chat on WhatsApp
            </button>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Jageshwar Cafe & Restaurant | Post Office Road, Jawra, Betul (MP) 460110</p>
      </div>
    </footer>
  );
}

export default Footer;