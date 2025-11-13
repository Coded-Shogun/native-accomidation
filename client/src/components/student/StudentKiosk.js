import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './StudentKiosk.css';

/**
 * StudentKiosk - Kiosk/shop system for students
 * Features:
 * - Browse available items by category
 * - View item details and stock levels
 * - Create orders with multiple items
 * - Track order history and status
 * - Cancel pending orders
 */
function StudentKiosk() {
  return (
    <div className="student-kiosk">
      <Routes>
        <Route path="/" element={<KioskShop />} />
        <Route path="/orders" element={<KioskOrders />} />
      </Routes>
    </div>
  );
}

/**
 * KioskShop - Main shop interface
 */
function KioskShop() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/kiosk/items', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, item.stock_quantity) } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderItems = cart.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/kiosk/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          payment_method: 'account',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Order placed successfully! Order ID: ${data.order_id}`);
        setCart([]);
        navigate('/student/kiosk/orders');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to place order');
      }
    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  };

  const filteredItems =
    filterCategory === 'all' ? items : items.filter((item) => item.category === filterCategory);

  const categories = [...new Set(items.map((item) => item.category))];

  if (loading) {
    return <div className="loading">Loading shop...</div>;
  }

  return (
    <>
      <div className="kiosk-header">
        <h2>Kiosk Shop</h2>
        <button onClick={() => navigate('/student/kiosk/orders')} className="btn btn-outline">
          View Orders
        </button>
      </div>

      <div className="kiosk-filters">
        <button
          className={filterCategory === 'all' ? 'active' : ''}
          onClick={() => setFilterCategory('all')}
        >
          All Items
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={filterCategory === category ? 'active' : ''}
            onClick={() => setFilterCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="kiosk-main">
        <div className="items-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className={`item-card ${item.is_out_of_stock ? 'out-of-stock' : ''}`}>
              <div className="item-image">
                <div className="item-placeholder">🛍️</div>
              </div>
              <div className="item-info">
                <h4>{item.name}</h4>
                {item.description && <p className="item-description">{item.description}</p>}
                <div className="item-price">R {item.price.toFixed(2)}</div>
                <div className="item-stock">
                  {item.is_out_of_stock ? (
                    <span className="badge badge-danger">Out of Stock</span>
                  ) : item.is_low_stock ? (
                    <span className="badge badge-warning">
                      Low Stock ({item.stock_quantity} left)
                    </span>
                  ) : (
                    <span className="stock-available">In Stock ({item.stock_quantity})</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="btn btn-primary btn-block"
                disabled={item.is_out_of_stock}
              >
                {item.is_out_of_stock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-sidebar">
            <h3>Shopping Cart</h3>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">R {item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                      disabled={item.quantity >= item.stock_quantity}
                    >
                      +
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                      🗑️
                    </button>
                  </div>
                  <div className="cart-item-subtotal">R {(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">R {getTotalAmount()}</span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary btn-block">
              Checkout
            </button>
            <button onClick={() => setCart([])} className="btn btn-outline btn-block">
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * KioskOrders - Order history and tracking
 */
function KioskOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/kiosk/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/kiosk/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/kiosk/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Order cancelled successfully');
        setSelectedOrder(null);
        await fetchOrders();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Error cancelling order: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      preparing: 'badge-primary',
      ready: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <>
      <div className="orders-header">
        <h2>My Orders</h2>
        <button onClick={() => navigate('/student/kiosk')} className="btn btn-outline">
          Back to Shop
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders yet</p>
          <button onClick={() => navigate('/student/kiosk')} className="btn btn-primary">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              key={order.id}
              className="order-card"
              onClick={() => fetchOrderDetails(order.id)}
            >
              <div className="order-header">
                <div className="order-id">Order #{order.id}</div>
                <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
              </div>
              <div className="order-info">
                <div className="order-date">{new Date(order.created_at).toLocaleString()}</div>
                <div className="order-amount">R {order.total_amount.toFixed(2)}</div>
              </div>
              <div className="order-payment">
                Payment: {order.payment_method} | Status: {order.payment_status}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="order-modal" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedOrder(null)}>
              ×
            </button>
            <div className="order-detail">
              <h2>Order #{selectedOrder.id}</h2>
              <div className="order-detail-status">
                <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="order-items">
                <h3>Items</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="order-item-name">{item.item_name}</div>
                    <div className="order-item-quantity">x{item.quantity}</div>
                    <div className="order-item-price">R {item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Total:</span>
                  <span className="total-amount">R {selectedOrder.total_amount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Payment Method:</span>
                  <span>{selectedOrder.payment_method}</span>
                </div>
                <div className="summary-row">
                  <span>Payment Status:</span>
                  <span>{selectedOrder.payment_status}</span>
                </div>
              </div>

              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="btn btn-danger btn-block"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentKiosk;
