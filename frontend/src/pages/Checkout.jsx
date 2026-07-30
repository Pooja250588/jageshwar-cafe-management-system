import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";

function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill user information if available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setVillage(user.village || "");
      setAddress(user.address || "");
    } else {
      // Redirect to login if user tries to checkout without logging in
      alert("Please login to proceed with order checkout.");
      navigate("/login");
    }
  }, [user, navigate]);

  const isJawraVillage = (villageName) => {
    if (!villageName) return false;
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

  const isJawra = isJawraVillage(village);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const packagingFee = cart.length > 0 ? 10 : 0;
  const deliveryFee = cart.length > 0 ? (isJawra ? 0 : 20) : 0;
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + packagingFee + deliveryFee + taxes;
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePaymentSuccess = async (razorpayResponse) => {
    setLoading(true);
    try {
      // Verify payment
      await API.post("/payment/verify", {
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      });

      // Create order
      const orderData = {
        customerName: name,
        phone,
        address: `${address}, Village: ${village}`,
        items: cart,
        totalAmount: grandTotal,
        paymentMethod: "Online",
        paymentStatus: "Paid",
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      };

      await API.post("/orders", orderData);

      addNotification(
        "Order Placed Successfully! 🍕",
        `Payment of ₹${grandTotal} received. Your order is now in the kitchen!`
      );

      clearCart();
      navigate("/orders");
    } catch (err) {
      console.error("Order creation after payment failed:", err);
      alert("Order registration failed. Please contact support with payment ID: " + razorpayResponse.razorpay_payment_id);
    } finally {
      setLoading(false);
    }
  };

  const handleMockSuccess = () => {
    setShowMockModal(false);
    if (!mockOrderDetails) return;
    
    const simulatedResponse = {
      razorpay_order_id: mockOrderDetails.id,
      razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 11).toUpperCase(),
      razorpay_signature: "mock_signature_valid"
    };

    handleOnlinePaymentSuccess(simulatedResponse);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const minimumOrder = isJawraVillage(village) ? 100 : 200;

    if (grandTotal < minimumOrder) {
      alert(
        `Minimum order for ${
          isJawraVillage(village) ? "Jawra Area" : "Other Villages"
        } is ₹${minimumOrder}`
      );
      return;
    }

    setLoading(true);

    if (paymentMethod === "COD") {
      try {
        const orderData = {
          customerName: name,
          phone,
          address: `${address}, Village: ${village}`,
          items: cart,
          totalAmount: grandTotal,
          paymentMethod: "COD",
          paymentStatus: "Pending"
        };

        await API.post("/orders", orderData);

        addNotification(
          "Order Placed Successfully! 🍕",
          `Order of ₹${grandTotal} has been successfully sent to Jageshwar Cafe kitchen!`
        );

        clearCart();
        navigate("/orders");
      } catch (error) {
        console.error("Place order failed:", error);
        alert(error.response?.data?.message || "Failed to place order.");
      } finally {
        setLoading(false);
      }
    } else {
      // Online Payment integration
      try {
        const res = await API.post("/payment/create-order", { amount: grandTotal });
        const orderData = res.data;

        if (orderData.mockMode) {
          // Open mock gateway modal
          setMockOrderDetails(orderData);
          setShowMockModal(true);
          setLoading(false);
        } else {
          // Open real Razorpay
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert("Failed to load payment gateway SDK. Check your internet connection.");
            setLoading(false);
            return;
          }

          const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Jageshwar Cafe & Restaurant",
            description: "Online Food Order Payment",
            order_id: orderData.id,
            handler: function (response) {
              handleOnlinePaymentSuccess(response);
            },
            prefill: {
              name,
              contact: phone,
              email: user?.email || ""
            },
            theme: {
              color: "#ff6b35"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          setLoading(false);
        }
      } catch (error) {
        console.error("Initiate payment failed:", error);
        alert(error.response?.data?.message || "Failed to initialize payment gateway.");
        setLoading(false);
      }
    }
  };
  return (
    <div className="page-container">
      <div className="form-card">
        <h1>Confirm Delivery Details</h1>

        <div style={{ marginBottom: "2rem", background: "var(--background)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Order Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Items Subtotal ({cart.length} items):</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Packaging Fee:</span>
              <span>₹{packagingFee}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Partner Fee:</span>
              <span>{deliveryFee > 0 ? `₹${deliveryFee}` : <span style={{ color: "#2ecc71", fontWeight: "bold" }}>FREE (Jawra)</span>}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>GST/Taxes (5%):</span>
              <span>₹{taxes}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "8px", fontSize: "1.05rem", fontWeight: "bold", color: "var(--text)" }}>
              <span>Grand Total:</span>
              <span style={{ color: "var(--primary)" }}>₹{grandTotal}</span>
            </div>
          </div>
          <p
            style={{
              color: "#ff6b35",
              fontWeight: "bold",
              marginTop: "12px",
              fontSize: "0.85rem",
              textAlign: "center",
              margin: "12px 0 0 0"
            }}
          >
            ⚠️ Minimum Order: {isJawra ? "₹100 (Jawra Area)" : "₹200 (Other Villages)"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              className="form-control"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="village">Delivery Village</label>
            <input
  type="text"
  id="village"
  className="form-control"
  placeholder="Enter your village name"
  value={village}
  onChange={(e) => setVillage(e.target.value)}
  required
/>
          </div>

          <div className="form-group">
            <label htmlFor="address">Full Address / Landmark</label>
            <textarea
              id="address"
              className="form-control form-control-textarea"
              placeholder="House Number, Landmark, Near Post Office, etc."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label style={{ marginBottom: "0.75rem", display: "block", fontWeight: "bold" }}>Payment Method</label>
            <div style={{ display: "flex", gap: "15px", flexDirection: window.innerWidth < 480 ? "column" : "row" }}>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                cursor: "pointer", 
                background: "rgba(255,255,255,0.02)", 
                padding: "12px 15px", 
                borderRadius: "10px", 
                border: paymentMethod === "COD" ? "2px solid #ff6b35" : "1px solid var(--border)", 
                flex: 1,
                transition: "all 0.2s"
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  style={{ accentColor: "#ff6b35", width: "18px", height: "18px" }}
                />
                <div>
                  <span style={{ fontWeight: "bold", display: "block", fontSize: "0.95rem" }}>💵 Cash on Delivery</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pay at delivery time</span>
                </div>
              </label>
              
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                cursor: "pointer", 
                background: "rgba(255,255,255,0.02)", 
                padding: "12px 15px", 
                borderRadius: "10px", 
                border: paymentMethod === "Online" ? "2px solid #ff6b35" : "1px solid var(--border)", 
                flex: 1,
                transition: "all 0.2s"
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Online"
                  checked={paymentMethod === "Online"}
                  onChange={() => setPaymentMethod("Online")}
                  style={{ accentColor: "#ff6b35", width: "18px", height: "18px" }}
                />
                <div>
                  <span style={{ fontWeight: "bold", display: "block", fontSize: "0.95rem" }}>💳 Pay Online</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>UPI, Card or Wallet</span>
                </div>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn" style={{ justifyContent: "center", width: "100%" }} disabled={loading}>
              {loading ? "Processing..." : paymentMethod === "COD" ? "Confirm & Place Order" : `Pay ₹${grandTotal} & Place Order`}
            </button>
          </div>
        </form>
      </div>

      {/* Mock Payment Gateway Modal Overlay */}
      {showMockModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "rgba(30, 41, 59, 0.98)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            color: "white"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💳</div>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem", color: "white" }}>Razorpay Test Gateway</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Simulate secure online payment interface (Merchant: Jageshwar Cafe)
            </p>
            
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>TOTAL AMOUNT TO PAY</span>
              <h3 style={{ fontSize: "1.8rem", margin: "5px 0", color: "#ff6b35" }}>₹{grandTotal}</h3>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Order Ref: {mockOrderDetails?.id}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button 
                onClick={handleMockSuccess}
                style={{
                  background: "#2ecc71",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                ✔ Simulate Successful Payment
              </button>
              <button 
                onClick={() => {
                  setShowMockModal(false);
                  alert("Simulated: Customer cancelled the transaction.");
                }}
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                ✕ Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;