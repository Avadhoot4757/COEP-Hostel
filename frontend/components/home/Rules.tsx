import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Rules() {
  const rules = [
    "Entry/Exit timings strictly followed for security",
    "Visitors allowed only in designated areas",
    "Mandatory mess attendance during meal times",
    "Zero tolerance for ragging and misconduct"
  ];

  return (
    <section className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Hostel Rules & Guidelines</h2>
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <ul className="space-y-4">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300">
                <Download className="mr-2 h-4 w-4" /> Download Complete Rulebook
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}