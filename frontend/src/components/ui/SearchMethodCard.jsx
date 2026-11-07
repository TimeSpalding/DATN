export const SearchMethodCard = ({
  iconBackgroundClassName,
  iconClassName,
  Icon,
  title,
  description,
}) => {
  return (
    <div className="group flex flex-1 flex-col items-center text-center p-8 bg-[#FAF8F5] border border-[#E5E0D8] transition-all duration-300 hover:border-[#161514]">
      <div
        className={`w-14 h-14 mb-5 ${iconBackgroundClassName} flex justify-center items-center`}
      >
        <Icon className={`w-5 h-5 ${iconClassName}`} />
      </div>

      <h3 className="mb-2.5 font-serif-luxury text-xl font-normal text-[#161514] transition-colors group-hover:text-[#C05A39]">
        {title}
      </h3>

      <p className="text-[#6B655D] text-xs leading-relaxed">{description}</p>
    </div>
  );
};
