// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const isDev = process.env.NODE_ENV === "development";
const baseUrl = isDev
  ? "http://localhost:8000/api/"
  : "https://fed-storefront-backend-dhanushka.onrender.com/api/";

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: async (headers) => {
      // Set default headers
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      
      try {
        if (window.Clerk?.session) {
          const token = await window.Clerk.session.getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        }
      } catch (error) {
        console.error('Error fetching Clerk token:', error);
      }
      return headers;
    },
    mode: 'cors', // Explicitly set CORS mode
  }),

  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({
        url: "products",
        method: 'GET',
        mode: 'cors',
      }),
    }),
    getProduct: builder.query({
      query: (id) => ({
        url: `products/${id}`,
        method: 'GET',
        mode: 'cors',
      }),
    }),
    getCategories: builder.query({
      query: () => ({
        url: "categories",
        method: 'GET',
        mode: 'cors',
      }),
    }),
    createProduct: builder.mutation({
      query: ({ data }) => ({
        url: "products",
        method: "POST",
        body: data,
        mode: 'cors',
      }),
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "orders",
        method: "POST",
        body: orderData,
        mode: 'cors',
      }),
    }),
    getOrder: builder.query({
      query: ({ orderId }) => ({
        url: `orders/${orderId}`,
        method: 'GET',
        mode: 'cors',
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
} = api;