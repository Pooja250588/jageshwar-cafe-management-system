import { useState, useEffect, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";

function Reviews() {
  const { user } = useContext(AuthContext);
  const [foodName, setFoodName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/reviews")
      .then((res) => {
        setReviews(res.data);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!foodName || !comment) {
      alert("Please fill in all review details.");
      return;
    }

    try {
      const response = await API.post("/reviews", {
        foodName,
        rating,
        comment,
      });

      // Update state instantly with new review at top
      setReviews([response.data.review, ...reviews]);
      
      // Reset form
      setFoodName("");
      setRating(5);
      setComment("");
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Failed to post review:", error);
      alert(error.response?.data?.message || "Could not save review.");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "800px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2.5rem" }}>Customer Reviews & Ratings ⭐</h1>

      {user ? (
        <div className="review-form-wrapper">
          <h2 style={{ fontSize: "1.4rem", marginBottom: "1.5rem" }}>Share Your Feedback</h2>
          <form onSubmit={handlePostReview}>
            <div className="form-group">
              <label htmlFor="foodName">What did you order?</label>
              <input
                type="text"
                id="foodName"
                className="form-control"
                placeholder="e.g. Cheese Pizza, Burger, Chocolate Cake"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Your Rating</label>
              <div className="star-rating-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-select ${star <= rating ? "selected" : ""}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Your Review Comments</label>
              <textarea
                id="comment"
                className="form-control form-control-textarea"
                placeholder="Tell us about the taste, quality, packaging and delivery service..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-btn">
              Publish Review
            </button>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--primary-light)", color: "var(--primary)", borderRadius: "12px", marginBottom: "2.5rem", fontWeight: 600 }}>
          🔒 Please login to write a review.
        </div>
      )}

      <h2 style={{ fontSize: "1.6rem", marginBottom: "1.5rem" }}>What People Say about Jageshwar Cafe</h2>

      {loading ? (
        <p>Loading customer reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No reviews yet. Be the first one to write!</p>
      ) : (
        <div className="reviews-grid" style={{ gridTemplateColumns: "1fr" }}>
          {reviews.map((review) => (
            <div key={review._id} className="review-card-modern">
              <div className="review-card-header">
                <h3>{review.customerName}</h3>
                <span className="stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              </div>
              <p className="food-tag">🍛 {review.foodName}</p>
              <p className="comment">{review.comment}</p>
              <span className="date">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reviews;