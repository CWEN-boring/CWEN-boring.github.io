import NavBar from "@/component/NavBar";
import Banner from "@/component/Banner";
import ServiceCards from "@/component/ServiceCards";
import FeatureSection from "@/component/FeatureSection";
import Footer from "@/component/Footer";

export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <NavBar />
            <Banner />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
                <ServiceCards />
            </main>
            <Footer />
        </div>
    );
}
