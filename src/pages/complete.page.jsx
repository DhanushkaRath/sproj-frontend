import { Button } from "@/components/ui/button";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function CompletePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get orderId and payment details from either location state or URL params
  const orderId = location.state?.orderId || searchParams.get('orderId');
  const paymentStatus = location.state?.paymentStatus || searchParams.get('status');
  const paymentMethod = location.state?.paymentMethod || searchParams.get('paymentMethod');
  const total = location.state?.total;

  // Add this to ensure orderId is a string
  useEffect(() => {
    if (orderId && typeof orderId === 'object') {
      console.error('Invalid orderId format:', orderId);
      setError('Invalid order ID format');
    }
  }, [orderId]);

  // Remove the useGetOrderQuery hook since it's causing issues
  // Instead, we'll use the data from location state

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authToken = await getToken();
        setToken(authToken);
      } catch (error) {
        console.error("Error getting token:", error);
        setError("Failed to authenticate");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthLoaded) {
      initializeAuth();
    }
  }, [isAuthLoaded, getToken]);

  if (!isAuthLoaded || isLoading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  if (!orderId) {
    return <Navigate to="/shop" />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Get items from location state
  const items = location.state?.items || [];

  return (
    <main className="max-w-4xl mx-auto px-8 py-6">
      <h2 className="text-4xl font-bold text-green-600">
        {paymentStatus === "PENDING" ? "Order Placed!" : "Order Successful!"}
      </h2>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4">Order Details</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between border-b py-2">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between">
            <p className="font-medium">Total Price:</p>
            <p className="font-bold">
              {total ? `$${Number(total).toFixed(2)}` : "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600">Order ID: {orderId}</p>
          <p className="text-sm text-gray-600">
            Payment Status: {paymentStatus === "PENDING" ? "Pending (Cash on Delivery)" : "Paid"}
          </p>
          <p className="text-sm text-gray-600">
            Payment Method: {
              paymentMethod === "cash_on_delivery" ? "Cash on Delivery" :
              paymentMethod === "bank_payment" ? "Bank Payment" :
              paymentMethod === "card_payment" ? "Card Payment" : "Not specified"
            }
          </p>
          
          {location.state?.shippingAddress && (
            <div className="mt-4">
              <h4 className="font-medium">Shipping Address</h4>
              <div className="mt-2 text-sm text-gray-600">
                <p>{location.state.shippingAddress.line_1}</p>
                {location.state.shippingAddress.line_2 && (
                  <p>{location.state.shippingAddress.line_2}</p>
                )}
                <p>
                  {location.state.shippingAddress.city}, {location.state.shippingAddress.state}{" "}
                  {location.state.shippingAddress.zip_code}
                </p>
                <p>Phone: {location.state.shippingAddress.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button asChild>
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </main>
  );
}

export default CompletePage;