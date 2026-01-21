import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
  className?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "py-3",
      type = "text",
      label,
      error,
      showPasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputType, setInputType] = useState<string>(type);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => {
        const next = !prev;
        setInputType(next ? "text" : "password");
        return next;
      });
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block opacity-60 mb-2 font-chocalte font-normal text-[14px] text-black">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={showPasswordToggle ? inputType : type}
            className={`
            w-full ps-4 bg-[#F7F7F8] rounded-md text-[13px]
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-primary-100 disabled:cursor-not-allowed
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
            ref={ref}
            {...props}
          />
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2 transform"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-red-600 text-sm">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
