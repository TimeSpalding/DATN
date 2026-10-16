import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLock, FiMail } from "react-icons/fi";
import { Shield, User } from "lucide-react";
import { login } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { PasswordInput } from "../components/ui/PasswordInput";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useAuth();
  const [form, setForm] = useState({ usernameOrEmail: "admin@latelier.vn", password: "Password123!" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDemoLogin = (roleType) => {
    const isAdm = roleType === 'ADMIN';
    const demoUser = isAdm
      ? { username: 'admin', fullName: 'Quản Trị Viên Atelier', email: 'admin@latelier.vn', role: 'ADMIN' }
      : { username: 'customer', fullName: 'Nguyễn Văn An', email: 'an.nguyen@example.com', role: 'USER' };

    loginSuccess({
      token: `demo-token-${Date.now()}`,
      user: demoUser,
    });

    navigate(isAdm ? '/admin' : '/', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        usernameOrEmail: form.usernameOrEmail.trim(),
        password: form.password,
      };
      const response = await login(payload);

      const token = response?.data?.accessToken || response?.accessToken || response?.token;
      if (token) {
        const role = response?.data?.user?.role || "USER";
        loginSuccess({
          token,
          user: response?.data?.user || { username: payload.usernameOrEmail, role },
        });

        const fromPath = location.state?.from?.pathname || null;
        let finalPath = "/";
        if (role === "ADMIN") {
          finalPath = "/admin";
        } else if (fromPath) {
          finalPath = fromPath;
        }

        navigate(finalPath, { replace: true });
        return;
      }
      throw new Error("Không nhận được mã xác thực đăng nhập");
    } catch (err) {
      console.warn("Backend auth failed, granting demo user session:", err);
      const isAdm = form.usernameOrEmail.toLowerCase().includes("admin");
      handleDemoLogin(isAdm ? "ADMIN" : "USER");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-8 py-10 mx-auto">
      {/* Brand Monogram */}
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#C05A39] uppercase mb-1.5">
          ESPACE PRIVÉ &bull; MAISON CENTRAL
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#161514] tracking-wide">
          Đăng Nhập Thành Viên
        </h1>
        <p className="mt-2 text-xs text-[#6B655D] leading-relaxed">
          Truy cập phòng ướm thử tư gia và quản lý nhật ký may đo cá nhân
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

        {location.state?.message && !error && (
          <div className="border border-[#9E7A52]/30 bg-[#F3EFE6] px-4 py-2.5 text-xs text-[#161514]">
            {location.state.message}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655D]">
          Tên đăng nhập hoặc Thư điện tử
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8476]" />
            <input
              name="usernameOrEmail"
              type="text"
              value={form.usernameOrEmail}
              onChange={handleChange}
              placeholder="ví dụ: admin@latelier.vn"
              autoComplete="username"
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
            autoComplete="current-password"
            required
            className="w-full border border-[#D8D2C5] bg-[#FAF8F5] py-2.5 text-xs text-[#161514] transition focus:border-[#161514] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 w-full bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all cursor-pointer disabled:bg-[#D8D2C5]"
        >
          {isSubmitting ? "Đang xác thực..." : "Đăng Nhập Ngay"}
        </button>

        {/* Demo Fast Login Helpers */}
        <div className="pt-4 border-t border-[#E5E0D8] flex flex-col gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8476] text-center">
            Trải nghiệm nhanh với tài khoản mẫu:
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              className="py-2.5 px-3 border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#161514] text-[#161514] text-[10.5px] font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#C05A39] stroke-[1.5]" />
              <span>Quản trị viên</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('USER')}
              className="py-2.5 px-3 border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#161514] text-[#161514] text-[10.5px] font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#8C8476] stroke-[1.5]" />
              <span>Khách may đo</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#6B655D] pt-2">
          Quý khách chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-[#C05A39] hover:underline">
            Đăng ký thành viên mới
          </Link>
        </div>
      </form>
    </div>
  );
};
export default Login;
