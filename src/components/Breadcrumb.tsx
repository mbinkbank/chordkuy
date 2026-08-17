import { Link } from "../lib/router";

export interface Crumb {
  name: string;
  href: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href}>
              {last ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <>
                  <Link href={item.href}>{item.name}</Link>
                  <span className="sep" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
