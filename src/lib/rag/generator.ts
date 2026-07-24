export interface RetrievedChunk {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
}

export interface GenerateAnswerOptions {
  clientName: string;
  systemPrompt: string;
  question: string;
  contextChunks: RetrievedChunk[];
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

interface QABlock {
  rawText: string;
  questionText: string;
  answerText: string;
}

/**
 * Generates grounded answer using Gemini LLM strictly constrained to retrieved context,
 * with bulletproof regex question-splitting and typo-tolerant section extraction fallback.
 */
export async function generateGroundedAnswer({
  clientName,
  systemPrompt,
  question,
  contextChunks,
  conversationHistory = [],
}: GenerateAnswerOptions): Promise<{ answer: string; sources: { filename: string; snippet: string }[] }> {
  const apiKey = process.env.GEMINI_API_KEY;

  const sources = contextChunks.map((chunk) => ({
    filename: chunk.metadata?.filename || 'Document',
    snippet: chunk.content.slice(0, 160) + '...',
  }));

  // Format context sources
  const formattedContext = contextChunks
    .map((chunk, i) => {
      const filename = chunk.metadata?.filename || 'Document';
      return `[Source ${i + 1} (${filename})]:\n${chunk.content}`;
    })
    .join('\n\n');

  const fullPrompt = `${systemPrompt}

BUSINESS NAME: ${clientName}

LANGUAGE INSTRUCTION:
Detect the language of the visitor's question (e.g., English, Hindi, Hinglish, Tamil, etc.) and respond in the EXACT same language as the visitor.

FORMATTING INSTRUCTION:
Use clear markdown bullet points and paragraph breaks. Provide a concise, direct answer ONLY to the user's specific question.

RETRIEVED DOCUMENT CONTEXT:
${contextChunks.length > 0 ? formattedContext : 'NO MATCHING DOCUMENTS FOUND.'}

CONVERSATION HISTORY:
${conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

VISITOR QUESTION:
${question}

ASSISTANT RESPONSE:`;

  // If a valid Gemini API Key is provided, call Gemini LLM
  if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.length > 10) {
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = data.candidates[0].content.parts[0].text;
          return {
            answer: text.trim(),
            sources,
          };
        }
      } catch (err) {
        console.warn(`[Gemini Generator Model ${modelName} error]:`, err);
      }
    }
  }

  // Bulletproof Q&A Sectioning & Typo-Tolerant Matcher Fallback
  if (contextChunks.length > 0) {
    const fullText = contextChunks.map((c) => c.content).join('\n\n');

    // 1. Split document by numbered question pattern e.g. "1. ", "2. ", "10. " OR double newlines
    const rawBlocks = fullText
      .split(/(?=\b[0-9]+\.\s+[A-Z])/g)
      .map((b) => b.trim())
      .filter((b) => b.length > 10);

    const qaBlocks: QABlock[] = rawBlocks.map((block) => {
      // Separate question line from answer content
      const qMatch = block.match(/^([0-9]+\.\s*[^?\n]+\??)([\s\S]*)$/);
      if (qMatch) {
        return {
          rawText: block,
          questionText: qMatch[1].trim(),
          answerText: qMatch[2].trim(),
        };
      }
      return {
        rawText: block,
        questionText: block.slice(0, 80),
        answerText: block,
      };
    });

    // 2. Tokenize visitor question into keywords with typo-tolerance normalization
    const qTokens = question
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let bestBlock: QABlock | null = null;
    let maxScore = -1;

    // 3. Score each Q&A block using fuzzy token matching
    for (const block of qaBlocks) {
      const searchTarget = (block.questionText + ' ' + block.answerText).toLowerCase();
      let score = 0;

      for (const token of qTokens) {
        if (searchTarget.includes(token)) {
          score += 5;
        } else {
          // Typo prefix matching (e.g. "wher" -> "where", "structur" -> "structure", "fee" -> "fees")
          const prefix = token.slice(0, Math.min(4, token.length));
          if (prefix.length >= 3 && searchTarget.includes(prefix)) {
            score += 2;
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestBlock = block;
      }
    }

    if (bestBlock) {
      let cleanAnswer = (bestBlock.answerText || bestBlock.rawText).trim();

      // Remove leading question title if present at start of answer
      cleanAnswer = cleanAnswer.replace(/^[0-9]+\.\s*[^?\n]+\??\s*/, '').trim();

      // Format inline dash bullets onto clean newlines
      cleanAnswer = cleanAnswer.replace(/\s+-\s+/g, '\n- ');

      if (cleanAnswer.length > 0) {
        return {
          answer: cleanAnswer,
          sources,
        };
      }
    }
  }

  return {
    answer: "I don't have that specific information in my documents right now. Would you like to leave your contact details so our team can follow up with you?",
    sources: [],
  };
}
