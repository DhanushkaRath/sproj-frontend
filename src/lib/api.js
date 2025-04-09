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
      try {
        // Access Clerk from window
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
  }),

  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => "products",
      // Add error handling and transformResponse if needed
      transformResponse: (response) => {
        console.log('Products response:', response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error('Products error:', error);
        return error;
      }
    }),
    getProduct: builder.query({
      query: (id) => `products/${id}`,
    }),
    getCategories: builder.query({
      query: () => "categories",
      // Add error handling and transformResponse if needed
      transformResponse: (response) => {
        console.log('Categories response:', response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error('Categories error:', error);
        return error;
      }
    }),
    createProduct: builder.mutation({
      query: ({ data }) => ({
        url: "products",
        method: "POST",
        body: data,
      }),
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "orders",
        method: "POST",
        body: orderData,
      }),
    }),
    getOrder: builder.query({
      query: ({ orderId }) => `orders/${orderId}`,
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
} = api;