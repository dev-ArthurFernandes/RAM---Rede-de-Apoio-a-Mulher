import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Mesma ordem das perguntas em app/(app)/triagem.tsx
const TIPOS_POR_PERGUNTA = ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral'] as const;

type Risco = 'alta' | 'media' | 'nenhum';

interface TriagemPayload {
  respostas: string[];
  usuaria_id?: string;
  contato?: {
    nome?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
  };
}

function riscoDaResposta(perguntaIndex: number, resposta: string): Risco {
  const r = resposta.trim().toLowerCase();

  if (r.startsWith('não')) return 'nenhum';

  // Pergunta sobre violência sexual tem opções diferentes (Sim / Não / Prefiro não responder)
  if (perguntaIndex === 2) {
    if (r === 'sim') return 'alta';
    if (r.includes('prefiro')) return 'media';
    return 'nenhum';
  }

  if (r.includes('frequentemente')) return 'alta';
  if (r.includes('às vezes') || r.includes('as vezes') || r.includes('raramente')) return 'media';
  return 'nenhum';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: TriagemPayload = await req.json();
    const respostas = payload.respostas ?? [];

    const tiposDetectados: string[] = [];
    let prioridade: Risco = 'nenhum';

    respostas.forEach((resposta, idx) => {
      const risco = riscoDaResposta(idx, resposta ?? '');
      if (risco === 'nenhum') return;

      tiposDetectados.push(TIPOS_POR_PERGUNTA[idx]);
      if (risco === 'alta') prioridade = 'alta';
      else if (prioridade !== 'alta') prioridade = 'media';
    });

    if (tiposDetectados.length === 0) {
      return new Response(
        JSON.stringify({ risco: 'baixo', tipos_violencia: [], prioridade: null, caso: null, fila: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const nomeCompleto = payload.contato?.nome?.trim() || 'Usuária não identificada';
    const relato =
      `Caso gerado automaticamente pela triagem do app. ` +
      `Indicadores identificados: ${tiposDetectados.join(', ')}. ` +
      `Nível de prioridade: ${prioridade === 'alta' ? 'alta' : 'média'}.`;

    const { data: caso, error: casoError } = await supabase
      .from('casos_npj')
      .insert({
        usuaria_id: payload.usuaria_id ?? null,
        nome_completo: nomeCompleto,
        cpf: payload.contato?.cpf ?? null,
        telefone: payload.contato?.telefone ?? null,
        email: payload.contato?.email ?? null,
        prioridade,
        tipos_violencia: tiposDetectados,
        relato,
        origem: 'triagem_automatica',
      })
      .select('id, codigo')
      .single();

    if (casoError) throw casoError;

    const { data: fila, error: filaError } = await supabase
      .from('fila_psicologia')
      .insert({
        usuaria_id: payload.usuaria_id ?? null,
        nome_completo: nomeCompleto,
        tipo_violencia: tiposDetectados.join(', '),
        prioridade,
        origem: 'triagem_automatica',
      })
      .select('id, codigo')
      .single();

    if (filaError) throw filaError;

    return new Response(
      JSON.stringify({ risco: prioridade, tipos_violencia: tiposDetectados, prioridade, caso, fila }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
