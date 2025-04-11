import { Separator } from "@/components/ui/separator";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Skeleton } from "../../../components/ui/skeleton";
import ProductCards from "./ProductCards";
import Tab from "./Tab";

const API_BASE_URL = 'https://sproj-backend-dhanushka.onrender.com/api';

function Products() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        
        // Fetch products
        const productsResponse = await fetch(`${API_BASE_URL}/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const filteredProducts =
    selectedCategoryId === "ALL"
      ? products
      : products?.filter((product) => product.categoryId === selectedCategoryId);

  const handleTabClick = (_id) => {
    setSelectedCategoryId(_id);
  };

  if (isLoading) {
    return (
      <section className="px-8 py-8">
        <h2 className="text-4xl font-bold">Our Top Products</h2>
        <Separator className="mt-2" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-16" />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-8 py-8">
        <h2 className="text-4xl font-bold">Our Top Products</h2>
        <Separator className="mt-2" />
        <div className="mt-4">
          <p className="text-red-500">Error loading products and categories</p>
        </div>
      </section>
    );
  }

  if (!products || !categories) {
    return (
      <section className="px-8 py-8">
        <h2 className="text-4xl font-bold">Our Top Products</h2>
        <Separator className="mt-2" />
        <div className="mt-4">
          <p>No data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-8 py-8">
      <h2 className="text-4xl font-bold">Our Top Products</h2>
      <Separator className="mt-2" />
      <div className="mt-4 flex items-center gap-4">
        {[...categories, { _id: "ALL", name: "All" }].map((category) => (
          <Tab
            key={category._id}
            _id={category._id}
            name={category.name}
            isActive={selectedCategoryId === category._id}
            onClick={() => handleTabClick(category._id)}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4 mt-4">
        <ProductCards products={filteredProducts} />
      </div>
    </section>
  );
}

export default Products;