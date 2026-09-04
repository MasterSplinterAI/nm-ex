export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function kgToMt(kg: number): number {
  return kg / 1000;
}

export function mtToKg(mt: number): number {
  return Math.round(mt * 1000);
}
