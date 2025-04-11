import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string>;
      };
    };
  }
}

const isDev = process.env.NODE_ENV === "development";
const baseUrl = isDev
  ? "http://localhost:8000/api/"
  : "https://fed-storefront-backend-dhanushka.onrender.com/api/";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: async (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      
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
  }),
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({
        url: "products",
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }),
    }),
    getProduct: builder.query({
      query: (id) => `products/${id}`,
    }),
    getCategories: builder.query({
      query: () => ({
        url: "categories",
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }),
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

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
} = api;