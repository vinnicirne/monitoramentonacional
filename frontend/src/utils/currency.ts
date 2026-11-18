const brlFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function parseBrlInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}

export function formatBrlAmount(value: number): string {
  return `R$ ${brlFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatBrlInput(value: string): string {
  const amount = parseBrlInput(value);
  if (!value.replace(/\D/g, '')) return '';
  return formatBrlAmount(amount);
}
