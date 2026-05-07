import './child-selector.css';

export default function ChildSelector({ children, selectedChildId, onSelect }) {
  if (!children || children.length <= 1) return null;

  return (
    <div className="child-selector">
      {children.map((child) => (
        <button
          key={child.id}
          className={`child-selector__pill${child.id === selectedChildId ? ' child-selector__pill--active' : ''}`}
          onClick={() => onSelect(child.id)}
        >
          {child.full_name}
        </button>
      ))}
    </div>
  );
}
