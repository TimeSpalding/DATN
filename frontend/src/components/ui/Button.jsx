export const Button = ({ children, onClick, className = "", type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2.5 bg-[#161514] hover:bg-[#2A2725] text-[#FAF8F5] text-xs font-semibold uppercase tracking-widest transition cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};
