import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { register } from "../services/authService";
import { PasswordInput } from "../components/ui/PasswordInput";

const getApiErrorMessage = (err) => {
  const status = err?.response?.status;
  const responseError = err?.response?.data?.error;
  const validationMessage = err?.response?.data?.message;

  if (responseError?.message) return responseError.message;
  if (validationMessage) return validationMessage;
  if (status === 409) return "Tên đăng nhập hoặc thư điện tử đã tồn tại.";
  if (status === 502 || status === 503) {
    return "Hệ thống đăng ký đang bảo trì. Vui lòng thử lại sau giây lát.";
  }
  if (err?.message) return err.message;

  return "Không thể hoàn tất đăng ký";
};

export const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận chưa trùng khớp");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (response?.success === false) {
        throw new Error(response?.error?.message || "Đăng ký thất bại");
      }

      navigate("/login", {
        replace: true,
        state: { message: "Đăng ký thành viên thành công. Quý khách vui lòng đăng nhập." },
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-8 py-10 mx-auto">
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
          ADHÉSION &bull; GRAND ATELIER CENTRAL
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
          Đăng Ký Thành Viên
        </h1>
        <p className="mt-2 text-xs text-[#6B655D] leading-relaxed">
          Tận hưởng đặc quyền ướm thử kỹ thuật số và lưu giữ thông tin mua sắm cá nhân
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 p-8 bg-[#FAF8F5] border border-[#E5E0D8]"
      >
        {error && (
          <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 px-4 py-2.5 text-xs text-[#C05A39]">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
          Tên người dùng
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476]" />
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="ví dụ: quannh08"
              autoComplete="username"
              required
              className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-xs text-[#161514] placeholder-[#8C8476] transition focus:border-[#161514] focus:outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
          Thư điện tử
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476]" />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ví dụ: client@domain.com"
              autoComplete="email"
              required
              className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-xs text-[#161514] placeholder-[#8C8476] transition focus:border-[#161514] focus:outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
          Mật khẩu
          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 text-xs text-[#161514] transition focus:border-[#161514] focus:outline-none"
          />
          <span className="text-[10px] text-[#8C8476]">Mật khẩu nên chứa tối thiểu 8 ký tự.</span>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
          Xác nhận lại mật khẩu
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 text-xs text-[#161514] transition focus:border-[#161514] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 w-full bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all cursor-pointer disabled:bg-[#D8D2C5]"
        >
          {isSubmitting ? "Đang khởi tạo tài khoản..." : "Tạo Tài Khoản Thành Viên"}
        </button>

        <p className="text-center text-xs text-[#6B655D] pt-2">
          Quý khách đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[#C05A39] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </div>
  );
};
export default Register;
