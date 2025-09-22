const questionAnswerPrompt = (role, experience, topicsToFocus, numberOfQuestions = 10) => `
You are an AI trained to generate technical interview questions for a ${role} position.

Candidate Experience: ${experience} years
Focus Topics: ${topicsToFocus}
Number of Questions: ${numberOfQuestions}

INSTRUCTIONS:
1. Generate exactly ${numberOfQuestions} interview questions based on the role and topics provided.
2. Return ONLY a simple numbered list of questions.
3. Each question should be on its own line, starting with a number and period.
4. Do NOT include any additional text, explanations, or formatting.
5. Ensure each question is clear, concise, and relevant to the role and topics.

REQUIRED FORMAT:
1. Question 1 here
2. Question 2 here
3. Question 3 here
... and so on for ${numberOfQuestions} questions

EXAMPLE:
1. What is the difference between let, const, and var in JavaScript?
2. Explain how prototypal inheritance works in JavaScript.
3. What are closures and how would you use them?

IMPORTANT: Your response must be EXACTLY ${numberOfQuestions} questions, nothing more, nothing less.`;

const conceptExplainPrompt = (question) => `
You are an AI trained to explain technical interview questions in a clear and beginner-friendly way.

Task:
Provide a detailed explanation of the following interview question: "${question}"

Your response must follow this exact markdown format:

# [Concept Title]

## Explanation
[2-3 sentences that clearly explain the core concept]

## Key Points
- [First key point]
- [Second key point]
- [Third key point]
(Include 3-5 bullet points)

## Code Example
\`\`\`[language]
[Relevant code example that demonstrates the concept]
\`\`\`

## Real-world Analogy
[A clear, relatable analogy that helps explain the concept]

Note:
- Use clear, concise language
- Make sure code examples are practical and well-commented
- Keep explanations focused and to-the-point
- Include only relevant information
- Format must be in markdown, do not return JSON
    "Key point 3"
  ]
}

Important: Only return valid JSON. Do not include any other text or markdown formatting outside the JSON object.`;

module.exports = { questionAnswerPrompt, conceptExplainPrompt };
