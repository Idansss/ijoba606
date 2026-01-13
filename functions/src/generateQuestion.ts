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
  const prompt = `You MUST generate exactly ${validated.count} multiple-choice quiz question(s) about PAYE (Pay As You Earn) tax in Nigeria. Return ALL ${validated.count} questions in the JSON array.

Level: ${validated.level} (${levelDescriptions[levelKey]})
${validated.topic && validated.topic.trim() ? `Topic: ${validated.topic}` : 'Topic: General PAYE concepts (no specific topic required - generate diverse questions covering various aspects)'}

Requirements:
- Generate EXACTLY ${validated.count} questions (not just one)
- Each question must have exactly 4 options
- Questions can be single-answer (correct: [0]) or multi-answer (correct: [0, 2])
- Include a clear explanation for each question
- Make questions practical and relevant to Nigerian PAYE system
- Use Nigerian Naira (₦) currency
- Questions should test understanding, not just memorization
- Vary the questions to cover different aspects of the topic

Return a JSON array with EXACTLY ${validated.count} question objects in this structure:
[
  {
    "level": ${validated.level},
    "type": "single" or "multi",
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": [0] or [0, 2] (array of correct option indices),
    "explanation": "Clear explanation of the answer",
    "tags": ["tag1", "tag2"]
  },
  ... (repeat for all ${validated.count} questions)
]

IMPORTANT: Return exactly ${validated.count} questions in the array. Only return the JSON array, no other text.`;

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
            content: 'You are an expert in Nigerian tax law, specifically PAYE (Pay As You Earn) taxation. Generate accurate, educational quiz questions. ALWAYS return a JSON array of questions, never a single object. If asked for multiple questions, return ALL of them in the array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9, // Higher temperature for more variety
        // Don't use json_object format - we need arrays
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
      // OpenAI might wrap in an object with a "questions" key, or return array directly
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        questions = parsed.data;
      } else {
        // If it's a single object, wrap it in an array
        questions = [parsed];
      }
      
      // Ensure we have the requested count (if AI returned fewer, log a warning)
      if (questions.length < validated.count) {
        console.warn(`OpenAI returned ${questions.length} questions but ${validated.count} were requested`);
      }
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[1]);
        if (Array.isArray(extracted)) {
          questions = extracted;
        } else if (extracted.questions && Array.isArray(extracted.questions)) {
          questions = extracted.questions;
        } else {
          questions = [extracted];
        }
        if (questions.length < validated.count) {
          console.warn(`OpenAI returned ${questions.length} questions but ${validated.count} were requested`);
        }
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
      
      // Build question object, only including topic if it has a value
      const questionObj: any = {
        level: validated.level as QuizLevel,
        type: (q.type === 'single' || q.type === 'multi' ? q.type : 'single') as QuestionType,
        prompt: q.prompt || '',
        options: [optionsArray[0] || '', optionsArray[1] || '', optionsArray[2] || '', optionsArray[3] || ''] as [string, string, string, string],
        correct: Array.isArray(q.correct) ? q.correct : [0],
        explanation: q.explanation || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
      };
      
      // Only add topic if it exists (not undefined or empty)
      const topicValue = q.topic || validated.topic;
      if (topicValue && topicValue.trim()) {
        questionObj.topic = topicValue.trim();
      }
      
      return questionObj;
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

  const prompt = `You MUST generate exactly ${validated.count} multiple-choice quiz question(s) about PAYE (Pay As You Earn) tax in Nigeria. Return ALL ${validated.count} questions in the JSON array.

Level: ${validated.level} (${levelDescriptions[levelKey]})
${validated.topic ? `Topic: ${validated.topic}` : 'Topic: General PAYE concepts (no specific topic required)'}

Requirements:
- Generate EXACTLY ${validated.count} questions (not just one)
- Each question must have exactly 4 options
- Questions can be single-answer (correct: [0]) or multi-answer (correct: [0, 2])
- Include a clear explanation for each question
- Make questions practical and relevant to Nigerian PAYE system
- Use Nigerian Naira (₦) currency
- Questions should test understanding, not just memorization
- Vary the questions to cover different aspects${validated.topic ? ` of ${validated.topic}` : ' of PAYE'}

Return a JSON array with EXACTLY ${validated.count} question objects in this structure:
[
  {
    "level": ${validated.level},
    "type": "single" or "multi",
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": [0] or [0, 2] (array of correct option indices),
    "explanation": "Clear explanation of the answer",
    "tags": ["tag1", "tag2"]
  },
  ... (repeat for all ${validated.count} questions)
]

IMPORTANT: Return exactly ${validated.count} questions in the array. Only return the JSON array, no other text.`;

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
      
      // Ensure we have the requested count (if AI returned fewer, log a warning)
      if (questions.length < validated.count) {
        console.warn(`Gemini returned ${questions.length} questions but ${validated.count} were requested`);
      }
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
        if (questions.length < validated.count) {
          console.warn(`Gemini returned ${questions.length} questions but ${validated.count} were requested`);
        }
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    // Validate questions
    const validatedQuestions: Omit<Question, 'id'>[] = questions.map((q: any) => {
      const optionsArray = Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['', '', '', ''];
      
      // Build question object, only including topic if it has a value
      const questionObj: any = {
        level: validated.level as QuizLevel,
        type: (q.type === 'single' || q.type === 'multi' ? q.type : 'single') as QuestionType,
        prompt: q.prompt || '',
        options: [optionsArray[0] || '', optionsArray[1] || '', optionsArray[2] || '', optionsArray[3] || ''] as [string, string, string, string],
        correct: Array.isArray(q.correct) ? q.correct : [0],
        explanation: q.explanation || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
      };
      
      // Only add topic if it exists (not undefined or empty)
      const topicValue = q.topic || validated.topic;
      if (topicValue && topicValue.trim()) {
        questionObj.topic = topicValue.trim();
      }
      
      return questionObj;
    });

    return { questions: validatedQuestions };
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    throw error;
  }
}

