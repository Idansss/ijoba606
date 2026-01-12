/**
 * AI Question Generation Helper
 * 
 * This module provides functions to generate quiz questions using AI.
 * Supports OpenAI API and Google Gemini API.
 */

import { z } from 'zod';

// Define types locally to avoid import issues
export type QuizLevel = 1 | 2 | 3;
export type QuestionType = 'single' | 'multi';

export interface Question {
  id?: string;
  level: QuizLevel;
  type: QuestionType;
  prompt: string;
  topic?: string;
  options: [string, string, string, string];
  correct: number[]; // indices of correct options
  explanation?: string;
  tags?: string[];
}

const QuestionGenerationSchema = z.object({
  level: z.number().int().min(1).max(3),
  topic: z.string().optional(),
  count: z.number().int().min(1).max(10).default(1),
});

export interface GenerateQuestionRequest {
  level: QuizLevel;
  topic?: string;
  count?: number;
  apiKey?: string; // Optional - can be passed from function secrets
}

export interface GenerateQuestionResponse {
  questions: Omit<Question, 'id'>[];
}

/**
 * Generate questions using OpenAI API
 */
export async function generateQuestionsWithOpenAI(
  request: GenerateQuestionRequest
): Promise<GenerateQuestionResponse> {
  // Use passed apiKey or fallback to environment variable
  const apiKey = request.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Set it via: firebase functions:secrets:set OPENAI_API_KEY');
  }

  const validated = QuestionGenerationSchema.parse({
    level: request.level,
    topic: request.topic,
    count: request.count || 1,
  });

  const levelDescriptions: Record<1 | 2 | 3, string> = {
    1: 'basic concepts and definitions',
    2: 'intermediate calculations and deductions',
    3: 'advanced scenarios and complex tax situations',
  };

  const levelKey = validated.level as 1 | 2 | 3;
  const prompt = `Generate ${validated.count} multiple-choice quiz question(s) about PAYE (Pay As You Earn) tax in Nigeria.

Level: ${validated.level} (${levelDescriptions[levelKey]})
${validated.topic ? `Topic: ${validated.topic}` : ''}

Requirements:
- Each question must have exactly 4 options
- Questions can be single-answer (correct: [0]) or multi-answer (correct: [0, 2])
- Include a clear explanation
- Make questions practical and relevant to Nigerian PAYE system
- Use Nigerian Naira (₦) currency
- Questions should test understanding, not just memorization

Return a JSON array with this exact structure:
[
  {
    "level": ${validated.level},
    "type": "single" or "multi",
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": [0] or [0, 2] (array of correct option indices),
    "explanation": "Clear explanation of the answer",
    "tags": ["tag1", "tag2"]
  }
]

Only return the JSON array, no other text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or 'gpt-4' for better quality
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Nigerian tax law, specifically PAYE (Pay As You Earn) taxation. Generate accurate, educational quiz questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    let questions: Omit<Question, 'id'>[];
    try {
      const parsed = JSON.parse(content);
      // OpenAI might wrap in an object with a "questions" key
      questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    // Validate questions
    const validatedQuestions: Omit<Question, 'id'>[] = questions.map((q) => {
      // Ensure correct format
      const optionsArray = Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['', '', '', ''];
      
      return {
        level: validated.level as QuizLevel,
        type: (q.type === 'single' || q.type === 'multi' ? q.type : 'single') as QuestionType,
        prompt: q.prompt || '',
        options: [optionsArray[0] || '', optionsArray[1] || '', optionsArray[2] || '', optionsArray[3] || ''] as [string, string, string, string],
        correct: Array.isArray(q.correct) ? q.correct : [0],
        explanation: q.explanation || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
        topic: q.topic || validated.topic,
      };
    });

    return { questions: validatedQuestions };
  } catch (error) {
    console.error('Error generating questions with OpenAI:', error);
    throw error;
  }
}

/**
 * Generate questions using a fallback method (template-based)
 * This can be used if AI API is not available
 */
/**
 * Generate questions using Google Gemini API
 */
export async function generateQuestionsWithGemini(
  request: GenerateQuestionRequest
): Promise<GenerateQuestionResponse> {
  // Use passed apiKey or fallback to environment variable
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Set it via: firebase functions:secrets:set GEMINI_API_KEY');
  }

  const validated = QuestionGenerationSchema.parse({
    level: request.level,
    topic: request.topic,
    count: request.count || 1,
  });

  const levelKey = validated.level as 1 | 2 | 3;
  const levelDescriptions: Record<1 | 2 | 3, string> = {
    1: 'basic concepts and definitions',
    2: 'intermediate calculations and deductions',
    3: 'advanced scenarios and complex tax situations',
  };

  const prompt = `Generate ${validated.count} multiple-choice quiz question(s) about PAYE (Pay As You Earn) tax in Nigeria.

Level: ${validated.level} (${levelDescriptions[levelKey]})
${validated.topic ? `Topic: ${validated.topic}` : ''}

Requirements:
- Each question must have exactly 4 options
- Questions can be single-answer (correct: [0]) or multi-answer (correct: [0, 2])
- Include a clear explanation
- Make questions practical and relevant to Nigerian PAYE system
- Use Nigerian Naira (₦) currency
- Questions should test understanding, not just memorization

Return a JSON array with this exact structure:
[
  {
    "level": ${validated.level},
    "type": "single" or "multi",
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": [0] or [0, 2] (array of correct option indices),
    "explanation": "Clear explanation of the answer",
    "tags": ["tag1", "tag2"]
  }
]

Only return the JSON array, no other text.`;

  try {
    // Use Gemini API (REST)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert in Nigerian tax law, specifically PAYE (Pay As You Earn) taxation. Generate accurate, educational quiz questions.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in Gemini response');
    }

    // Parse the JSON response
    let questions: Omit<Question, 'id'>[];
    try {
      const parsed = JSON.parse(content);
      questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    // Validate questions
    const validatedQuestions: Omit<Question, 'id'>[] = questions.map((q: any) => {
      const optionsArray = Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['', '', '', ''];
      
      return {
        level: validated.level as QuizLevel,
        type: (q.type === 'single' || q.type === 'multi' ? q.type : 'single') as QuestionType,
        prompt: q.prompt || '',
        options: [optionsArray[0] || '', optionsArray[1] || '', optionsArray[2] || '', optionsArray[3] || ''] as [string, string, string, string],
        correct: Array.isArray(q.correct) ? q.correct : [0],
        explanation: q.explanation || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
        topic: q.topic || validated.topic,
      };
    });

    return { questions: validatedQuestions };
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    throw error;
  }
}

/**
 * Generate questions using template-based fallback
 */
export function generateQuestionsFromTemplate(
  request: GenerateQuestionRequest
): GenerateQuestionResponse {
  // This is a simple template-based generator as fallback
  // You can expand this with more templates
  const templates: Omit<Question, 'id'>[] = [
    {
      level: 1 as QuizLevel,
      type: 'single' as QuestionType,
      prompt: 'What is the personal allowance for PAYE in Nigeria?',
      options: [
        '₦200,000 per year',
        '₦300,000 per year',
        '₦500,000 per year',
        'No personal allowance'
      ] as [string, string, string, string],
      correct: [0],
      explanation: 'The personal allowance in Nigeria is typically ₦200,000 per year.',
      tags: ['basics', 'allowance'],
    },
    // Add more templates as needed
  ];

  const matchingTemplates = templates.filter(t => t.level === request.level);
  const selected = matchingTemplates.slice(0, request.count || 1);

  return {
    questions: selected.map(t => ({
      ...t,
      topic: request.topic,
    })),
  };
}
