import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function Testimonials() {
  const testimonials = [
    {
      text: "The mess food is decent, and the study spaces are great! The environment really helps me focus on my academics.",
      author: "Rahul Sharma, 3rd Year"
    },
    {
      text: "Security is strict but ensures our safety. The facilities are well-maintained and the staff is helpful.",
      author: "Priya Patel, 2nd Year"
    },
    {
      text: "Living in COEP hostel has been a wonderful experience. It truly feels like a home away from home.",
      author: "Amit Kumar, 4th Year"
    }
  ];

  return (
    <section className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">What Our Residents Say</h2>
        <Carousel className="w-full max-w-4xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <Card className="bg-white/80 border-gray-200 shadow-lg">
                  <CardContent className="p-8">
                    <p className="text-lg italic mb-4 text-gray-700">{testimonial.text}</p>
                    <p className="text-[#ff3333] font-semibold">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}