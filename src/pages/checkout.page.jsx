import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import ShippingAddressForm from "@/components/ShippingAddressForm";
import { useState } from "react";
import { CreditCard, Banknote, Wallet } from "lucide-react";

function CheckoutPage() {
  const cart = useSelector((state) => state.cart.value);
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToPayment = (shippingData) => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }
    // Navigate to payment page with shipping address data and payment method
    navigate("/shop/payment", {
      state: { 
        shippingAddress: shippingData,
        paymentMethod: selectedPaymentMethod
      }
    });
  };
  
  const paymentOptions = [
    {
      value: "cash_on_delivery",
      label: "Cash on Delivery",
      description: "Pay when you receive your order",
      icon: <Wallet className="h-5 w-5 text-gray-600" />,
    },
    {
      value: "bank_payment",
      label: "Bank Payment",
      description: "Pay via bank transfer",
      icon: <Banknote className="h-5 w-5 text-gray-600" />,
    },
    {
      value: "card_payment",
      label: "Card Payment",
      description: "Pay with credit/debit card",
      icon: <CreditCard className="h-5 w-5 text-gray-600" />,
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Checkout</h2>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
        <div className="divide-y">
          {cart.map((item) => (
            <div key={item._id} className="py-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-gray-600">${item.price} each</p>
              </div>
            </div>
          ))}
          
          <div className="py-4">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash on Delivery */}
          <div
            className={`border rounded-lg p-4 w-full text-left cursor-pointer transition-all ${
              selectedPaymentMethod === "cash_on_delivery"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            }`}
            onClick={() => setSelectedPaymentMethod("cash_on_delivery")}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="cod"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={selectedPaymentMethod === "cash_on_delivery"}
                onChange={() => setSelectedPaymentMethod("cash_on_delivery")}
                className="h-4 w-4 text-green-600"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-gray-600" />
                  <label htmlFor="cod" className="font-medium">
                    Cash on Delivery
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pay when you receive your order
                </p>
              </div>
            </div>
          </div>

          {/* Bank Payment */}
          <div
            className={`border rounded-lg p-4 w-full text-left cursor-pointer transition-all ${
              selectedPaymentMethod === "bank_payment"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            }`}
            onClick={() => setSelectedPaymentMethod("bank_payment")}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="bank"
                name="paymentMethod"
                value="bank_payment"
                checked={selectedPaymentMethod === "bank_payment"}
                onChange={() => setSelectedPaymentMethod("bank_payment")}
                className="h-4 w-4 text-green-600"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-gray-600" />
                  <label htmlFor="bank" className="font-medium">
                    Bank Payment
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pay via bank transfer
                </p>
              </div>
            </div>
          </div>

          {/* Card Payment */}
          <div
            className={`border rounded-lg p-4 w-full text-left cursor-pointer transition-all ${
              selectedPaymentMethod === "card_payment"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            }`}
            onClick={() => setSelectedPaymentMethod("card_payment")}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="card"
                name="paymentMethod"
                value="card_payment"
                checked={selectedPaymentMethod === "card_payment"}
                onChange={() => setSelectedPaymentMethod("card_payment")}
                className="h-4 w-4 text-green-600"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <label htmlFor="card" className="font-medium">
                    Card Payment
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pay with credit/debit card
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
        <div className="mt-2">
          <ShippingAddressForm onSubmit={handleProceedToPayment} cart={cart} />
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;