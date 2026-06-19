export function maskNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return partes[0] ?? '';
  return [partes[0], ...partes.slice(1).map(() => '***')].join(' ');
}

export function maskCPF(cpf?: string | null): string {
  const digits = (cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return cpf?.trim() ? '***.***.***-**' : '—';
  return `***.***.***-${digits.slice(-2)}`;
}

export function maskTelefone(telefone?: string | null): string {
  const digits = (telefone ?? '').replace(/\D/g, '');
  if (digits.length < 4) return telefone?.trim() ? '****-****' : '—';
  return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '—';
  const [usuario, dominio] = email.split('@');
  return `${usuario[0] ?? '*'}***@${dominio}`;
}
