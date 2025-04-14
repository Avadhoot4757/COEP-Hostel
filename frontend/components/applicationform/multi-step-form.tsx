"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/applicationform/ui/card";
import { Input } from "@/components/applicationform/ui/input";
import { Button } from "@/components/applicationform/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/applicationform/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/applicationform/ui/radio-group";
import { Label } from "@/components/applicationform/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/applicationform/ui/alert";
import { FileUploadField } from "@/components/applicationform/FileUploadField";

const MultiStepForm = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const methods = useForm({
    mode: "all",
    defaultValues: {
      orphan: false,
      pwd: false,
      roll_no: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "",
      mobile_number: "",
      class_name: "",
      branch: "",
      caste: "",
      personal_mail: "",
      blood_group: "",
      backlogs: 0,
      admission_category: "",
      parent_name: "",
      parent_contact: "",
      parent_occupation: "",
      annual_income: "",
      permanent_address: "",
      local_guardian_name: "",
      local_guardian_contact: "",
      local_guardian_address: "",
      emergency_contact: "",
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [castes, setCastes] = useState([]);

  useEffect(() => {
    console.log("Apply page auth:", { loading, isAuthenticated, user });
  }, [loading, isAuthenticated, user]);

  // Set roll_no
  useEffect(() => {
    if (user?.username) {
      setValue("roll_no", user.username, { shouldValidate: true });
    }
  }, [user, setValue]);

  // Fetch data
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        console.log("Fetching form data...");
        const statusRes = await api.get("/auth/apply/");
        if (statusRes.data.message === "Form already submitted") {
          setHasSubmitted(true);
          toast.error("You have already submitted the application form.");
          router.push("/");
          return;
        }

        const [branchesRes, categoriesRes, castesRes] = await Promise.all([
          fetch("http://localhost:8000/auth/api/branches/"),
          fetch("http://localhost:8000/auth/api/admissioncategories/"),
          fetch("http://localhost:8000/auth/api/castes/"),
        ]);

        setBranches(branchesRes.data);
        setCategories(categoriesRes.data);
        setCastes(castesRes.data);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load form options.");
      }
    };
  
    fetchDropdownOptions();
  }, []);
  
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

  const [step, setStep] = useState(1);
  const caste = watch("caste", "");
  const year = watch("class_name", "");

  // Get the total number of steps for the selected caste
  const totalSteps = caste === "OPEN" || caste === "EWS" ? 4 : 5

  // Calculate progress percentage
  const progressPercentage = (step / totalSteps) * 100

  // Step titles
  const getStepTitle = (stepNumber) => {
    if (stepNumber === 1) return "Basic Details";
    if (caste !== "OPEN" && caste !== "EWS" && stepNumber === 2)
      return "Caste Details";
    if (stepNumber === totalSteps - 2) return "Extra Details";
    if (stepNumber === totalSteps - 1) return "Parents' Information";
    if (stepNumber === totalSteps) return "Documents";
    return `Step ${stepNumber}`;
  };

  const sendDataToBackend = async (formValues) => {
    try {
      const formData = new FormData();
      Object.entries(formValues).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await api.post("/auth/apply/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Form submitted:", response.data);
      return true;
    } catch (error) {
      console.error("Submission error:", error);
      return false;
    }
  };

  const onSubmit = async (formData) => {
    if (!window.confirm("Are you sure you want to submit the form?")) return;

    const processedData = { ...formData };
    if (className !== "fy") {
      processedData.entrance_exam = null;
      processedData.rank = null;
    } else {
      processedData.cgpa = null;
    }

    const success = await sendDataToBackend(processedData);
    if (success) {
      toast.success("Form submitted successfully!");
      router.push("/");
    } else {
      toast.error("Failed to submit form. Please try again.");
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    if (step === 1 && !caste) return;

    setStep(step + 1);
  };

  const getFieldsForStep = (step) => {
    if (step === 1) {
      const fields = [
        "first_name",
        "middle_name",
        "last_name",
        "roll_no",
        "gender",
        "mobile_number",
        "class_name",
        "branch",
        "caste",
        "personal_mail",
        "blood_group",
        "backlogs",
      ];
      if (className === "fy") {
        fields.push("entrance_exam", "rank");
      } else {
        fields.push("college_mail", "cgpa");
      }
      if (caste === "EWS") {
        fields.push("ews_certificate");
      }
      return fields;
    }
    if (caste !== "OPEN" && caste !== "EWS" && step === 2) {
      return [
        "caste_certificate",
        "caste_validity_certificate",
        "income_certificate",
        "creamy_layer",
      ].concat(
        watch("creamy_layer") === "yes" ? ["non_creamy_layer_certificate"] : []
      );
    }
    if (step === totalSteps - 2) {
      return ["admission_category", "orphan", "pwd"].concat(
        watch("pwd") === "yes" ? ["pwd_certificate"] : []
      );
    }
    if (step === totalSteps - 1) {
      return [
        "parent_name",
        "parent_contact",
        "parent_occupation",
        "annual_income",
        "permanent_address",
        "local_guardian_name",
        "local_guardian_contact",
        "local_guardian_address",
        "emergency_contact",
      ];
    }
    if (step === totalSteps) {
      return ["application_form", "hostel_no_dues", "mess_no_dues"];
    }
    return [];
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg bg-white border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700">
          <CardTitle className="text-2xl text-white">
            Hostel Admission Form
          </CardTitle>
          <CardDescription className="text-slate-200">
            Please complete all required information
          </CardDescription>
        </CardHeader>

        <div className="px-6 pt-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {totalSteps}: {getStepTitle(step)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progressPercentage)}%
            </span>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="first_name">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      placeholder="Enter your first name"
                      className="bg-white text-black border border-gray-300"
                      {...register("first_name", { required: "First name is required" })}
                    />
                    {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
                  </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700" htmlFor="middle_name">
                        Middle Name
                      </Label>
                      <Input
                        id="middle_name"
                        placeholder="Enter your middle name"
                        className="bg-white text-black border border-gray-300"
                        {...register("middle_name")}
                        onChange={(e) => {
                          setValue(
                            "middle_name",
                            e.target.value.toUpperCase(),
                            { shouldValidate: true }
                          );
                        }}
                      />
                      {errors.middle_name && (
                        <p className="text-sm text-red-500">
                          {errors.middle_name.message}
                        </p>
                      )}
                    </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="last_name">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      placeholder="Enter your last name"
                      className="bg-white text-black border border-gray-300"
                      {...register("last_name", { required: "Last name is required" })}
                    />
                    {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="blood_group">
                      Blood Group
                    </Label>
                    <Select onValueChange={(value) => {setValue("blood_group", value); trigger("blood_group");}} defaultValue={watch("blood_group")}>
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
                    <Input type="hidden" {...register("blood_group", { required: "Blood Group is required" })} />
                    {errors.blood_group && <p className="text-sm text-red-500">{errors.blood_group.message}</p>}
                  </div>
                  <div className="space-y-2">
                  <Label className="text-gray-700" >Gender</Label>
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
                        <SelectItem className="hover:bg-gray-200" value="CIVIL">Civil</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="COMPUTER">Computer Science</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="ENTC">Electronics & Telecommunication</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="ELECTRICAL">Electrical</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="INSTRUMENTATION">Instrumentation</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="MECHANICAL">Mechanical</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="METALLURGY">Metallurgy</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="MANUFACTURING">Manufacturing</SelectItem>
                        <SelectItem className="hover:bg-gray-200" value="PLANNING">Planning</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="hidden" {...register("branch", { required: "Branch is required" })} />
                    {errors.branch && <p className="text-sm text-red-500">{errors.branch.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="caste">
                      Category
                    </Label>
                    <Select onValueChange={(value) => {setValue("caste", value); trigger("caste");}} defaultValue={watch("caste")}>
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
                    <Input type="hidden" {...register("caste", { required: "Category is required" })} />
                    {errors.caste && <p className="text-sm text-red-500">{errors.caste.message}</p>}
                  </div>
                </div> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="mobile_number">
                      Student Mobile Number
                    </Label>
                    <Input
                      id="mobile_number"
                      placeholder="10-digit mobile number"
                      className="bg-white text-black border border-gray-300"
                      {...register("mobile_number", {
                        required: "Mobile number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit number",
                        },
                      })}
                    />
                    {errors.mobile_number && <p className="text-sm text-red-500">{errors.mobile_number.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="personal_mail">
                      Personal Mail ID
                    </Label>
                    <Input
                      id="personal_mail"
                      placeholder="example@gmail.com"
                      className="bg-white text-black border border-gray-300"
                      {...register("personal_mail", {
                        required: "Personal Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/,
                          message: "Enter a valid email",
                        },
                      })}
                    />
                    {errors.personal_mail && <p className="text-sm text-red-500">{errors.personal_mail.message}</p>}
                  </div>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="class_name">
                      Class
                    </Label>
                    <Select onValueChange={(value) => {setValue("class_name", value);trigger("class_name");}} defaultValue={watch("class_name")}>
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
                    <Input type="hidden" {...register("class_name", { required: "Class is required" })} />
                    {errors.class_name && <p className="text-sm text-red-500">{errors.class_name.message}</p>}
                  </div>
                  
                </div>
                
                {year && year !== "fy" && (
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
                    <Label className="text-gray-700" htmlFor="roll_no">
                      MIS Number
                    </Label>
                    <Input
                      id="roll_no"
                      placeholder="9-digit MIS number"
                      className="bg-white text-black border border-gray-300"
                      {...register("roll_no", {
                        required: "MIS Number is required",
                        pattern: {
                          value: /^[0-9]{9}$/,
                          message: "Enter a valid 9-digit MIS number",
                        },
                      })}
                    />
                    {errors.roll_no && <p className="text-sm text-red-500">{errors.roll_no.message}</p>}
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
                )} 
                {year && year === "fy" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="roll_no">
                      Roll Number
                    </Label>
                    <Input
                      id="roll_no"
                      placeholder="Enter your roll number"
                      className="bg-white text-black border border-gray-300"
                      {...register("roll_no", {
                        required: "MIS Number is required",
                        
                      })}
                    />
                    {errors.roll_no && <p className="text-sm text-red-500">{errors.roll_no.message}</p>}
                  </div>
            
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="rank">
                      Rank
                    </Label>
                    <Input
                      id="rank"
                      type="number"
                      
                      placeholder="Enter your Rank"
                      className="bg-white text-black border border-gray-300"
                      {...register("rank", {
                        required: "Rank is required"
                      })}
                    />
                    {errors.rank && <p className="text-sm text-red-500">{errors.rank.message}</p>}
                  </div>   
                  <FileUploadField name="admission_confirmation_letter" label="Admission confirmation letter" />
                  <FileUploadField name="college_fee_receipt" label="College Fee receipt" />
                </div>
                )} 
                {caste === "EWS" && (
                  <FileUploadField name="ews_certificate" label="EWS Certificate" />
                )}
              </div>
            )}

            {/* caste-Specific Steps */}
            {step > 1 && step < totalSteps && caste && (
              <div>
                {caste !== "OPEN" && caste !== "EWS" && step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FileUploadField name="caste_certificate" label="Caste Certificate" />
                    </div>

                    <div className="space-y-2">
                    <FileUploadField name="caste_validity_certificate" label="Caste Validity certificate / Tribe Validity certificate" />
                    </div>

                    <div className="space-y-2">
                      
                      <FileUploadField name="income_certificate" label="Income certificate" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Belongs to Non-Creamy Layer Certificate</Label>
                      <RadioGroup
                        
                        onValueChange={(value) =>  {setValue("creamy_layer", value); trigger("creamy_layer");}} defaultValue={watch("creamy_layer")}>
                        <div className="flex space-x-4">
                          <div className="flex text-black items-center space-x-2">
                            <RadioGroupItem
                            className="bg-white text-black"
                              value="yes"
                              id="creamy_layer-yes"
                              
                            />
                            <Label className="text-gray-700" htmlFor="creamy_layer-yes">
                              Yes
                            </Label>
                          </div>
                          <div className="flex text-black items-center space-x-2">
                            <RadioGroupItem
                              className="bg-white text-black"
                              value="no"
                              id="creamy_layer-no"
                              
                            />
                            <Label className="text-gray-700" htmlFor="creamy_layer-no">
                              No
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                      <Input type="hidden" {...register("creamy_layer", { required: "Field is required" })} />
                      {errors.creamy_layer && (
                        <p className="text-sm text-red-500">{errors.creamy_layer.message}</p>
                      )}
                    </div>

                      {watch("creamy_layer") && (
                        <FileUploadField
                          name="non_creamy_layer_certificate"
                          label="Non-Creamy Layer Certificate (valid up to 31st March 2025)"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Extra Details */}
              {step === totalSteps - 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      className="text-gray-700"
                      htmlFor="admission_category"
                    >
                      Whether belongs to:
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        setValue("admission_category", value);
                        trigger("admission_category");
                      }}
                      defaultValue={watch("admission_category")}
                    >
                      <SelectTrigger className="bg-white text-black border border-gray-300">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-300">
                        {categories.map((c) => (
                          <SelectItem
                            key={c.admission_category}
                            className="hover:bg-gray-200"
                            value={c.admission_category}
                          >
                            {c.admission_category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="hidden"
                      {...register("admission_category", {
                        required: "Select one option",
                      })}
                    />
                    {errors.admission_category && (
                      <p className="text-sm text-red-500">
                        {errors.admission_category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">
                      Belongs to Orphan Candidate
                    </Label>
                    <RadioGroup
                      onValueChange={(value) => {
                        setValue("orphan", value === "yes", {
                          shouldValidate: true,
                        });
                      }}
                      defaultValue="no"
                    >
                      <div className="flex space-x-4">
                        <div className="flex text-black items-center space-x-2">
                          <RadioGroupItem value="yes" id="orphan-yes" />
                          <Label
                            className="text-gray-700"
                            htmlFor="orphan-yes"
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex text-black items-center space-x-2">
                          <RadioGroupItem value="no" id="orphan-no" />
                          <Label className="text-gray-700" htmlFor="orphan-no">
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {errors.orphan && (
                      <p className="text-sm text-red-500">
                        {errors.orphan.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">
                      Belongs to Person with Disability Candidate
                    </Label>
                    <RadioGroup
                      onValueChange={(value) => {
                        setValue("pwd", value === "yes", {
                          shouldValidate: true,
                        });
                      }}
                      defaultValue="no"
                    >
                      <div className="flex space-x-4">
                        <div className="flex text-black items-center space-x-2">
                          <RadioGroupItem value="yes" id="pwd-yes" />
                          <Label className="text-gray-700" htmlFor="pwd-yes">
                            Yes
                          </Label>
                        </div>
                        <div className="flex text-black items-center space-x-2">
                          <RadioGroupItem value="no" id="pwd-no" />
                          <Label className="text-gray-700" htmlFor="pwd-no">
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {errors.pwd && (
                      <p className="text-sm text-red-500">
                        {errors.pwd.message}
                      </p>
                    )}
                  </div>

                {watch("pwd") === "yes" && (
                    <FileUploadField name="pwd_certificate" label="Person with Disability Candidate Certificate" />
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
                        {...register("parent_name", {
                          required: "Parent name is required",
                        })}
                      />
                      {errors.parent_name && (
                        <p className="text-sm text-red-500">
                          {errors.parent_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        className="text-gray-700"
                        htmlFor="parent_contact"
                      >
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
                      {errors.parent_contact && (
                        <p className="text-sm text-red-500">
                          {errors.parent_contact.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        className="text-gray-700"
                        htmlFor="parent_occupation"
                      >
                        Occupation of Parent
                      </Label>
                      <Input
                        id="parent_occupation"
                        placeholder="Enter parent's occupation"
                        className="bg-white text-black border border-gray-300"
                        {...register("parent_occupation", {
                          required: "Parent's occupation is required",
                        })}
                      />
                      {errors.parent_occupation && (
                        <p className="text-sm text-red-500">
                          {errors.parent_occupation.message}
                        </p>
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
                        {...register("annual_income", {
                          required: "Annual Income is required",
                        })}
                      />
                      {errors.annual_income && (
                        <p className="text-sm text-red-500">
                          {errors.annual_income.message}
                        </p>
                      )}
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
                  <div className="space-y-2">
                  <FileUploadField name="address_proof" label="Address Proof" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Contact No. of Local Guardian
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
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="emergency_contact">
                      Contact No. in case of emergency
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

                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="local_guardian_address">
                    Local address
                  </Label>
                  <Input
                    id="local_guardian_address"
                    placeholder="Enter local address"
                    className="bg-white text-black border border-gray-300"
                    {...register("local_guardian_address", { required: "Local address is required" })}
                  />
                  {errors.local_guardian_address && <p className="text-sm text-red-500">{errors.local_guardian_address.message}</p>}
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
                
                <FileUploadField name="hostel_no_dues" label="Upload scan copy of Hostel No Dues Certificate of AY 2024-25"></FileUploadField>

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

export default MultiStepForm;
