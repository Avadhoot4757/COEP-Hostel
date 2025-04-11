"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/applicationform/ui/card"
import { Input } from "@/components/applicationform/ui/input"
import { Button } from "@/components/applicationform/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/applicationform/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/applicationform/ui/radio-group"
import { Label } from "@/components/applicationform/ui/label"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2} from "lucide-react"
import { Alert, AlertDescription } from "@/components/applicationform/ui/alert"
import { FileUploadField } from "@/components/applicationform/FileUploadField";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const MultiStepForm = () => {
  const router = useRouter();
  const method = useForm({mode: "all"})
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting},
  } = method;

  const [step, setStep] = useState(1)
  const category = watch("category", "")

  // Get the total number of steps for the selected category
  const totalSteps = category === "OPEN" || category === "EWS" ? 4 : 5

  // Calculate progress percentage
  const progressPercentage = (step / totalSteps) * 100

  // Step titles
  const getStepTitle = (stepNumber) => {
    if (stepNumber === 1) return "Basic Details"
    if (category !== "OPEN" && category !== "EWS" && stepNumber === 2) return "Caste Details"
    if (stepNumber === totalSteps - 2) return "Extra Details"
    if (stepNumber === totalSteps - 1) return "Parents' Information"
    if (stepNumber === totalSteps) return "Documents"
    return `Step ${stepNumber}`
  }

  const sendDataToBackend = async (data) => {
    try {
      console.log("Sending data", data)

      const formData = new FormData()

      // Append all non-file fields
      Object.keys(data).forEach((key) => {
        if (key !== "files") {
          formData.append(key, data[key])
        }
      })

      // Append all file fields
      if (data.files) {
        data.files.forEach((file, index) => {
          formData.append(`files[${index}]`, file)
        })
      }

      /*const response = await fetch("http://localhost:8000/auth/apply/", {
        method: "POST",
        body: formData,
      });

      if(!response.ok){
        throw new Error(`Server responded with status ${response.status}`);
      }*/

      console.log("Data sent successfully!")
      return true;

    } catch (error) {
      console.error("Error sending data:", error)
      return false;
    }
  }

  // Handle form submission
  const onSubmit = async (formData) => {
    const confirmSubmit = window.confirm("Are you sure you want to submit the form?")

    if (!confirmSubmit) {
      return
    }

    const finalData = {
      ...formData,
      files: formData.files ? Array.from(formData.files) : [],
    }

    const success = await sendDataToBackend(finalData);

    if (success){
      toast.success("Form submitted successfully!");
      router.push("/"); 
    }
    else {
      toast.error("Failed to submit form. Please try again.");
    }
    
  }

  // Function to validate and move to the next step
  const handleNext = async () => {
    const isValid = await trigger()
    if (!isValid) {
      return
    }

    if (step === 1 && !category) {
      return
    }

    setStep(step + 1)
  }

  // Custom file input handler
  //const handleFileChange = (e, fieldName) => {
    //if (e.target.files && e.target.files[0]) {
      //setValue(fieldName, e.target.files[0])
