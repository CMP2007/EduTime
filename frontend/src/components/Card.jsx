function Card({ title, description, children, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {title && (
        <header className="card__header">
          <h3 className="card__title">{title}</h3>
          {description && <p className="card__description">{description}</p>}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}

export default Card;
