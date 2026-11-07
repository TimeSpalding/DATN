import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  autoComplete = "current-password",
  minLength,
  required = true,
  placeholder = "••••••••",
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476] pointer-events-none" />
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className={`w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 pl-10 pr-10 text-xs text-[#161514] placeholder-[#8C8476] outline-none transition focus:border-[#161514] ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-[#8C8476] hover:text-[#161514] transition-colors focus:outline-none"
      >
        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
};
