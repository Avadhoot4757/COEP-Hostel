import { Suspense } from "react";
import Home from "./home-client"; // adjust path if you move file

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}
