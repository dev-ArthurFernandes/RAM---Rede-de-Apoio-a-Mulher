import { supabase } from './supabase';

export type CasoStatus = 'pendente' | 'em_atendimento' | 'encerrado';
export type PrioridadeNivel = 'alta' | 'media' | 'baixa';

export interface CasoNpj {
  id: string;
  codigo: string;
  usuaria_id: string | null;
  nome_completo: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  status: CasoStatus;
  prioridade: PrioridadeNivel;
  tipos_violencia: string[];
  relato: string | null;
  data_incidente: string | null;
  aluno_responsavel_id: string | null;
  origem: 'triagem_automatica' | 'manual';
  created_at: string;
}

export interface FilaPsicologia {
  id: string;
  codigo: string;
  usuaria_id: string | null;
  nome_completo: string;
  tipo_violencia: string | null;
  prioridade: PrioridadeNivel;
  status: CasoStatus;
  profissional_id: string | null;
  origem: 'triagem_automatica' | 'manual';
  created_at: string;
}

export interface MensagemChat {
  id: string;
  fila_id: string;
  autor_id: string | null;
  autor_tipo: 'usuaria' | 'profissional';
  conteudo: string;
  created_at: string;
}

export interface PerfilResumo {
  id: string;
  nome: string;
}

export const statusLabel: Record<CasoStatus, string> = {
  pendente: 'Pendente',
  em_atendimento: 'Em Atendimento',
  encerrado: 'Encerrado',
};

export const statusColor: Record<CasoStatus, string> = {
  pendente: 'bg-orange-100 text-orange-700',
  em_atendimento: 'bg-blue-100 text-blue-700',
  encerrado: 'bg-gray-100 text-gray-700',
};

export const prioridadeLabel: Record<PrioridadeNivel, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const prioridadeColor: Record<PrioridadeNivel, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-gray-100 text-gray-700',
};

export const prioridades: PrioridadeNivel[] = ['alta', 'media', 'baixa'];

export const tiposViolencia = ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral'];

export const tipoColor: Record<string, string> = {
  Física: 'bg-red-100 text-red-700',
  Psicológica: 'bg-pink-100 text-pink-700',
  Sexual: 'bg-purple-100 text-purple-700',
  Patrimonial: 'bg-yellow-100 text-yellow-700',
  Moral: 'bg-orange-100 text-orange-700',
};

export function formatDataBR(iso: string | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function parseDataBR(valor: string): string | null {
  const match = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
}

export function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ---- Casos NPJ ----

export async function fetchCasosNpj(): Promise<CasoNpj[]> {
  const { data, error } = await supabase
    .from('casos_npj')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CasoNpj[];
}

export interface NovaFichaInput {
  nome_completo: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  data_incidente: string | null;
  tipos_violencia: string[];
  relato: string | null;
  prioridade: PrioridadeNivel;
}

export async function criarCasoNpj(input: NovaFichaInput): Promise<CasoNpj> {
  const { data, error } = await supabase
    .from('casos_npj')
    .insert({ ...input, origem: 'manual' })
    .select()
    .single();
  if (error) throw error;
  return data as CasoNpj;
}

export async function atribuirAlunoCaso(casoId: string, alunoId: string): Promise<void> {
  const { error } = await supabase.from('casos_npj').update({ aluno_responsavel_id: alunoId }).eq('id', casoId);
  if (error) throw error;
}

export async function atualizarStatusCaso(casoId: string, status: CasoStatus): Promise<void> {
  const { error } = await supabase.from('casos_npj').update({ status }).eq('id', casoId);
  if (error) throw error;
}

// ---- Fila de Psicologia ----

export async function fetchFilaPsicologia(): Promise<FilaPsicologia[]> {
  const { data, error } = await supabase
    .from('fila_psicologia')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as FilaPsicologia[];
}

export interface NovaSolicitacaoInput {
  nome_completo: string;
  tipo_violencia: string | null;
  prioridade: PrioridadeNivel;
}

export async function criarSolicitacaoPsicologia(input: NovaSolicitacaoInput): Promise<FilaPsicologia> {
  const { data, error } = await supabase
    .from('fila_psicologia')
    .insert({ ...input, origem: 'manual' })
    .select()
    .single();
  if (error) throw error;
  return data as FilaPsicologia;
}

export async function atualizarStatusFila(filaId: string, status: CasoStatus): Promise<void> {
  const { error } = await supabase.from('fila_psicologia').update({ status }).eq('id', filaId);
  if (error) throw error;
}

// ---- Mensagens de chat ----

export async function fetchMensagens(filaId: string): Promise<MensagemChat[]> {
  const { data, error } = await supabase
    .from('mensagens_chat')
    .select('*')
    .eq('fila_id', filaId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as MensagemChat[];
}

export async function enviarMensagem(filaId: string, autorId: string, conteudo: string): Promise<MensagemChat> {
  const { data, error } = await supabase
    .from('mensagens_chat')
    .insert({ fila_id: filaId, autor_id: autorId, autor_tipo: 'profissional', conteudo })
    .select()
    .single();
  if (error) throw error;
  return data as MensagemChat;
}

// ---- Perfis de estudantes ----

export async function fetchEstudantes(tipo: 'estudante_direito' | 'estudante_psicologia'): Promise<PerfilResumo[]> {
  const { data, error } = await supabase.from('profiles').select('id, nome').eq('tipo', tipo).order('nome');
  if (error) throw error;
  return data as PerfilResumo[];
}
