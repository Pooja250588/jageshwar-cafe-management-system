import { useState, useEffect, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import { joinRoom, useSocketEvent } from "../hooks/useSocket";
import { playNotificationSound } from "../utils/notificationSound";
import API from "../utils/api";

const FAQs = [
  {
    question: "How do I track my order status?",
    answer: "You can track your active orders under the 'My Orders' tab on the navigation bar. Our staff updates the tracking status in real time (Pending -> Accepted -> Preparing -> Ready -> Out for Delivery -> Delivered).",
    category: "order"
  },
  {
    question: "What are the cafe operational hours?",
    answer: "Jageshwar Cafe is open daily from 04:00 PM to 11:00 PM. Holiday hours may vary on local festivals. You can also WhatsApp our chef directly for bulk orders or custom celebrations outside standard hours.",
    category: "general"
  },
  {
    question: "Do you deliver to Athner and other surrounding villages?",
    answer: "Yes! We deliver to Jawra, Athner, and nearby villages in the Betul region. Delivery times range between 20-45 minutes depending on distance, road conditions, and order volume.",
    category: "delivery"
  },
  {
    question: "What payment methods are supported?",
    answer: "We support Cash on Delivery (COD) as well as secure online payments including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Netbanking via Razorpay.",
    category: "payment"
  },
  {
    question: "How do I cancel my order?",
    answer: "You can cancel your order free of charge as long as the status is 'Pending' and the cafe has not 'Accepted' it yet. Once preparation begins, cancellation is no longer possible.",
    category: "order"
  },
  {
    question: "How do I request a refund for a payment or missing items?",
    answer: "For payment errors, double charges, or missing items in your order, please submit a Support Ticket below under the 'Payment/Refund Issue' or 'Missing Items' category. Our support team will review it and process your refund within 24-48 hours.",
    category: "payment"
  }
];

export default function Support() {
  const { user, isLoggedIn } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Accordion State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  // Tickets & User Orders State
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [category, setCategory] = useState("General Inquiry");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // Chat message state
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const chatEndRef = useRef(null);

  // Pre-fill order selection if URL query contains orderId
  useEffect(() => {
    const queryOrderId = searchParams.get("orderId");
    if (queryOrderId) {
      setOrderId(queryOrderId);
      setCategory("Wrong Order"); // sensible default when coming from an order
      setSubject(`Issue with Order #${queryOrderId.slice(-6)}`);
      // Scroll to ticket form
      const element = document.getElementById("ticket-form-section");
      element?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchParams]);

  // Join user socket room for real-time ticket replies
  useEffect(() => {
    if (user?._id) {
      joinRoom("user", user._id);
    }
  }, [user]);

  // Fetch Tickets and Orders on Mount (if logged in)
  useEffect(() => {
    if (isLoggedIn) {
      fetchTickets();
      fetchOrders();
    }
  }, [isLoggedIn]);

  // Scroll to bottom of message logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  // Socket: Listen for ticket status changes or replies
  useSocketEvent("ticket-update", ({ ticketId, ticket, latestMessage, sender }) => {
    // Only process if it's the customer's ticket
    if (ticket.userId.toString() !== user?._id) return;

    // Update tickets list
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? ticket : t))
    );

    // If currently viewing this ticket and reply is from admin, play sound & update active ticket
    if (selectedTicket?._id === ticketId) {
      setSelectedTicket(ticket);
      if (sender === "admin") {
        playNotificationSound("success");
        addNotification("New Support Message 💬", `Agent replied to ticket: "${latestMessage.slice(0, 40)}..."`);
      }
    }
  });

  useSocketEvent("ticket-status-change", ({ ticketId, status, subject }) => {
    // Update local ticket list
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status } : t))
    );

    if (selectedTicket?._id === ticketId) {
      setSelectedTicket((prev) => ({ ...prev, status }));
      playNotificationSound("bell");
      addNotification("Ticket Status Updated ⚙️", `Your ticket "${subject}" is now: ${status}`);
    }
  });

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await API.get("/support");
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      // Only keep orders within the last 14 days for issue filing
      const fortnightAgo = new Date();
      fortnightAgo.setDate(fortnightAgo.getDate() - 14);
      const recentOrders = res.data.filter(
        (o) => new Date(o.createdAt) >= fortnightAgo
      );
      setOrders(recentOrders);
    } catch (err) {
      console.error("Error fetching user orders:", err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await API.post("/support", {
        category,
        orderId: orderId || undefined,
        subject,
        description
      });
      setFormSuccess("Support ticket created successfully! We will get back to you shortly.");
      setSubject("");
      setDescription("");
      setOrderId("");
      // Add to ticket list
      setTickets((prev) => [res.data.ticket, ...prev]);
      // Open the ticket immediately in detail view
      setSelectedTicket(res.data.ticket);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create support ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await API.post(`/support/${selectedTicket._id}/message`, {
        message: replyMessage
      });
      // Update active ticket
      setSelectedTicket(res.data.ticket);
      // Update ticket in main list
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? res.data.ticket : t))
      );
      setReplyMessage("");
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  // Filter FAQs based on search
  const filteredFAQs = FAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container support-page">
      {/* Hero Search Area */}
      <div className="support-hero">
        <h1>Customer Support Center 🛠️</h1>
        <p>Namaste! How can we assist you with your Jageshwar Cafe experience today?</p>
        <div className="support-search-wrapper">
          <input
            type="text"
            placeholder="Search FAQs (e.g. refund, delivery, timings...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="support-content-grid">
        {/* Left Side: FAQs & Contacts */}
        <div className="support-left-col">
          {/* FAQ Accordion */}
          <section className="support-panel">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {filteredFAQs.length === 0 ? (
                <p style={{ color: "var(--text-muted)", padding: "1rem" }}>No matching FAQs found. Try a different keyword!</p>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className={`faq-item ${activeFaq === index ? "active" : ""}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-toggle">{activeFaq === index ? "▲" : "▼"}</span>
                    </button>
                    {activeFaq === index && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Contacts */}
          <section className="support-panel">
            <h2>Direct Communication Channels</h2>
            <div className="support-contacts-grid">
              <a href="https://wa.me/919009193842" target="_blank" rel="noreferrer" className="contact-card whatsapp">
                <span className="contact-icon">💬</span>
                <h3>WhatsApp Direct</h3>
                <p>Chat directly with our Chef for bulk & custom bakery orders.</p>
                <span className="contact-action">Message Chef →</span>
              </a>
              <a href="tel:+919009193842" className="contact-card phone">
                <span className="contact-icon">📞</span>
                <h3>Hotline Support</h3>
                <p>Call us directly for urgent order delivery delays.</p>
                <span className="contact-action">Call +91 90091 93842</span>
              </a>
              <a href="mailto:support@jageshwarcafe.com" className="contact-card email">
                <span className="contact-icon">✉️</span>
                <h3>Email Us</h3>
                <p>For feedback, receipts, corporate booking, or inquiries.</p>
                <span className="contact-action">support@jageshwarcafe.com</span>
              </a>
              <div className="contact-card location">
                <span className="contact-icon">📍</span>
                <h3>Cafe Kitchen</h3>
                <p>Post Office Road, Jawra, Betul, Madhya Pradesh 460110.</p>
                <a
                  href="https://maps.google.com/?q=Jawra,Betul"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-action"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Open Maps →
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Ticket History & Submission */}
        <div className="support-right-col">
          {isLoggedIn ? (
            <>
              {/* Ticket Details / Chat View */}
              {selectedTicket ? (
                <section className="support-panel chat-panel">
                  <div className="chat-header">
                    <button className="back-to-tickets" onClick={() => setSelectedTicket(null)}>
                      ← Back
                    </button>
                    <div>
                      <h3>{selectedTicket.subject}</h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        ID: #{selectedTicket._id.slice(-6)} • Category: {selectedTicket.category}
                      </span>
                    </div>
                    <span className={`status-badge ticket-status-${selectedTicket.status.toLowerCase().replace(/\s/g, "")}`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* Messages list */}
                  <div className="chat-messages">
                    <div className="ticket-starter-msg">
                      <p><strong>System Note:</strong> Ticket created on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      {selectedTicket.orderId && (
                        <p style={{ marginTop: "4px" }}>
                          🔗 <strong>Referenced Order ID:</strong> #{selectedTicket.orderId.slice(-6)}
                        </p>
                      )}
                    </div>

                    {selectedTicket.messages.map((msg, i) => {
                      const isMe = msg.sender === "user";
                      return (
                        <div key={i} className={`message-bubble ${isMe ? "me" : "agent"}`}>
                          <div className="bubble-content">{msg.message}</div>
                          <span className="bubble-time">
                            {isMe ? "You" : "Cafe Staff"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendReply} className="chat-input-form">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      disabled={sendingReply}
                    />
                    <button type="submit" disabled={sendingReply || !replyMessage.trim()} className="primary-btn">
                      {sendingReply ? "Sending..." : "Send"}
                    </button>
                  </form>
                </section>
              ) : (
                <>
                  {/* Tickets List */}
                  <section className="support-panel">
                    <h2>My Support Tickets</h2>
                    {loadingTickets ? (
                      <p>Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
                        You haven't filed any support tickets yet. Fill the form below if you need assistance!
                      </p>
                    ) : (
                      <div className="ticket-list">
                        {tickets.map((t) => (
                          <div
                            key={t._id}
                            className="ticket-list-item"
                            onClick={() => setSelectedTicket(t)}
                          >
                            <div className="ticket-item-header">
                              <h4>{t.subject}</h4>
                              <span className={`status-badge ticket-status-${t.status.toLowerCase().replace(/\s/g, "")}`}>
                                {t.status}
                              </span>
                            </div>
                            <div className="ticket-item-footer">
                              <span>Category: {t.category}</span>
                              <span>Updated: {new Date(t.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Submit Ticket Form */}
                  <section className="support-panel" id="ticket-form-section">
                    <h2>Submit a Support Ticket</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                      Our average response time is under 15 minutes during operating hours.
                    </p>

                    <form onSubmit={handleCreateTicket} className="support-ticket-form">
                      {formSuccess && <div className="alert-box success-alert">{formSuccess}</div>}
                      {formError && <div className="alert-box error-alert">{formError}</div>}

                      <div className="form-group">
                        <label>Select Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="Late Delivery">🛵 Late Delivery</option>
                          <option value="Missing Items">📦 Missing Items</option>
                          <option value="Wrong Order">🍔 Wrong Order</option>
                          <option value="Payment/Refund Issue">💳 Payment/Refund Issue</option>
                          <option value="Food Quality Issue">🔥 Food Quality Issue</option>
                          <option value="General Inquiry">❓ General Inquiry</option>
                          <option value="Other">⚙️ Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Link to Recent Order (Optional)</label>
                        <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                          <option value="">-- No Related Order --</option>
                          {orders.map((o) => (
                            <option key={o._id} value={o._id}>
                              Order #{o._id.slice(-6)} (₹{o.totalAmount}) - {new Date(o.createdAt).toLocaleDateString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Subject / Summary</label>
                        <input
                          type="text"
                          placeholder="e.g. Spill issues, Payment debited twice"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Describe the Issue</label>
                        <textarea
                          placeholder="Please provide details so we can help resolve this fast..."
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? "Submitting..." : "🚀 Submit Support Ticket"}
                      </button>
                    </form>
                  </section>
                </>
              )}
            </>
          ) : (
            <section className="support-panel login-prompt-panel">
              <h2>My Support Dashboard</h2>
              <p>Please log in to submit support tickets, trace your active refund requests, or live chat with our customer care staff.</p>
              <button className="primary-btn" onClick={() => navigate("/login")}>
                🔐 Log In / Register Now
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
