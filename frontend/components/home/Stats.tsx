import { Users, Shield, Utensils, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Stats() {
  const stats = [
    {
      icon: <Users className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />,
      value: "1200+",
      label: "Residents"
    },
    {
      icon: <Shield className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />,
      value: "24/7",
      label: "Security"
    },
    {
      icon: <Utensils className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />,
      value: "3",
      label: "Dining Halls"
    },
    {
      icon: <BookOpen className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />,
      value: "5+",
      label: "Study Spaces"
    }
  ];

  return (
    <section className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="pt-6 text-center">
              {stat.icon}
              <h3 className="text-3xl font-bold mb-2 text-gray-900">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}