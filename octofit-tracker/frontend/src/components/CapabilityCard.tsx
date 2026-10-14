export type CapabilityItem = {
  id: string;
  primary: string;
  secondary?: string;
};

type Props = {
  title: string;
  description: string;
  items?: CapabilityItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
};

export function CapabilityCard({ title, description, items = [], isLoading = false, error = null, emptyMessage = 'No data available' }: Props) {
  if (isLoading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">{error}</p></div></section>;
  }

  if (!items.length) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p>{emptyMessage}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><ul className="list-group list-group-flush mt-3">{items.map((item) => <li key={item.id} className="list-group-item"><div>{item.primary}</div>{item.secondary ? <small className="text-muted">{item.secondary}</small> : null}</li>)}</ul></div></section>;
}
