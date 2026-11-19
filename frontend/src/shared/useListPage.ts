import { useState } from 'react';

export function useListPage<Item>(items: Item[], key: string, size = 30) {
  const [position, setPosition] = useState({ key, page: 1 });
  const last = Math.max(1, Math.ceil(items.length / size));
  const page = position.key === key ? Math.min(position.page, last) : 1;
  return {
    rows: items.slice((page - 1) * size, page * size),
    page,
    hasNext: page < last,
    previous: () => setPosition({ key, page: Math.max(1, page - 1) }),
    next: () => setPosition({ key, page: Math.min(last, page + 1) })
  };
}