//    }
  //}

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg bg-white border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700">
          <CardTitle className="text-2xl text-white">Hostel Admission Form</CardTitle>
          <CardDescription className="text-slate-200">Please complete all required information</CardDescription>
        </CardHeader>

        <div className="px-6 pt-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {totalSteps}: {getStepTitle(step)}
            </span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
         
        </div>
        <FormProvider {...method}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 bg-white space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="!text-amber-600 h-4 w-4"/>
                  <AlertDescription className="text-amber-800">
                    Please ensure all documents are in PDF, JPG, or PNG format
                  </AlertDescription>
          </Alert>
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="name">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="bg-white text-black border border-gray-300"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="mis">
                      MIS Number
                    </Label>
                    <Input
                      id="mis"
                      placeholder="9-digit MIS number"
                      className="bg-white text-black border border-gray-300"
                      {...register("mis", {
                        required: "MIS Number is required",
                        pattern: {
                          value: /^[0-9]{9}$/,
                          message: "Enter a valid 9-digit MIS number",
                        },
                      })}
                    />
                    {errors.mis && <p className="text-sm text-red-500">{errors.mis.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Gender</Label>
                  <RadioGroup onValueChange={(value) => {setValue("gender", value); trigger("gender");}} defaultValue={watch("gender")}>
                    <div className="flex space-x-4">
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                
                          value="male"
                          id="gender-male"
                        
                        />
                        <Label className="text-gray-700" htmlFor="gender-male">
                          Male
                        </Label>
                      </div>
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                          value="female"
                          id="gender-female"
                          
                        />
                        <Label className="text-gray-700" htmlFor="gender-female">
                          Female
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <Input type="hidden" {...register("gender", { required: "Gender is required" })} />
                  {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="mobile">
                      Student Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      placeholder="10-digit mobile number"
                      className="bg-white text-black border border-gray-300"
                      {...register("mobile", {
                        required: "Mobile number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit number",
                        },
                      })}
                    />
                    {errors.mobile && <p className="text-sm text-red-500">{errors.mobile.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="class">
                      Class
                    </Label>
                    <Select onValueChange={(value) => {setValue("class", value);trigger("class");}} defaultValue={watch("class")}>
                      <SelectTrigger className="bg-white text-black border border-gray-300">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-300">
                        <SelectItem className="hover:bg-gray-200" value="fy">First Year</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="sy">Second Year</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="ty">Third Year</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="btech">Final Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="hidden" {...register("class", { required: "Class is required" })} />
                    {errors.class && <p className="text-sm text-red-500">{errors.class.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="branch">
                      Branch
                    </Label>
                    <Select onValueChange={(value) => {setValue("branch", value); trigger("branch");}} defaultValue={watch("branch")}>
                      <SelectTrigger className="bg-white text-black border border-gray-300">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-300 ">
                        <SelectItem className="hover:bg-gray-200" value="civil">Civil</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="cs">Computer Science</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="entc">Electronics & Telecommunication</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="electrical">Electrical</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="instru">Instrumentation</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="mechanical">Mechanical</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="meta">Metallurgy</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="prod">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="hidden" {...register("branch", { required: "Branch is required" })} />
                    {errors.branch && <p className="text-sm text-red-500">{errors.branch.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="category">
                      Category
                    </Label>
                    <Select onValueChange={(value) => {setValue("category", value); trigger("category");}} defaultValue={watch("category")}>
                      <SelectTrigger className="bg-white text-black border border-gray-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-300">
                        <SelectItem className="hover:bg-gray-200" value="OPEN">OPEN</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="OBC">OBC</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="SBC">SBC</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="SC">SC</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="ST">ST</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="NT-B">NT-B</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="NT-C">NT-C</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="NT-D">NT-D</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="VJDT">VJDT</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="ECBC">ECBC</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="EWS">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="hidden" {...register("category", { required: "Category is required" })} />
                    {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="universityEmail">
                      University Mail ID
                    </Label>
                    <Input
                      id="universityEmail"
                      placeholder="example@coeptech.ac.in"
                      className="bg-white text-black border border-gray-300"
                      {...register("universityEmail", {
                        required: "University Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@coeptech\.ac\.in$/,
                          message: "Enter a valid COEP email",
                        },
                      })}
                    />
                    {errors.universityEmail && <p className="text-sm text-red-500">{errors.universityEmail.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="personalEmail">
                      Personal Mail ID
                    </Label>
                    <Input
                      id="personalEmail"
                      placeholder="example@gmail.com"
                      className="bg-white text-black border border-gray-300"
                      {...register("personalEmail", {
                        required: "Personal Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/,
                          message: "Enter a valid email",
                        },
                      })}
                    />
                    {errors.personalEmail && <p className="text-sm text-red-500">{errors.personalEmail.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="bloodGroup">
                      Blood Group
                    </Label>
                    <Select onValueChange={(value) => {setValue("bloodGroup", value); trigger("bloodGroup");}} defaultValue={watch("bloodGroup")}>
                      <SelectTrigger className="bg-white text-black border border-gray-300">
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-300">
                        <SelectItem className="hover:bg-gray-200" value="A+">A+</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="A-">A-</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="B+">B+</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="B-">B-</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="O+">O+</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="O-">O-</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="AB+">AB+</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="hidden" {...register("bloodGroup", { required: "Blood Group is required" })} />
                    {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="cgpa">
                      CGPA
                    </Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      placeholder="Enter your CGPA"
                      className="bg-white text-black border border-gray-300"
                      {...register("cgpa", {
                        required: "CGPA is required",
                        min: { value: 0, message: "CGPA cannot be negative" },
                        max: { value: 10, message: "CGPA cannot be greater than 10" },
                      })}
                    />
                    {errors.cgpa && <p className="text-sm text-red-500">{errors.cgpa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="backlogs">
                      Number of Backlogs
                    </Label>
                    <Input
                      id="backlogs"
                      type="number"
                      placeholder="Enter number of backlogs"
                      className="bg-white text-black border border-gray-300"
                      {...register("backlogs", {
                        required: "Number of backlogs is required",
                        min: { value: 0, message: "Backlogs cannot be negative" },
                      })}
                    />
                    {errors.backlogs && <p className="text-sm text-red-500">{errors.backlogs.message}</p>}
                  </div>
                </div>

                {watch("category") === "EWS" && (
                  /*<div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="ewscertificate">
                      EWS Certificate
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="ewscertificate"
                        type="file"
                        className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => {handleFileChange(e, "ewscertificate"); setValue("ewscertificate", e.target.files, { shouldValidate: true });trigger("ewscertificate");}}
                        
                        
                      />
                      <Upload className="h-5 w-5 text-slate-500" />
                    </div>
                    
                    
                    <Input type="hidden" {...register("ewscertificate", { required: "EWS certificate is required" })} />
                    {errors.ewscertificate && <p className="text-sm text-red-500">{errors.ewscertificate.message}</p>}
                  </div>*/
                  <FileUploadField name="ewscertificate" label="EWS Certificate" />
                )}
              </div>
            )}

            {/* Category-Specific Steps */}
            {step > 1 && step < totalSteps && category && (
              <div>
                {category !== "OPEN" && category !== "EWS" && step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/*
                      <Label className="text-gray-700" htmlFor="castecertificate">
                        Caste Certificate
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="castecertificate"
                          type="file"
                          className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          accept=".pdf,.jpg,.png"
                          onChange={(e) => handleFileChange(e, "castecertificate")}
                        />
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>
                      <Input
                        type="hidden"
                        {...register("castecertificate", { required: "Caste Certificate is required" })}
                      />
                      {errors.castecertificate && (
                        <p className="text-sm text-red-500">{errors.castecertificate.message}</p>
                      )}
                      */}
                      <FileUploadField name="castecertificate" label="Caste Certificate" />
                    </div>

                    <div className="space-y-2">
                      {/*<Label className="text-gray-700" htmlFor="castevalidity">
                        Caste Validity certificate / Tribe Validity certificate
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="castevalidity"
                          type="file"
                          className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          accept=".pdf,.jpg,.png"
                          onChange={(e) => handleFileChange(e, "castevalidity")}
                        />
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>
                      <Input type="hidden" {...register("castevalidity", { required: "This field is required" })} />
                      {errors.castevalidity && <p className="text-sm text-red-500">{errors.castevalidity.message}</p>}
                    */}
                    <FileUploadField name="castevalidity" label="Caste Validity certificate / Tribe Validity certificate" />
                    </div>

                    <div className="space-y-2">
                      {/*<Label className="text-gray-700" htmlFor="incomecertificate">
                        Income certificate
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="incomecertificate"
                          type="file"
                          className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          accept=".pdf,.jpg,.png"
                          onChange={(e) => handleFileChange(e, "incomecertificate")}
                        />
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>
                      <Input type="hidden" {...register("incomecertificate")} />
                      {errors.incomecertificate && (
                        <p className="text-sm text-red-500">{errors.incomecertificate.message}</p>
                      )}*/}
                      <FileUploadField name="incomecertificate" label="Income certificate" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Belongs to Non-Creamy Layer Certificate</Label>
                      <RadioGroup
                        
                        onValueChange={(value) =>  {setValue("non_creamylayer", value); trigger("non_creamylayer");}} defaultValue={watch("non_creamylayer")}>
                        <div className="flex space-x-4">
                          <div className="flex text-black items-center space-x-2">
                            <RadioGroupItem
                            className="bg-white text-black"
                              value="yes"
                              id="non_creamylayer-yes"
                              
                            />
                            <Label className="text-gray-700" htmlFor="non_creamylayer-yes">
                              Yes
                            </Label>
                          </div>
                          <div className="flex text-black items-center space-x-2">
                            <RadioGroupItem
                              className="bg-white text-black"
                              value="no"
                              id="non_creamylayer-no"
                              
                            />
                            <Label className="text-gray-700" htmlFor="non_creamylayer-no">
                              No
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                      <Input type="hidden" {...register("non_creamylayer", { required: "Field is required" })} />
                      {errors.non_creamylayer && (
                        <p className="text-sm text-red-500">{errors.non_creamylayer.message}</p>
                      )}
                    </div>

                    {watch("non_creamylayer") === "yes" && (
                      <div className="space-y-2">
                        {/*
                        <Label className="text-gray-700" htmlFor="non_creamylayercertificate">
                          Non-Creamy Layer Certificate (valid up to 31st March 2025)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="non_creamylayercertificate"
                            type="file"
                            className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                            accept=".pdf,.jpg,.png"
                            onChange={(e) => handleFileChange(e, "non_creamylayercertificate")}
                          />
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <Input
                          type="hidden"
                          {...register("non_creamylayercertificate", { required: "Certificate required" })}
                        />
                        {errors.non_creamylayercertificate && (
                          <p className="text-sm text-red-500">{errors.non_creamylayercertificate.message}</p>
                        )}*/}
                        <FileUploadField name="non_creamylayercertificate" label="Non-Creamy Layer Certificate (valid up to 31st March 2025)"/>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Extra details */}
            {step === totalSteps - 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="belongsto">
                    Whether belongs to:
                  </Label>
                  <Select onValueChange={(value) => {setValue("belongsto", value); trigger("belongsto");}} defaultValue={watch("belongsto")}>
                    <SelectTrigger className="bg-white text-black border border-gray-300">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-300">
                      <SelectItem className="hover:bg-gray-200" value="NRI">NRI</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="CIWGC">CIWGC</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="FN">FN</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="PIO">PIO</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="JNK">Jammu and Kashmir</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="GoI">GoI (North East State Candidate)</SelectItem>
                      <SelectItem className="hover:bg-gray-200" value="NA">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="hidden" {...register("belongsto", { required: "Select one option" })} />
                  {errors.belongsto && <p className="text-sm text-red-500">{errors.belongsto.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Belongs to Orphan Candidate</Label>
                  <RadioGroup
                    
                    onValueChange={(value) => {setValue("orphancandidate", value); trigger("orphancandidate");}} defaultValue={watch("orphancandidate")}>
                    <div className="flex space-x-4">
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                          value="yes"
                          id="orphancandidate-yes"
                        />
                        <Label className="text-gray-700" htmlFor="orphancandidate-yes">
                          Yes
                        </Label>
                      </div>
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                          value="no"
                          id="orphancandidate-no"

                        />
                        <Label className="text-gray-700" htmlFor="orphancandidate-no">
                          No
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <Input type="hidden" {...register("orphancandidate", { required: "This field is required" })} />
                  
                  {errors.orphancandidate && <p className="text-sm text-red-500">{errors.orphancandidate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Belongs to Person with Disability Candidate</Label>
                  <RadioGroup onValueChange={(value) => {setValue("pwd", value); trigger("pwd");}} defaultValue={watch("pwd")}>
                    <div className="flex space-x-4">
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                          value="yes"
                          id="pwd-yes"
                          
                        />
                        <Label className="text-gray-700" htmlFor="pwd-yes">
                          Yes
                        </Label>
                      </div>
                      <div className="flex text-black items-center space-x-2">
                        <RadioGroupItem
                          value="no"
                          id="pwd-no"
                          
                        />
                        <Label className="text-gray-700" htmlFor="pwd-no">
                          No
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <Input type="hidden" {...register("pwd", { required: "This field is required" })} />
                  
                  {errors.pwd && <p className="text-sm text-red-500">{errors.pwd.message}</p>}
                </div>

                {watch("pwd") === "yes" && (
                  /*<div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="pwdcertificate">
                      Person with Disability Candidate Certificate
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pwdcertificate"
                        type="file"
                        className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => handleFileChange(e, "pwdcertificate")}
                      />
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <Input type="hidden" {...register("pwdcertificate", { required: "Certificate required" })} />
                    {errors.pwdcertificate && <p className="text-sm text-red-500">{errors.pwdcertificate.message}</p>}
                  }

                    )}
                    </div>*/
                    
                    <FileUploadField name="pwdcertificate" label="Person with Disability Candidate Certificate" />
                )}
              </div>
            )}
            

            {/* Parents' Information */}
            {step === totalSteps - 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="parent_name">
                      Name of Parent
                    </Label>
                    <Input
                      id="parent_name"
                      placeholder="Enter parent's name"
                      className="bg-white text-black border border-gray-300"
                      {...register("parent_name", { required: "Parent name is required" })}
                    />
                    {errors.parent_name && <p className="text-sm text-red-500">{errors.parent_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="parent_contact">
                      Contact Number of Parent
                    </Label>
                    <Input
                      id="parent_contact"
                      placeholder="10-digit contact number"
                      className="bg-white text-black border border-gray-300"
                      {...register("parent_contact", {
                        required: "Parent contact number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit contact number",
                        },
                      })}
                    />
                    {errors.parent_contact && <p className="text-sm text-red-500">{errors.parent_contact.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="parent_occupation">
                      Occupation of Parent
                    </Label>
                    <Input
                      id="parent_occupation"
                      placeholder="Enter parent's occupation"
                      className="bg-white text-black border border-gray-300"
                      {...register("parent_occupation", { required: "Parent's occupation is required" })}
                    />
                    {errors.parent_occupation && (
                      <p className="text-sm text-red-500">{errors.parent_occupation.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="annual_income">
                      Annual income of family
                    </Label>
                    <Input
                      id="annual_income"
                      type="number"
                      placeholder="Enter annual income"
                      className="bg-white text-black border border-gray-300"
                      {...register("annual_income", { required: "Annual Income is required" })}
                    />
                    {errors.annual_income && <p className="text-sm text-red-500">{errors.annual_income.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="permanent_address">
                    Permanent address
                  </Label>
                  <Input
                    id="permanent_address"
                    placeholder="Enter permanent address"
                    className="bg-white text-black border border-gray-300"
                    {...register("permanent_address", { required: "Permanent address is required" })}
                  />
                  {errors.permanent_address && (
                    <p className="text-sm text-red-500">{errors.permanent_address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="local_guardian_name">
                      Name of Local Guardian
                    </Label>
                    <Input
                      id="local_guardian_name"
                      placeholder="Enter local guardian's name"
                      className="bg-white text-black border border-gray-300"
                      {...register("local_guardian_name", { required: "Local guardian name is required" })}
                    />
                    {errors.local_guardian_name && (
                      <p className="text-sm text-red-500">{errors.local_guardian_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="local_guardian_contact">
                      Contact Number of Local Guardian
                    </Label>
                    <Input
                      id="local_guardian_contact"
                      placeholder="10-digit contact number"
                      className="bg-white text-black border border-gray-300"
                      {...register("local_guardian_contact", {
                        required: "Local guardian contact number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit contact number",
                        },
                      })}
                    />
                    {errors.local_guardian_contact && (
                      <p className="text-sm text-red-500">{errors.local_guardian_contact.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="local_address">
                    Local address
                  </Label>
                  <Input
                    id="local_address"
                    placeholder="Enter local address"
                    className="bg-white text-black border border-gray-300"
                    {...register("local_address", { required: "Local address is required" })}
                  />
                  {errors.local_address && <p className="text-sm text-red-500">{errors.local_address.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="emergency_contact">
                    Contact Number in case of emergency
                  </Label>
                  <Input
                    id="emergency_contact"
                    placeholder="10-digit emergency contact"
                    className="bg-white text-black border border-gray-300"
                    {...register("emergency_contact", {
                      required: "Emergency contact number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter a valid 10-digit contact number",
                      },
                    })}
                  />
                  {errors.emergency_contact && (
                    <p className="text-sm text-red-500">{errors.emergency_contact.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {step === totalSteps && (
              <div className="space-y-4">
                
                {/*<div className="space-y-2" >
                  <Label className="text-gray-700" htmlFor="application_form">
                    Upload duly signed scan copy of Hostel Admission Application form 2025-26
                  </Label>
                  <p className="text-xs text-gray-500">
                    Make a PDF file of your application form and name it with your MIS number
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="application_form"
                      type="file"
                      className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileChange(e, "application_form")}
                    />
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input type="hidden" {...register("application_form", { required: "This field is required" })} />
                  {errors.application_form && <p className="text-sm text-red-500">{errors.application_form.message}</p>}
                </div> */}
                
                <FileUploadField name="application_form" label="Upload duly signed scan copy of Hostel Admission Application form 2025-26"/>

                {/*<div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="hostel_no_dues">
                    Upload scan copy of Hostel No Dues Certificate of AY 2024-25
                  </Label>
                  <p className="text-xs text-gray-500">Name file with your MIS number</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hostel_no_dues"
                      type="file"
                      className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileChange(e, "hostel_no_dues")}
                    />
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input type="hidden" {...register("hostel_no_dues", { required: "This field is required" })} />
                  {errors.hostel_no_dues && <p className="text-sm text-red-500">{errors.hostel_no_dues.message}</p>}
                </div>*/}
                
                <FileUploadField name="hostel_no_dues" label="Upload scan copy of Hostel No Dues Certificate of AY 2024-25"></FileUploadField>

               {/* <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="mess_no_dues">
                    Upload scan copy of Mess No Dues Certificate of AY 2024-25
                  </Label>
                  <p className="text-xs text-gray-500">Name file with your MIS number</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="mess_no_dues"
                      type="file"
                      className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileChange(e, "mess_no_dues")}
                    />
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input type="hidden" {...register("mess_no_dues", { required: "This field is required" })} />
                  {errors.mess_no_dues && <p className="text-sm text-red-500">{errors.mess_no_dues.message}</p>}
                </div>*/}
                
                <FileUploadField name="mess_no_dues" label="Upload scan copy of Mess No Dues Certificate of AY 2024-25"></FileUploadField>

                <Button
                  type="submit"
                  className="w-full mt-4 bg-black hover:bg-gray-500 text-white"
                  disabled={Object.keys(errors).length > 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6 bg-white">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex items-center bg-white text-gray-700 border border-gray-300 hover:bg-gray-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < totalSteps && (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto flex items-center bg-black hover:bg-gray-500 text-white"
                
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </form>
        </FormProvider>
      </Card>
    </div>
  )
}

export default MultiStepForm

