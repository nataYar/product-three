import styles from "./page.module.css";
import HeroSection from "./Sections/HeroSection/HeroSection.js";

export default function Home() {
  return (
    <div className="page">
      <HeroSection />
      <section>Hello</section>
    </div>
  );
}
