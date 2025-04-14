import { Input } from "@/components/applicationform/ui/input";
import { Label } from "@/components/applicationform/ui/label";
import { Download, Eye } from "lucide-react";
import { useFormContext} from "react-hook-form";
import { useRef } from "react";

interface FileUploadFieldProps {
  name: string;
  label: string;
  accept?: string;
}

export const FileUploadField = ({ name, label, accept = ".pdf,.jpg,.png" }: FileUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
    control,
  } = useFormContext();

  const watchedFile = watch(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const maxSize = 5 * 1024 * 1024;

  if (file && file.size <= maxSize) {
    setValue(name, file, { shouldValidate: true });
  } else {
    
    setValue(name, null, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  trigger(name);
  
  };

  return (
    <div className="space-y-2">
      <Label className="text-gray-700" htmlFor={name}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          id={name}
          name={name}
          type="file"
          accept={accept}
          className="bg-white text-black border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          onChange={handleChange}
          
        />
        
        
        {watchedFile && (
          <div className="text-sm text-green-600 space-y-1">
            <a
              href={URL.createObjectURL(watchedFile)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            ><Eye className="h-5 w-5 text-slate-500" />
            </a>
          </div>
        )}
       
      </div>

      {watchedFile && (
        <p className="text-sm text-green-600">
          Selected file: {watchedFile.name}
        </p>
      )}

      <Input
        type="hidden"
        {...register(name, { required: `${label} is required and file size shoule be less than 5MB` })}
      />
      {errors[name] && (
        <p className="text-sm text-red-500">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};
