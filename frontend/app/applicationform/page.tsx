import MultiStepForm from "@/components//applicationform/multi-step-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Hostel Admission Application</h1>
          <p className="mt-2 text-lg text-gray-600">Please fill out the form below to apply for hostel accommodation</p>
        </div>
        <MultiStepForm />
      </div>
    </main>
  )
}

