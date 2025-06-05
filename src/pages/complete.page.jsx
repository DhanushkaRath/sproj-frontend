import { Button } from "@/components/ui/button";
import { useGetOrderQuery } from "@/lib/api";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

function CompletePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get orderId and payment details from either location state or URL params
  const orderId = location.state?.orderId || searchParams.get('orderId');
  const paymentStatus = location.state?.paymentStatus || searchParams.get('status');
  const paymentMethod = location.state?.paymentMethod || searchParams.get('paymentMethod');
  const total = location.state?.total;

  // Debug log to check orderId
  console.log('Order ID:', orderId);

  // Fetch token
  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthLoaded && isSignedIn) {
        try {
          const authToken = await getToken();
          setToken(authToken);
        } catch (error) {
          console.error('Error getting token:', error);
        }
      }
      setIsLoading(false);
    };
    fetchToken();
  }, [isAuthLoaded, isSignedIn, getToken]);

  // Query order data - Make sure orderId is a string
  const { data: orderData, error } = useGetOrderQuery(
    typeof orderId === 'string' ? orderId : null,
    {
      skip: !token || !orderId,
      pollingInterval: 0
    }
  );

  // Debug log to check orderData
  console.log('Order Data:', orderData);

  // In the complete page, add these console logs
  console.log('Location state:', location.state);
  console.log('Total from location state:', location.state?.total);
  console.log('Order data:', orderData);
  console.log('Total from order data:', orderData?.total);

  // Loading state
  if (isLoading || !isAuthLoaded) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-6">
        <h2 className="text-4xl font-bold">Loading...</h2>
        <p className="mt-4 text-gray-600">Please wait while we load your order details...</p>
      </main>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-6">
        <h2 className="text-4xl font-bold text-red-600">Authentication Required</h2>
        <p className="mt-4">Please sign in to view your order.</p>
        <Button asChild className="mt-4">
          <Link to="/sign-in">Sign In</Link>
        </Button>
      </main>
    );
  }

  // No order ID
  if (!orderId) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-6">
        <h2 className="text-4xl font-bold text-red-600">Order Not Found</h2>
        <p className="mt-4">No order information available.</p>
        <Button asChild className="mt-4">
          <Link to="/">Return to Home</Link>
        </Button>
      </main>
    );
  }

  // Error state
  if (error) {
    console.error('Order fetch error:', error);
    return (
      <main className="max-w-4xl mx-auto px-8 py-6">
        <h2 className="text-4xl font-bold text-red-600">Error Loading Order</h2>
        <p className="mt-4">Failed to load order details. Please try again later.</p>
        <Button asChild className="mt-4">
          <Link to="/">Return to Home</Link>
        </Button>
      </main>
    );
  }

  // Success state
  return (
    <main className="max-w-4xl mx-auto px-8 py-6">
      <h2 className="text-4xl font-bold text-green-600">
        {paymentStatus === "PENDING" ? "Order Placed!" : "Order Successful!"}
      </h2>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4">Order Details</h3>
        <div className="space-y-4">
          {orderData?.items?.map((item, index) => (
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
              {total ? `$${Number(total).toFixed(2)}` : 
               orderData?.total ? `$${Number(orderData.total).toFixed(2)}` : 
               "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600">Order ID: {orderData?._id}</p>
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
          
          {orderData?.shippingAddress && (
            <div className="mt-4">
              <h4 className="font-medium">Shipping Address</h4>
              <div className="mt-2 text-sm text-gray-600">
                <p>{orderData.shippingAddress.line_1}</p>
                {orderData.shippingAddress.line_2 && (
                  <p>{orderData.shippingAddress.line_2}</p>
                )}
                <p>
                  {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{" "}
                  {orderData.shippingAddress.zip_code}
                </p>
                <p>Phone: {orderData.shippingAddress.phone}</p>
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