/**
 * Generate questions using Cursor AI API
 * Note: Cursor AI integration requires API key setup
 */
export async function generateQuestionsWithCursor(
  request: GenerateQuestionRequest
): Promise<GenerateQuestionResponse> {
  // Use passed apiKey or fallback to environment variable
  const apiKey = request.apiKey || process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error('CURSOR_API_KEY is not set. Set it via: firebase functions:secrets:set CURSOR_API_KEY');
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

  const prompt = `You MUST generate exactly ${validated.count} multiple-choice quiz question(s) about PAYE (Pay As You Earn) tax in Nigeria. Return ALL ${validated.count} questions in the JSON array.

Level: ${validated.level} (${levelDescriptions[levelKey]})
${validated.topic ? `Topic: ${validated.topic}` : 'Topic: General PAYE concepts (no specific topic required)'}

Requirements:
- Generate EXACTLY ${validated.count} questions (not just one)
- Each question must have exactly 4 options
- Questions can be single-answer (correct: [0]) or multi-answer (correct: [0, 2])
- Include a clear explanation for each question
- Make questions practical and relevant to Nigerian PAYE system
- Use Nigerian Naira (₦) currency
- Questions should test understanding, not just memorization
- Vary the questions to cover different aspects${validated.topic ? ` of ${validated.topic}` : ' of PAYE'}

Return a JSON array with EXACTLY ${validated.count} question objects in this structure:
[
  {
    "level": ${validated.level},
    "type": "single" or "multi",
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": [0] or [0, 2] (array of correct option indices),
    "explanation": "Clear explanation of the answer",
    "tags": ["tag1", "tag2"]
  },
  ... (repeat for all ${validated.count} questions)
]

IMPORTANT: Return exactly ${validated.count} questions in the array. Only return the JSON array, no other text.`;

  try {
    // Cursor AI API endpoint
    // Base URL: https://api.cursor.com
    // Note: Cursor may use OpenAI-compatible endpoints or have custom structure
    // If using OpenAI-compatible: https://api.cursor.com/v1/chat/completions
    const apiUrl = process.env.CURSOR_API_URL || 'https://api.cursor.com/v1/chat/completions';
    const model = process.env.CURSOR_MODEL || 'gpt-4'; // Default model, update based on Cursor's available models
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Nigerian tax law, specifically PAYE (Pay As You Earn) taxation. Generate accurate, educational quiz questions. Always return valid JSON in the specified format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9, // Higher temperature for more variety
        // Remove json_object format to allow arrays - wrap in object if needed
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cursor API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Cursor API response');
    }

    // Parse the JSON response
    let questions: Omit<Question, 'id'>[];
    try {
      const parsed = JSON.parse(content);
      questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      
      // Ensure we have the requested count (if AI returned fewer, log a warning)
      if (questions.length < validated.count) {
        console.warn(`Cursor returned ${questions.length} questions but ${validated.count} were requested`);
      }
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
        if (questions.length < validated.count) {
          console.warn(`Cursor returned ${questions.length} questions but ${validated.count} were requested`);
        }
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    // Validate questions
    const validatedQuestions: Omit<Question, 'id'>[] = questions.map((q: any) => {
      const optionsArray = Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['', '', '', ''];
      
      // Build question object, only including topic if it has a value
      const questionObj: any = {
        level: validated.level as QuizLevel,
        type: (q.type === 'single' || q.type === 'multi' ? q.type : 'single') as QuestionType,
        prompt: q.prompt || '',
        options: [optionsArray[0] || '', optionsArray[1] || '', optionsArray[2] || '', optionsArray[3] || ''] as [string, string, string, string],
        correct: Array.isArray(q.correct) ? q.correct : [0],
        explanation: q.explanation || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
      };
      
      // Only add topic if it exists (not undefined or empty)
      const topicValue = q.topic || validated.topic;
      if (topicValue && topicValue.trim()) {
        questionObj.topic = topicValue.trim();
      }
      
      return questionObj;
    });

    return { questions: validatedQuestions };
  } catch (error) {
    console.error('Error generating questions with Cursor:', error);
    throw error;
  }
}

