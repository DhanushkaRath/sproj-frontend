import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


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
