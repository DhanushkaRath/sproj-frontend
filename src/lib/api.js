import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const isDev = process.env.NODE_ENV === "development";
const baseUrl = isDev
  ? "http://localhost:8000/api/"
  : "/.netlify/functions/proxy/api/"; // Using Netlify function URL for production

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: async (headers, { getState }) => {
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      // Add cache-busting headers
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({
        url: "products",
        method: "GET",
        credentials: 'include',
        validateStatus: (response, result) => {
          if (response.status === 200) return true;
          console.error('Products API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: result
          });
          return false;
        },
      }),
      retry: (failureCount, error) => {
        if (failureCount < 3) {
          return true;
        }
        return false;
      },
    }),
    getProduct: builder.query({
      query: (id) => ({
        url: `products/${id}`,
        method: "GET",
        credentials: 'include',
        validateStatus: (response, result) => {
          if (response.status === 200) return true;
          console.error('Product API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: result
          });
          return false;
        },
      }),
      retry: (failureCount, error) => {
        if (failureCount < 3) {
          return true;
        }
        return false;
      },
    }),
    getCategories: builder.query({
      query: () => ({
        url: "categories",
        method: "GET",
        credentials: 'include',
        validateStatus: (response, result) => {
          if (response.status === 200) return true;
          console.error('Categories API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: result
          });
          return false;
        },
      }),
      retry: (failureCount, error) => {
        if (failureCount < 3) {
          return true;
        }
        return false;
      },
    }),
    createProduct: builder.mutation({
      query: ({ data, token }) => ({
        url: "products",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      }),
    }),
    createOrder: builder.mutation({
      query: ({ orderData, token }) => ({
        url: "orders",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: orderData,
      }),
    }),
    getOrder: builder.query({
      query: ({ orderId, token }) => ({
        url: `orders/${orderId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
