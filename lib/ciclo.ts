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

export function cycleDayDentroDaMenstruacao(config: CicloConfig, date: Date): boolean {
  return cycleDayFor(config, date) < config.duracaoMenstruacao;
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

export type FaseCalendario =
  | 'menstruacao-registrada'
  | 'menstruacao-prevista'
  | 'fertil'
  | 'ovulacao'
  | 'tpm'
  | 'regular';

export function getFaseCalendario(config: CicloConfig, date: Date, hoje: Date): FaseCalendario {
  const { fase } = getFaseAtual(config, date);
  if (fase === 'folicular' || fase === 'lutea') return 'regular';
  if (fase === 'menstruacao') return diffInDays(date, hoje) <= 0 ? 'menstruacao-registrada' : 'menstruacao-prevista';
  return fase;
}

export const faseCalendarioCor: Record<FaseCalendario, string> = {
  'menstruacao-registrada': 'bg-accent-dark',
  'menstruacao-prevista': 'bg-accent/30',
  fertil: 'bg-primary-light',
  ovulacao: 'bg-primary',
  tpm: 'bg-rose-100',
  regular: '',
};

export const faseCalendarioTexto: Record<FaseCalendario, string> = {
  'menstruacao-registrada': 'text-white',
  'menstruacao-prevista': 'text-accent-dark',
  fertil: 'text-white',
  ovulacao: 'text-white',
  tpm: 'text-rose-600',
  regular: 'text-text-main',
};

export interface DiaCalendario {
  dia: number;
  fase: FaseCalendario;
}

export function getDiasDoMes(config: CicloConfig, ano: number, mes: number, hoje: Date): DiaCalendario[] {
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dias: DiaCalendario[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    dias.push({ dia, fase: getFaseCalendario(config, new Date(ano, mes, dia), hoje) });
  }
  return dias;
}

export interface PrevisaoCiclo {
  inicio: string;
  fim: string;
  ovulacao: string;
  duracaoMenstruacao: number;
}

export function getPrevisoesCiclos(config: CicloConfig, quantidade = 3): PrevisaoCiclo[] {
  const anchor = fromISODate(config.ultimaMenstruacao);
  const diaOvulacao = config.duracaoCiclo - FASE_LUTEA;
  const previsoes: PrevisaoCiclo[] = [];

  for (let n = 1; n <= quantidade; n++) {
    const inicio = addDays(anchor, n * config.duracaoCiclo);
    const fim = addDays(inicio, config.duracaoMenstruacao - 1);
    const ovulacao = addDays(inicio, diaOvulacao);
    previsoes.push({
      inicio: toISODate(inicio),
      fim: toISODate(fim),
      ovulacao: toISODate(ovulacao),
      duracaoMenstruacao: config.duracaoMenstruacao,
    });
  }

  return previsoes;
}

export type HumorTipo = 'otimo' | 'bem' | 'normal' | 'mal' | 'pessimo';

export const HUMORES: { key: HumorTipo; label: string; icon: string; color: string }[] = [
  { key: 'otimo', label: 'Ótimo', icon: '😄', color: 'text-green-600' },
  { key: 'bem', label: 'Bem', icon: '🙂', color: 'text-green-500' },
  { key: 'normal', label: 'Normal', icon: '😐', color: 'text-yellow-600' },
  { key: 'mal', label: 'Mal', icon: '🙁', color: 'text-orange-500' },
  { key: 'pessimo', label: 'Péssimo', icon: '😣', color: 'text-red-600' },
];

export const SINTOMAS: { key: string; label: string; icon: string }[] = [
  { key: 'colica', label: 'Cólica', icon: '⚡' },
  { key: 'dor_cabeca', label: 'Dor de cabeça', icon: '🤕' },
  { key: 'inchaco', label: 'Inchaço', icon: '🫧' },
  { key: 'cansaco', label: 'Cansaço', icon: '😴' },
  { key: 'acne', label: 'Acne', icon: '🔴' },
  { key: 'sensibilidade_seios', label: 'Sensib. seios', icon: '💗' },
];

export interface RegistroDia {
  menstruada: boolean;
  humor: HumorTipo | null;
  sintomas: string[];
}

function registroPadrao(): RegistroDia {
  return { menstruada: false, humor: null, sintomas: [] };
}

const STORAGE_PREFIX_REGISTRO = '@ram/ciclo-registro';

export async function carregarRegistroDia(userId: string, dataISO: string): Promise<RegistroDia> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX_REGISTRO}/${userId}/${dataISO}`);
    if (!raw) return registroPadrao();
    return { ...registroPadrao(), ...JSON.parse(raw) } as RegistroDia;
  } catch {
    return registroPadrao();
  }
}

export async function salvarRegistroDia(userId: string, dataISO: string, registro: RegistroDia): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_PREFIX_REGISTRO}/${userId}/${dataISO}`, JSON.stringify(registro));
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
