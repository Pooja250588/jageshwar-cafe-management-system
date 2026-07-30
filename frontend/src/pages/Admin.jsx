import { useState, useEffect, useRef } from "react";
import API from "../utils/api";

function Admin() {
  const [food, setFood] = useState({
    name: "",
    price: "",
    image: "",
    category: "Cold Coffee",
  });
  const [editingId, setEditingId] = useState(null);
  const [foodsList, setFoodsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSizes, setHasSizes] = useState(false);
  const [singlePrice, setSinglePrice] = useState("");
  const [halfPrice, setHalfPrice] = useState("");
  const [fullPrice, setFullPrice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFood((prev) => ({ ...prev, image: reader.result }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const fetchFoods = () => {
    API.get("/foods")
      .then((res) => setFoodsList(res.data))
      .catch((err) => console.error("Failed to fetch foods:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let updatedFood = { ...food };
    
    if (hasSizes) {
      const sizesArray = [];
      if (singlePrice) sizesArray.push({ size: "Single", price: Number(singlePrice) });
      if (halfPrice) sizesArray.push({ size: "Half", price: Number(halfPrice) });
      if (fullPrice) sizesArray.push({ size: "Full", price: Number(fullPrice) });

      if (sizesArray.length === 0) {
        alert("Please specify a price for at least one portion size (Single, Half, or Full).");
        return;
      }

      updatedFood.sizes = sizesArray;
      // Set the base price to the first size price as fallback
      updatedFood.price = sizesArray[0].price;
    } else {
      updatedFood.sizes = [];
      if (!updatedFood.price) {
        alert("Please specify a price.");
        return;
      }
      updatedFood.price = Number(updatedFood.price);
    }

    if (!updatedFood.name || !updatedFood.image) {
      alert("Please fill in all food details including an image.");
      return;
    }

    try {
      if (editingId) {
        await API.put(`/foods/${editingId}`, updatedFood);
        alert("Food Updated Successfully!");
        setEditingId(null);
      } else {
        await API.post("/foods", updatedFood);
        alert("Food Added Successfully!");
      }
      setFood({ name: "", price: "", image: "", category: "Cold Coffee" });
      setHasSizes(false);
      setSinglePrice("");
      setHalfPrice("");
      setFullPrice("");
      fetchFoods();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save food.");
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFood({
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category || "Cold Coffee",
    });
    
    if (item.sizes && item.sizes.length > 0) {
      setHasSizes(true);
      const sVal = item.sizes.find((s) => s.size === "Single")?.price || "";
      const hVal = item.sizes.find((s) => s.size === "Half")?.price || "";
      const fVal = item.sizes.find((s) => s.size === "Full")?.price || "";
      setSinglePrice(sVal);
      setHalfPrice(hVal);
      setFullPrice(fVal);
    } else {
      setHasSizes(false);
      setSinglePrice("");
      setHalfPrice("");
      setFullPrice("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFood({ name: "", price: "", image: "", category: "Cold Coffee" });
    setHasSizes(false);
    setSinglePrice("");
    setHalfPrice("");
    setFullPrice("");
  };

  const deleteFoodItem = async (id) => {
    if (!window.confirm("Delete this food item permanently?")) return;
    try {
      await API.delete(`/foods/${id}`);
      fetchFoods();
    } catch {
      alert("Failed to delete food.");
    }
  };
  const toggleAvailability = async (id) => {
  try {
    await API.put(`/foods/${id}/availability`);
    fetchFoods();
  } catch {
    alert("Failed to update availability");
  }
};

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <div className="dash-page-header">
        <h2>Manage Restaurant Menu</h2>
        <p>{foodsList.length} item{foodsList.length !== 1 ? "s" : ""} on the live menu</p>
      </div>

      <div className="admin-menu-manager-grid">
        {/* Add / Edit Form */}
        <div className="admin-foods-list-card">
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.2rem" }}>
            {editingId ? "✏️ Edit Food Item" : "➕ Add New Item"}
          </h3>
          <form onSubmit={handleSubmit}>

            {/* Food Name */}
            <div className="form-group">
              <label htmlFor="foodName">Food Name</label>
              <input
                type="text"
                id="foodName"
                className="form-control"
                placeholder="e.g. Special Paneer Pizza"
                value={food.name}
                onChange={(e) => setFood({ ...food, name: e.target.value })}
                required
              />
            </div>

            {/* Has Sizes Checkbox */}
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "1rem 0" }}>
              <input
                type="checkbox"
                id="hasSizes"
                checked={hasSizes}
                onChange={(e) => setHasSizes(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="hasSizes" style={{ margin: 0, fontWeight: "bold", cursor: "pointer" }}>
                This item has multiple portion sizes (Single/Half/Full)
              </label>
            </div>

            {hasSizes ? (
              /* Multiple Sizes Pricing Inputs */
              <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label htmlFor="singlePrice">Single Price (₹)</label>
                  <input
                    type="number"
                    id="singlePrice"
                    className="form-control"
                    placeholder="e.g. 40"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label htmlFor="halfPrice">Half Price (₹)</label>
                  <input
                    type="number"
                    id="halfPrice"
                    className="form-control"
                    placeholder="e.g. 70"
                    value={halfPrice}
                    onChange={(e) => setHalfPrice(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label htmlFor="fullPrice">Full Price (₹)</label>
                  <input
                    type="number"
                    id="fullPrice"
                    className="form-control"
                    placeholder="e.g. 120"
                    value={fullPrice}
                    onChange={(e) => setFullPrice(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* Normal Price */
              <div className="form-group">
                <label htmlFor="foodPrice">Price (₹)</label>
                <input
                  type="number"
                  id="foodPrice"
                  className="form-control"
                  placeholder="e.g. 120"
                  value={food.price}
                  onChange={(e) => setFood({ ...food, price: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Image Upload — Drag & Drop */}
            <div className="form-group">
              <label>Food Photo</label>

              {food.image ? (
                /* Image Preview with change/remove buttons */
                <div className="img-upload-preview">
                  <img src={food.image} alt="Food preview" className="img-upload-thumb" />
                  <div className="img-upload-preview-actions">
                    <button
                      type="button"
                      className="img-upload-change-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      🔄 Change Photo
                    </button>
                    <button
                      type="button"
                      className="img-upload-remove-btn"
                      onClick={() => setFood({ ...food, image: "" })}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop Zone */
                <div
                  className={`img-drop-zone ${isDragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {uploading ? (
                    <div className="img-drop-spinner" />
                  ) : (
                    <>
                      <div className="img-drop-icon">📷</div>
                      <p className="img-drop-title">
                        {isDragging ? "Drop it here!" : "Click or drag & drop a photo"}
                      </p>
                      <p className="img-drop-hint">JPG, PNG, WEBP · Max 2MB</p>
                    </>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files[0])}
                key={editingId || "new-item"}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="foodCategory">Category</label>
              <select
                id="foodCategory"
                className="form-control"
                value={food.category}
                onChange={(e) => setFood({ ...food, category: e.target.value })}
              >
                <option value="Cold Coffee">Cold Coffee</option>
                <option value="Snacks & Chaat">Snacks & Chaat</option>
                <option value="Indo-Chinese">Indo-Chinese</option>
                <option value="Cheesy Pizza">Cheesy Pizza</option>
                <option value="Special Combo">Special Combo</option>
                <option value="Tea & Coffee">Tea & Coffee</option>
                <option value="Dessert">Dessert</option>
                <option value="Beverage">Beverage</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                className="primary-btn"
                style={{ flex: 1, justifyContent: "center" }}
              >
                {editingId ? "Update Item" : "Add to Menu"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Food List Table */}
        <div className="admin-foods-list-card">
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.2rem" }}>
            Live Menu Items
          </h3>

          {foodsList.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>
              No items yet. Add some using the form!
            </p>
            
          ) : (
            <div className="admin-foods-table-container">
              <table className="admin-foods-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
  {foodsList.map((item) => (
    <tr key={item._id}>
      <td>
        <div className="admin-table-food-info">
          <img
            src={item.image}
            alt={item.name}
            onError={(e) =>
              (e.target.src =
                "https://via.placeholder.com/44x44?text=?")
            }
          />
          <h5>{item.name}</h5>
        </div>
      </td>

      <td>{item.category}</td>

      <td>
        {item.sizes && item.sizes.length > 0 ? (
          <div style={{ fontSize: "0.85rem", lineHeight: "1.2" }}>
            {item.sizes.map((s) => (
              <div key={s.size}>
                <strong>{s.size}:</strong> ₹{s.price}
              </div>
            ))}
          </div>
        ) : (
          `₹${item.price}`
        )}
      </td>

      <td>
        <span 
          style={{ 
            padding: "5px 10px", 
            borderRadius: "6px", 
            fontSize: "0.85rem", 
            fontWeight: "bold",
            display: "inline-block",
            background: item.available ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)",
            color: item.available ? "#2ecc71" : "#e74c3c",
            border: item.available ? "1px solid #2ecc71" : "1px solid #e74c3c"
          }}
        >
          {item.available ? "🟢 Active" : "🔴 Unavailable"}
        </span>
      </td>

      <td>
        <div className="admin-table-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} title="Toggle Availability">
            <input 
              type="checkbox" 
              checked={!!item.available}
              onChange={() => toggleAvailability(item._id)}
              style={{ display: "none" }}
            />
            <span style={{ 
              display: "block", 
              width: "44px", 
              height: "22px", 
              borderRadius: "11px", 
              background: item.available ? "#2ecc71" : "#cbd5e1",
              position: "relative",
              transition: "background 0.2s"
            }}>
              <span style={{
                display: "block",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "2px",
                left: item.available ? "24px" : "2px",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }} />
            </span>
          </label>

          <button
            className="btn-edit"
            onClick={() => startEdit(item)}
          >
            ✏️ Edit
          </button>

          <button
            className="btn-delete"
            onClick={() => deleteFoodItem(item._id)}
          >
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;