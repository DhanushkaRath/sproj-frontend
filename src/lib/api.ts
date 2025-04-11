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

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
      baseUrl: "https://fed-storefront-backend-dhanushka.onrender.com/api/",
      prepareHeaders: async (headers, { getState }) => {
        const token = await window.Clerk?.session?.getToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
  
        return headers;
      },
    }),


  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => "products",
    }),
    getProduct: builder.query({
      query: (id) => `products/${id}`,
    }),
    getCategories: builder.query({
      query: () => "categories",
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