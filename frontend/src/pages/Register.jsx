import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiUser } from "react-icons/fi";
import { register } from "../services/authService";
import { PasswordInput } from "../components/ui/PasswordInput";

const getApiErrorMessage = (err) => {
  const status = err?.response?.status;
  const responseError = err?.response?.data?.error;
  const validationMessage = err?.response?.data?.message;

  if (responseError?.message) return responseError.message;
  if (validationMessage) return validationMessage;
  if (status === 409) return "Tên đăng nhập hoặc email đã tồn tại.";
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
        state: {
          message: "Đăng ký thành viên thành công. Quý khách vui lòng đăng nhập.",
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-8 py-6 mx-auto">
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
          ĐĂNG KÝ THÀNH VIÊN &bull; GRAND ATELIER
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
          Tạo Tài Khoản Mới
        </h1>
        <p className="mt-2 text-xs text-[#6B655D] leading-relaxed">
          Lưu danh mục trang phục yêu thích, lịch sử tìm kiếm và theo dõi đơn hàng dễ dàng
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 p-8 bg-white border border-[#E5E0D8]"
      >
        {error && (
          <div className="border border-[#C05A39]/30 bg-[#C05A39]/10 px-4 py-2.5 text-xs text-[#C05A39]">
            {error}
          </div>
        )}

        <label
          htmlFor="register-username"
          className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]"
        >
          Tên đăng nhập
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476] pointer-events-none" />
            <input
              id="register-username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="ví dụ: minhnguyen"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-xs text-[#161514] placeholder-[#8C8476] transition focus:border-[#161514] focus:outline-none"
            />
          </div>
        </label>

        <label
          htmlFor="register-email"
          className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]"
        >
          Địa chỉ Email
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476] pointer-events-none" />
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ví dụ: khachhang@domain.com"
              autoComplete="email"
              spellCheck={false}
              required
              className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-xs text-[#161514] placeholder-[#8C8476] transition focus:border-[#161514] focus:outline-none"
            />
          </div>
        </label>

        <label
          htmlFor="register-password"
          className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]"
        >
          Mật khẩu
          <PasswordInput
            id="register-password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="text-[10px] font-normal normal-case tracking-normal text-[#8C8476]">
            Mật khẩu tối thiểu 8 ký tự.
          </span>
        </label>

        <label
          htmlFor="register-confirm-password"
          className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]"
        >
          Xác nhận mật khẩu
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all cursor-pointer disabled:bg-[#D8D2C5]"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Đăng Ký Tài Khoản"}
        </button>

        <p className="text-center text-xs text-[#6B655D] pt-2">
          Đã có tài khoản thành viên?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#C05A39] hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </div>
  );
};
export default Register;
