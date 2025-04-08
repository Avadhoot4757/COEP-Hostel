import { Button } from "@/components/ui/button";

interface HeroProps {
  onApplyClick: () => void;
}

export default function Hero({ onApplyClick }: HeroProps) {
  return (
    <section 
      className="relative h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/hostel3.jpeg')",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16 h-full flex items-center">
        <div className="text-white max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">COEP Hostel</h1>
          <p className="text-xl md:text-2xl mb-8">A Home Away from Home</p>
          <p className="text-lg md:text-xl mb-8">
            Affordable, Secure, and Comfortable Student Living
          </p>
          <Button
            onClick={onApplyClick}
            className="bg-[#ff3333] hover:bg-[#cc0000] text-white px-8 py-6 text-lg"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </section>
  );
}