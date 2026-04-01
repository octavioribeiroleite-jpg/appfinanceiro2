export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function calcularDescontos(
  valorBruto: number,
  percentualDizimo: number,
  percentualImposto: number,
  percentualGasolina: number,
  aplicarDizimo: boolean,
  aplicarImposto: boolean,
  aplicarGasolina: boolean,
) {
  const valorDizimo = aplicarDizimo ? Math.round(valorBruto * percentualDizimo) / 100 : 0;
  const valorImposto = aplicarImposto ? Math.round(valorBruto * percentualImposto) / 100 : 0;
  const valorGasolina = aplicarGasolina ? Math.round(valorBruto * percentualGasolina) / 100 : 0;
  const valorLiquido = valorBruto - valorDizimo - valorImposto - valorGasolina;
  return { valorDizimo, valorImposto, valorGasolina, valorLiquido };
}
