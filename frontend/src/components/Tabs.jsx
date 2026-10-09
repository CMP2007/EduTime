function Tabs({ tabs, active, onChange }) {
  return (
    <nav className="tabs" role="tablist" aria-label="Secciones de la aplicación">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tabs__tab ${active === tab.id ? 'tabs__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default Tabs;
