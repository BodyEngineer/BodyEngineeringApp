import Navbar from "../components/Landing/Navbar";
import HeroSection from "../components/Landing/HeroSection";
import TransformationSection from "../components/Landing/TransformationSection";
import TestimonialSection from "../components/Landing/TestimonialSection";
import CoachSection from "../components/Landing/CoachSection";
import ConsultationSection from "../components/Landing/ConsultationSection";
import VideoSection from "../components/Landing/VideoSection";
import ProgramsV3 from "../components/ProgramsV3/ProgramsV3";
import Footer from "../components/Landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <HeroSection />

      <VideoSection />

      <TransformationSection />

      <CoachSection/>

      <ProgramsV3 />

      <TestimonialSection />

      <ConsultationSection />

      <Footer />
    </>
  );
}