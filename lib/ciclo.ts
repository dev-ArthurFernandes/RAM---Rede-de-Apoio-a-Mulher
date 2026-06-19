import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CicloConfig {
  duracaoCiclo: number;
  duracaoMenstruacao: number;
  ultimaMenstruacao: string; // YYYY-MM-DD
}

export const CICLO_MIN = 21;
export const CICLO_MAX = 35;
export const MENSTRUACAO_MIN = 2;
export const MENSTRUACAO_MAX = 10;

const JANELA_FERTIL = 4; // dias antes/depois da ovulação considerados período fértil
const FASE_LUTEA = 14; // dias entre a ovulação e a próxima menstruação
const DIAS_TPM = 5; // dias antes da próxima menstruação considerados TPM

const STORAGE_PREFIX = '@ram/ciclo-menstrual';

export function criarConfigPadrao(): CicloConfig {
  return {
    duracaoCiclo: 28,
    duracaoMenstruacao: 5,
    ultimaMenstruacao: toISODate(new Date()),
  };
}

export function toISODate(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function fromISODate(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function addDays(date: Date, dias: number): Date {
  const resultado = new Date(date);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

export function diffInDays(a: Date, b: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / msPorDia);
}

export function formatDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function parseDataBR(valor: string): string | null {
  const match = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
}

function cycleDayFor(config: CicloConfig, date: Date): number {
  const diff = diffInDays(date, fromISODate(config.ultimaMenstruacao));
  return ((diff % config.duracaoCiclo) + config.duracaoCiclo) % config.duracaoCiclo;
}

export type FaseDetalhada = 'menstruacao' | 'folicular' | 'fertil' | 'ovulacao' | 'lutea' | 'tpm';

const fasesDetalhadas: Record<FaseDetalhada, { label: string; icon: string }> = {
  menstruacao: { label: 'Menstruação', icon: '🩸' },
  folicular: { label: 'Fase folicular', icon: '🌱' },
  fertil: { label: 'Período fértil', icon: '☀️' },
  ovulacao: { label: 'Ovulação', icon: '✨' },
  lutea: { label: 'Fase lútea', icon: '🌙' },
  tpm: { label: 'TPM', icon: '😣' },
};

export function getFaseAtual(config: CicloConfig, hoje: Date): { fase: FaseDetalhada; label: string; icon: string } {
  const cycleDay = cycleDayFor(config, hoje);
  const diaOvulacao = config.duracaoCiclo - FASE_LUTEA;

  let fase: FaseDetalhada;
  if (cycleDay < config.duracaoMenstruacao) fase = 'menstruacao';
  else if (cycleDay === diaOvulacao) fase = 'ovulacao';
  else if (cycleDay >= diaOvulacao - JANELA_FERTIL && cycleDay <= diaOvulacao + JANELA_FERTIL) fase = 'fertil';
  else if (cycleDay >= config.duracaoCiclo - DIAS_TPM) fase = 'tpm';
  else if (cycleDay < diaOvulacao) fase = 'folicular';
  else fase = 'lutea';

  return { fase, ...fasesDetalhadas[fase] };
}

export function getDiasParaProximaMenstruacao(config: CicloConfig, hoje: Date): number {
  const cycleDay = cycleDayFor(config, hoje);
  return config.duracaoCiclo - cycleDay;
}

export type FaseCalendario = 'menstruacao' | 'fertil' | 'ovulacao' | 'tpm' | 'regular';

export function getFaseCalendario(config: CicloConfig, date: Date): FaseCalendario {
  const { fase } = getFaseAtual(config, date);
  if (fase === 'folicular' || fase === 'lutea') return 'regular';
  return fase;
}

export const faseCalendarioCor: Record<FaseCalendario, string> = {
  menstruacao: 'bg-accent',
  fertil: 'bg-primary-light',
  ovulacao: 'bg-primary',
  tpm: 'bg-accent/20',
  regular: '',
};

export const faseCalendarioTexto: Record<FaseCalendario, string> = {
  menstruacao: 'text-white',
  fertil: 'text-white',
  ovulacao: 'text-white',
  tpm: 'text-accent-dark',
  regular: 'text-text-main',
};

export interface DiaCalendario {
  dia: number;
  fase: FaseCalendario;
}

export function getDiasDoMes(config: CicloConfig, ano: number, mes: number): DiaCalendario[] {
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dias: DiaCalendario[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    dias.push({ dia, fase: getFaseCalendario(config, new Date(ano, mes, dia)) });
  }
  return dias;
}

export function getPrimeiroDiaSemana(ano: number, mes: number): number {
  return new Date(ano, mes, 1).getDay();
}

export async function carregarCicloConfig(userId: string): Promise<CicloConfig> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}/${userId}`);
    if (!raw) return criarConfigPadrao();
    const parsed = JSON.parse(raw) as Partial<CicloConfig>;
    const padrao = criarConfigPadrao();
    return {
      duracaoCiclo: parsed.duracaoCiclo ?? padrao.duracaoCiclo,
      duracaoMenstruacao: parsed.duracaoMenstruacao ?? padrao.duracaoMenstruacao,
      ultimaMenstruacao: parsed.ultimaMenstruacao ?? padrao.ultimaMenstruacao,
    };
  } catch {
    return criarConfigPadrao();
  }
}

export async function salvarCicloConfig(userId: string, config: CicloConfig): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_PREFIX}/${userId}`, JSON.stringify(config));
}
