import { Articles } from "./components/Articles";
import { Cta } from "./components/Cta";
import { FAQ } from "./components/FAQ";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { IndustryExplorer } from "./components/IndustryExplorer";
import { Navbar } from "./components/Navbar";
import { ScrollToTop } from "./components/ScrollToTop";
import { Testimonials } from "./components/Testimonials";
import { Tools } from "./components/Tools";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <IndustryExplorer />
      <Tools />
      <Articles />
      <Features />
      <Cta />
      <Testimonials />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </>
  );
}

export default App;
