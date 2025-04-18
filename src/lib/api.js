import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Access-Control-Allow-Origin", "https://fed-storefront-frontend-dhanushka.netlify.app");
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({
        url: "products",
        method: "GET",
        credentials: 'include',
        headers: {
          "Access-Control-Allow-Origin": "https://fed-storefront-frontend-dhanushka.netlify.app",
          "Access-Control-Allow-Credentials": "true",
        },
      }),
    }),
    getProduct: builder.query({
      query: (id) => ({
        url: `products/${id}`,
        method: "GET",
        credentials: 'include',
        headers: {
          "Access-Control-Allow-Origin": "https://fed-storefront-frontend-dhanushka.netlify.app",
          "Access-Control-Allow-Credentials": "true",
        },
      }),
    }),
    getCategories: builder.query({
      query: () => ({
        url: "categories",
        method: "GET",
        credentials: 'include',
        headers: {
          "Access-Control-Allow-Origin": "https://fed-storefront-frontend-dhanushka.netlify.app",
          "Access-Control-Allow-Credentials": "true",
        },
      }),
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
