import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./pages/home/components/Hero";
import SignInPage from "./lib/pages/sign-in.page";
import SignUpPage from "./lib/pages/sign-up.page";
import Navigation from "./components/Navigation";
import Products from "./pages/home/components/Products";
import { SavedItemsProvider } from "./lib/features/SavedItemsContext";
import { ClerkProvider } from '@clerk/clerk-react';
import ShopPage from "./pages/shop.page";
import Heart from "./Heart";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { api } from './lib/api';


function App() {
  const name = "Dhanushka";
  const cartCount = 2;
  
  const clerkFrontendApi = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z2xhZC1qYXliaXJkLTQzLmNsZXJrLmFjY291bnRzLmRldiQ';

  return (
    <ApiProvider api={api}>
      <ClerkProvider 
        frontendApi={clerkFrontendApi}
        appearance={{
          baseTheme: undefined
        }}
        navigate={(to) => window.location.href = to}
      >
        <Router>
          <SavedItemsProvider>
            <div>
              <Navigation name={name} cartCount={cartCount} />
              <Routes>
                <Route path="/" element={
                  <>
                    <Hero />
                    <Products />
                    <Heart />
                  </>
                } />
                <Route 
                  path="/shop" 
                  element={
                    <ProtectedRoute>
                      <ShopPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
              </Routes>
              <Footer />
            </div>
          </SavedItemsProvider>
        </Router>
      </ClerkProvider>
    </ApiProvider>
  );
}

export default App;