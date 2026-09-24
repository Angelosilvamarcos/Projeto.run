export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY não configurada no ambiente da aplicação."
    });
  }

  try {
    const { question, context } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Pergunta inválida." });
    }

    const safeContext = context && typeof context === "object" ? context : {};

    const system = [
      "Você é o IA Coach do ATLETAOS, um assistente de análise de treinamento de corrida.",
      "Responda em português do Brasil, de forma clara, prática e objetiva.",
      "Use somente os dados fornecidos no contexto para falar do atleta; não invente treinos, resultados, sintomas ou métricas.",
      "Explique relações entre treino anterior, volume dos últimos 7 dias, RPE, estado das pernas, sono, provas e relato pós-prova.",
      "O objetivo é apoiar a decisão e preservar a progressão, evitando aumentos bruscos de carga.",
      "Não apague, altere ou invente registros do histórico.",
      "Não substitua o professor/treinador. Quando houver dor, lesão, sintomas importantes ou sinais físicos relevantes, recomende avaliação profissional e não incentive aumento de carga.",
      "Não dê diagnóstico médico.",
      "Quando fizer uma recomendação de treino, explique primeiro quais dados do contexto levaram à recomendação.",
      "Se os dados forem insuficientes para responder com segurança, diga exatamente o que está faltando.",
      "Não trate o score de readiness como diagnóstico ou medida clínica.",
      "Estruture respostas longas com pequenos títulos e listas quando isso melhorar a leitura."
    ].join("\n");

    const model = process.env.OPENAI_MODEL || "gpt-5.6";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions: system,
        input: `PERGUNTA DO ATLETA:\n${question}\n\nCONTEXTO DO ATLETAOS:\n${JSON.stringify(safeContext)}`,
        max_output_tokens: 900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.error?.message ||
        "A API da OpenAI não conseguiu processar a pergunta.";
      return res.status(response.status).json({ error: message });
    }

    let answer = data?.output_text;

    if (!answer && Array.isArray(data?.output)) {
      answer = data.output
        .flatMap(item => Array.isArray(item?.content) ? item.content : [])
        .filter(item => item?.type === "output_text" && item?.text)
        .map(item => item.text)
        .join("\n")
        .trim();
    }

    if (!answer) {
      return res.status(502).json({
        error: "A OpenAI respondeu, mas não foi possível extrair o texto da resposta."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("IA Coach error:", error);
    return res.status(500).json({
      error: "Erro interno ao consultar a IA Coach."
    });
  }
}
