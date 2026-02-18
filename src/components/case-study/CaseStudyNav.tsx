const CaseStudyNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight" style={{ color: "#1E3A8A" }}>
          Hein Thant Aung
        </span>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs font-medium" style={{ color: "#64748B" }}>Work</a>
          <a href="#" className="text-xs font-medium" style={{ color: "#64748B" }}>About</a>
          <a href="#" className="text-xs font-medium" style={{ color: "#64748B" }}>Contact</a>
        </div>
      </div>
    </nav>
  );
};

export default CaseStudyNav;
