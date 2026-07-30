import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import API from "../utils/api";

export default function Chatbot() {
  const { user } = useContext(AuthContext);
  const { cart } = useContext(CartContext);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaste! Welcome to Jageshwar Cafe AI Support 🤖. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Add User Message
    const userMsg = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Generate response after small simulation delay
    setTimeout(async () => {
      let botResponse = "";
      const text = textToSend.toLowerCase();

      // Heuristic matches
      if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("namaste")) {
        botResponse = `Hello ${user ? user.name.split(" ")[0] : "there"}! I am the Jageshwar Cafe AI bot. Ask me about our menu, location, opening hours, or your order status!`;
      } 
      else if (text.includes("hour") || text.includes("time") || text.includes("open") || text.includes("schedule")) {
        botResponse = "Jageshwar Cafe is open daily from 🕒 **06:00 PM to 11:00 PM** in Jawra. We look forward to serving you!";
      } 
      else if (text.includes("where") || text.includes("location") || text.includes("address") || text.includes("village") || text.includes("jawra") || text.includes("betul")) {
        botResponse = "We are located at 📍 **Post Office Road, Jawra, Betul (MP) region, Pin: 460110**. We serve Jawra, Athner, and surrounding villages.";
      } 
      else if (text.includes("menu") || text.includes("recommend") || text.includes("food") || text.includes("special") || text.includes("burger") || text.includes("pizza")) {
        botResponse = "Here are our chef's recommended specialties:\n- 🍔 **Jageshwar Spl Burger** (₹60)\n- 🍕 **Farmhouse Pizza** (₹120)\n- ☕ **Special Coffee** (₹30)\n- 🍰 **Chocolate Cream Cake** (₹350)\n- 🍬 **Kaju Katli** (₹220)\n\nYou can order these directly from our Online Menu!";
      } 
      else if (text.includes("cake") || text.includes("party") || text.includes("bulk") || text.includes("whatsapp")) {
        botResponse = "For custom bakery cakes, birthday celebrations, or bulk party catering orders, please WhatsApp our chef directly at 💬 **+91 9876543210**. We would love to make your event special!";
      } 
      else if (text.includes("cart") || text.includes("my cart") || text.includes("basket")) {
        if (cart.length === 0) {
          botResponse = "Your shopping cart is currently empty. Go ahead and add some delicious items from our menu!";
        } else {
          const itemsStr = cart.map(item => `- ${item.name} (Qty: ${item.quantity})`).join("\n");
          const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
          botResponse = `Here is what is currently in your cart:\n${itemsStr}\n\n**Subtotal: ₹${total}**.\nYou can proceed to checkout from the Cart page!`;
        }
      } 
      else if (text.includes("track") || text.includes("order") || text.includes("status")) {
        if (!user) {
          botResponse = "Please log in first to track your order status. You can login using password or instant OTP on our Login page!";
        } else {
          try {
            const res = await API.get("/orders");
            const userOrders = res.data;
            if (userOrders.length === 0) {
              botResponse = `Hello ${user.name.split(" ")[0]}, I couldn't find any orders placed under your account yet. Let me know if you need help ordering!`;
            } else {
              // Get latest order
              const latestOrder = userOrders[userOrders.length - 1];
              const dateStr = new Date(latestOrder.createdAt).toLocaleDateString();
              botResponse = `I found your latest order **#${latestOrder._id?.slice(-6)}** placed on ${dateStr}:\n\n- **Items**: ${latestOrder.items?.map(i => `${i.name} (×${i.quantity})`).join(", ")}\n- **Total Amount**: ₹${latestOrder.totalAmount}\n- **Current Status**: **${latestOrder.status}**\n\nWe are preparing it fresh for you!`;
            }
          } catch (err) {
            console.error("Chatbot orders load error:", err);
            botResponse = "Sorry, I had trouble retrieving your order details. Please try again in a moment.";
          }
        }
      } 
      else {
        botResponse = "I'm not sure I understand that query. I can help with food recommendations, checking opening hours/location, looking up your shopping cart, tracking orders, or connecting you to WhatsApp booking. Try asking: 'Recommend food' or 'Where is my order?'";
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }, 1000);
  };

  const customStyles = `
    .chat-bubble-btn {
      position: fixed;
      bottom: 25px;
      right: 25px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white;
      border: none;
      box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      z-index: 1500;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      animation: pulseBot 2s infinite;
    }
    .chat-bubble-btn:hover {
      transform: scale(1.1);
    }
    .chat-window {
      position: fixed;
      bottom: 95px;
      right: 25px;
      width: 360px;
      height: 500px;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1500;
      animation: slideUpChat 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes pulseBot {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    @keyframes slideUpChat {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .chat-body::-webkit-scrollbar {
      width: 6px;
    }
    .chat-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    .typing-indicator span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      margin: 0 2px;
      animation: bounceDots 1.4s infinite both;
    }
    .typing-indicator span:nth-child(2) { animation-delay: .2s; }
    .typing-indicator span:nth-child(3) { animation-delay: .4s; }
    @keyframes bounceDots {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>

      {/* Floating Action Button */}
      <button className="chat-bubble-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "white"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e"
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "bold" }}>Jageshwar Cafe AI</h3>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Online Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "1.1rem"
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Log */}
          <div
            className="chat-body"
            style={{
              flex: 1,
              padding: "1.25rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background: "#0f172a"
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    background: msg.sender === "user" ? "var(--primary)" : "#1e293b",
                    color: "white",
                    padding: "0.75rem 1rem",
                    borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: "0.85rem",
                    lineHeight: "1.4",
                    whiteSpace: "pre-line",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "4px" }}>{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#1e293b",
                  padding: "0.75rem 1rem",
                  borderRadius: "16px 16px 16px 4px",
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick replies suggestions */}
          <div
            style={{
              padding: "8px 12px",
              background: "#0f172a",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)"
            }}
          >
            {[
              { label: "🕒 Timings", query: "What are your opening hours?" },
              { label: "📍 Location", query: "Where is the cafe located?" },
              { label: "🍔 Specials", query: "Recommend some food specials" },
              { label: "📦 Track Orders", query: "Track my order status" }
            ].map((reply) => (
              <button
                key={reply.label}
                onClick={() => handleSendMessage(reply.query)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                  e.target.style.color = "#94a3b8";
                }}
              >
                {reply.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            style={{
              padding: "1rem",
              background: "#1e293b",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              gap: "8px"
            }}
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                background: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                padding: "8px 16px",
                color: "white",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--primary)",
                border: "none",
                color: "white",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => (e.target.style.background = "var(--primary-hover)")}
              onMouseOut={(e) => (e.target.style.background = "var(--primary)")}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
}
