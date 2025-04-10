import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthCheck from "../components/AuthCheck";

const API_BASE_URL = 'https://sproj-backend-dhanushka.onrender.com/api';

function OrdersPage() {
  const { getToken, userId, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        if (!userId) {
          toast.error("Please log in to view your orders.");
          return;
        }

        setIsLoading(true);
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            setOrders([]);
            return;
          }
          throw new Error(`Failed to fetch orders. Status: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoaded, isSignedIn, userId, getToken]);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusBadgeVariant = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePayClick = async (order) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      const result = await response.json();
      console.log('Order submitted successfully:', result);
      toast.success('Payment initiated successfully');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to initiate payment');
    }
  };

  if (!isAuthLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">Please log in to view your orders</h2>
          <p className="text-gray-600 mb-6">Sign in to see your order history</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link to="/shop">
            <Button>
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AuthCheck />
      <h1 className="text-4xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order._id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold">Order #{order._id.slice(-8)}</h3>
                  <Badge variant={getStatusBadgeVariant(order.orderStatus)}>
                    {order.orderStatus || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-lg">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleOrderExpansion(order._id)}
                  aria-label={expandedOrders[order._id] ? "Collapse order details" : "Expand order details"}
                >
                  {expandedOrders[order._id] ? (
                    <ChevronUp className="h-6 w-6" />
                  ) : (
                    <ChevronDown className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>

            {expandedOrders[order._id] && (
              <div className="mt-6 border-t pt-6">
                <div className="space-y-4">
                  {order.items?.map((item) => (
                    <div key={item._id} className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg p-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <Link 
                          to={`/shop/${item.productId}`}
                          className="font-semibold hover:text-primary transition-colors flex items-center gap-2"
                          aria-label={`View ${item.name} details`}
                        >
                          {item.name}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-gray-600">Price: ${item.price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold mb-4">Shipping Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Address:</p>
                      <p>{order.shippingAddress?.street}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                      <p>{order.shippingAddress?.country}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contact:</p>
                      <p>{order.shippingAddress?.name}</p>
                      <p>{order.shippingAddress?.email}</p>
                      <p>{order.shippingAddress?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.orderStatus === 'pending' && (
              <div className="mt-6 border-t pt-6">
                <Button
                  variant="default"
                  onClick={() => handlePayClick(order)}
                >
                  Pay Now
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;