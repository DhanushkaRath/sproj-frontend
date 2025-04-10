import "./Hero.css";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="px-8 py-8">
      <div className="hero-container">
        <div className="hero-content">
          <span className="discount-badge">WEEKLY DISCOUNT</span>
          <h1 className="hero-title">Premium Product Online Shop</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius quos
            suscipit est autem quia? Voluptatem?
          </p>
          <Link to="/shop">
            <Button className="w-fit">Shop Now</Button>
          </Link>
        </div>
        <div className="hero-image-container">
          <img
            src="https://fee-storefront.vercel.app/assets/hero/hero.jpg"
            alt=""
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;