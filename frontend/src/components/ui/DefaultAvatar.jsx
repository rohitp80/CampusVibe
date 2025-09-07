const DefaultAvatar = ({ size = "w-10 h-10", className = "" }) => {
  return (
    <div className={`${size} rounded-full bg-white border-4 border-black flex items-center justify-center ${className}`}>
      <div className={`${size === "w-24 h-24" ? "w-16 h-16" : size === "w-12 h-12" ? "w-8 h-8" : "w-6 h-6"} rounded-full bg-black`}></div>
    </div>
  );
};

export default DefaultAvatar;