/**
 * Generate questions using template-based fallback
 */
export function generateQuestionsFromTemplate(
  request: GenerateQuestionRequest
): GenerateQuestionResponse {
  const validated = QuestionGenerationSchema.parse({
    level: request.level,
    topic: request.topic,
    count: request.count || 1,
  });

  const level = validated.level;
  const count = validated.count;
  
  // Generate questions dynamically based on level
  const questions: Omit<Question, 'id'>[] = [];
  
  const levelTemplates: Record<1 | 2 | 3, Array<Omit<Question, 'id'>>> = {
    1: [
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
      {
        level: 1 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'What does PAYE stand for?',
        options: [
          'Pay As You Earn',
          'Pay After Year End',
          'Personal Annual Yearly Earnings',
          'Progressive Annual Yearly Estimate'
        ] as [string, string, string, string],
        correct: [0],
        explanation: 'PAYE stands for Pay As You Earn, a method of collecting income tax from employees.',
        tags: ['basics', 'definition'],
      },
      {
        level: 1 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'Who is responsible for deducting PAYE tax?',
        options: [
          'The employee',
          'The employer',
          'The tax authority',
          'The bank'
        ] as [string, string, string, string],
        correct: [1],
        explanation: 'The employer is responsible for deducting PAYE tax from employees\' salaries.',
        tags: ['basics', 'employer'],
      },
    ],
    2: [
      {
        level: 2 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'What is the tax rate for income between ₦300,000 and ₦600,000 in Nigeria?',
        options: [
          '7%',
          '11%',
          '15%',
          '19%'
        ] as [string, string, string, string],
        correct: [1],
        explanation: 'Income between ₦300,000 and ₦600,000 is taxed at 11% in Nigeria.',
        tags: ['intermediate', 'tax-rates'],
      },
      {
        level: 2 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'What percentage of gross income is typically used for Consolidated Relief Allowance (CRA)?',
        options: [
          '1% or ₦200,000, whichever is higher, plus 20%',
          '5% or ₦100,000, whichever is higher',
          '10% of gross income',
          '15% of gross income'
        ] as [string, string, string, string],
        correct: [0],
        explanation: 'CRA is calculated as ₦200,000 or 1% of gross income (whichever is higher), plus 20% of gross income.',
        tags: ['intermediate', 'allowances', 'CRA'],
      },
      {
        level: 2 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'If an employee earns ₦500,000 annually, what is their taxable income after CRA?',
        options: [
          '₦200,000',
          '₦300,000',
          '₦400,000',
          '₦500,000'
        ] as [string, string, string, string],
        correct: [1],
        explanation: 'CRA = max(₦200,000, 1% of ₦500,000) + 20% of ₦500,000 = ₦200,000 + ₦100,000 = ₦300,000. Taxable income = ₦500,000 - ₦300,000 = ₦200,000.',
        tags: ['intermediate', 'calculations'],
      },
    ],
    3: [
      {
        level: 3 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'What is the highest tax bracket rate for personal income tax in Nigeria?',
        options: [
          '19%',
          '21%',
          '24%',
          '30%'
        ] as [string, string, string, string],
        correct: [2],
        explanation: 'The highest tax bracket in Nigeria is 24% for income above ₦3,200,000 annually.',
        tags: ['advanced', 'tax-brackets'],
      },
      {
        level: 3 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'How is PAYE calculated for an employee with multiple income sources?',
        options: [
          'Only the primary income is taxed',
          'All income sources are combined and taxed together',
          'Each source is taxed separately',
          'Only the highest income source is taxed'
        ] as [string, string, string, string],
        correct: [1],
        explanation: 'All income sources are combined to determine the total taxable income, which is then taxed according to the progressive tax brackets.',
        tags: ['advanced', 'multiple-income'],
      },
      {
        level: 3 as QuizLevel,
        type: 'single' as QuestionType,
        prompt: 'What happens if an employer fails to remit PAYE deductions to the tax authority?',
        options: [
          'Nothing, it\'s optional',
          'The employee is responsible',
          'The employer faces penalties and interest',
          'Only a warning is issued'
        ] as [string, string, string, string],
        correct: [2],
        explanation: 'Employers who fail to remit PAYE deductions face penalties, interest charges, and potential legal action from the tax authority.',
        tags: ['advanced', 'compliance', 'penalties'],
      },
    ],
  };

  // Get templates for the requested level
  const availableTemplates = levelTemplates[level as 1 | 2 | 3] || levelTemplates[1];
  
  // Generate the requested number of questions by cycling through templates
  for (let i = 0; i < count; i++) {
    const template = availableTemplates[i % availableTemplates.length];
    const questionObj: any = {
      ...template,
      // Create variation by adding index to make questions unique
      prompt: i > 0 ? `${template.prompt} (Question ${i + 1})` : template.prompt,
    };
    
    // Only include topic if it has a value
    if (validated.topic && validated.topic.trim()) {
      questionObj.topic = validated.topic.trim();
    }
    
    questions.push(questionObj);
  }

  return {
    questions,
  };
}
