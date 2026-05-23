type CardItem = {
  title: string;
  description: string;
};

type CardGridProps = {
  items: CardItem[];
  columns?: 2 | 3;
};

export function CardGrid({ items, columns = 3 }: CardGridProps) {
  return (
    <div
      className={`grid gap-5 ${
        columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"
      }`}
    >
      {items.map((item) => (
        <article
          key={item.title}
          className="surface-card h-full border-ink/5 hover:-translate-y-1"
        >
          <h3 className="text-2xl">{item.title}</h3>
          <p className="mt-4">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
