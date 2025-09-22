const axios = require('axios');
const AICache = require('../utils/aiCache');
const { questionAnswerPrompt, conceptExplainPrompt } = require("../utils/prompts");

// Check API key
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is not configured');
}

// Using a stable Gemini model
const GEMINI_MODEL_NAME = 'gemini-1.5-flash-latest'; // Using the latest flash model
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent`;

// Rate limiting configuration - more conservative settings
const RATE_LIMIT_CONFIG = {
    maxRetries: 2,                  // Reduced to 2 retries
    initialDelay: 3000,             // Start with 3s delay
    maxDelay: 30000,                // Max 30s delay
    jitter: 0.5,                    // 50% jitter
    statusCodesToRetry: [429, 500, 502, 503, 504],
    shouldRetry: (error) => {
        if (error.response?.status === 429) {
            const retryAfter = error.response?.headers?.['retry-after'] || 30;
            console.log(`Rate limited. Waiting ${retryAfter} seconds before retry.`);
            // Add the retry-after header to the error for the client
            error.retryAfter = retryAfter;
            return true;
        }
        // Only retry on network errors or 5xx server errors
        if (!error.response) return true;
        return error.response.status >= 500 && error.response.status < 600;
    }
};

// Helper function to call Gemini API with improved error handling
async function callGeminiAPI(prompt, requestId = Date.now()) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Enhanced API key validation
    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY is not set in environment variables');
        error.statusCode = 500;
        error.code = 'MISSING_API_KEY';
        error.isOperational = true;
        console.error(`[${requestId}] Error: ${error.message}`);
        throw error;
    }
    
    // More permissive API key validation
    if (typeof apiKey !== 'string' || apiKey.length < 30) {
        const error = new Error('Invalid GEMINI_API_KEY format');
        error.statusCode = 500;
        error.code = 'INVALID_API_KEY';
        error.isOperational = true;
        console.error(`[${requestId}] Error: ${error.message}. Key length: ${apiKey.length}`);
        throw error;
    }

    // Prepare the request data with optimized settings
    const requestData = {
        contents: [{
            role: 'user',
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,       // More focused and deterministic
            topK: 40,              // Limit to top 40 tokens
            topP: 0.95,            // 95% probability mass
            maxOutputTokens: 1024,  // Reduced from 2048 to save tokens
            responseMimeType: 'text/plain',
        },
        // Single safety settings block to avoid conflicts
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'  // More permissive than BLOCK_ONLY_HIGH
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
        ]
    };
    
    // Log request details (without sensitive data)
    console.log(`[${requestId}] Sending request to Gemini API (model: ${GEMINI_MODEL_NAME})`);
    console.log(`[${requestId}] Prompt length: ${prompt.length} characters`);
    
    try {
        const startTime = Date.now();
        const response = await axios({
            method: 'post',
            url: GEMINI_API_URL,
            params: { key: apiKey },
            data: requestData,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds timeout
            validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`[${requestId}] Request completed in ${responseTime}ms`);
        
        // Check for a valid response, otherwise throw an error
        const candidate = response.data?.candidates?.[0];
        if (!candidate) {
            console.error(`[${requestId}] Invalid response structure: 'candidates' array is missing or empty`, JSON.stringify(response.data, null, 2));
            const error = new Error('Invalid response structure from Gemini API');
            error.statusCode = 500;
            error.code = 'INVALID_RESPONSE';
            error.response = response.data;
            throw error;
        }

        // If the model finished for a reason other than "STOP", it indicates a problem
        if (candidate.finishReason !== 'STOP') {
            console.error(`[${requestId}] AI model finished with reason: ${candidate.finishReason}`, JSON.stringify(candidate, null, 2));
            const error = new Error(`AI model failed: ${candidate.finishReason}`);
            error.statusCode = 500;
            error.code = `AI_ERROR_${candidate.finishReason}`;
            error.response = response.data;
            throw error;
        }

        // Check for the actual content
        const responseText = candidate.content?.parts?.[0]?.text;
        if (typeof responseText !== 'string') {
            console.error(`[${requestId}] Unexpected response structure: text content is missing`, JSON.stringify(response.data, null, 2));
            const error = new Error('Unexpected response structure from Gemini API');
            error.statusCode = 500;
            error.code = 'INVALID_RESPONSE';
            error.response = response.data;
            throw error;
        }
        
        return responseText;
        
    } catch (error) {
        // Enhanced error handling
        const errorInfo = {
            timestamp: new Date().toISOString(),
            requestId,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                response: error.response?.data
            },
            request: {
                url: GEMINI_API_URL,
                method: 'post',
                headers: error.config?.headers,
                data: error.config?.data ? JSON.parse(error.config.data) : undefined
            }
        };
        
        // Log the detailed error
        console.error(`[${requestId}] Gemini API Error:`, JSON.stringify(errorInfo, null, 2));
        
        // Create a more user-friendly error
        const apiError = new Error(error.response?.data?.error?.message || error.message);
        apiError.statusCode = error.response?.status || 500;
        apiError.code = error.code || 'GEMINI_API_ERROR';
        apiError.isOperational = true;
        
        // Handle quota exceeded error
        if (error.response?.status === 429) {
            apiError.retryAfter = error.response.headers?.['retry-after'] || 60;
            apiError.message = `Daily API quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or upgrade your plan.`;
            apiError.isQuotaExceeded = true;
        }
        
        throw apiError;
    }
}

/**
 * Calculate delay with jitter for retries
 */
function calculateDelay(attempt, baseDelay, maxDelay, jitter) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitterAmount = delay * jitter * Math.random();
    return delay + jitterAmount;
}

/**
 * Generate content with retry logic and exponential backoff
 */
async function generateContentWithRetry(prompt, maxRetries = RATE_LIMIT_CONFIG.maxRetries) {
    const requestId = Date.now();
    let lastError = null;
    let attempt = 0;
    
    // Log request details
    console.log(`\n=== GENERATE CONTENT REQUEST ${requestId} (${new Date().toISOString()}) ===`);
    console.log(`[${requestId}] Model: ${GEMINI_MODEL_NAME}`);
    console.log(`[${requestId}] Max Retries: ${maxRetries}`);
    console.log(`[${requestId}] Prompt Length: ${prompt.length} characters`);
    
    while (attempt <= maxRetries) {
        attempt++;
        const attemptStartTime = Date.now();
        console.log(`\n[${requestId}] --- Attempt ${attempt}/${maxRetries} ---`);
        
        try {
            // Log a preview of the prompt (first 200 chars)
            const preview = prompt.length > 200 ? `${prompt.substring(0, 200)}...` : prompt;
            console.log(`[${requestId}] Sending request with prompt preview: ${preview}`);
            
            // Make the API call
            const responseText = await callGeminiAPI(prompt, requestId);
            const responseTime = Date.now() - attemptStartTime;
            
            // Log success
            console.log(`[${requestId}] ✅ Success! Response received in ${responseTime}ms`);
            
            // Validate response
            if (!responseText) {
                throw new Error('Empty response from Gemini API');
            }
            
            console.log(`[${requestId}] Response length: ${responseText.length} characters`);
            return responseText;
            
        } catch (error) {
            const errorTime = Date.now();
            lastError = error;
            const statusCode = error.response?.status || error.statusCode || 500;
            
            // Log the error
            console.error(`\n[${requestId}] ❌ Attempt ${attempt} failed after ${(errorTime - attemptStartTime) / 1000}s`);
            console.error(`[${requestId}] Error Code: ${error.code || 'UNKNOWN'}`);
            console.error(`[${requestId}] Status: ${error.statusCode} - ${error.message}`);
            
            // If this is a quota exceeded error, don't retry
            if (error.isQuotaExceeded) {
                console.error(`[${requestId}] ⚠️  Quota exceeded. No more retries.`);
                throw error; // Exit the retry loop
            }
            
            // If this is a rate limit error, log the retry time
            if (error.retryAfter) {
                console.error(`[${requestId}] Retry after: ${error.retryAfter} seconds`);
            }
            
            // Handle rate limiting (429)
            if (statusCode === 429) {
                const retryAfter = error.response?.headers?.['retry-after'] || 
                                 error.response?.data?.error?.details?.[0]?.retryDelay || 
                                 error.retryAfter ||
                                 5; // Default 5 seconds
                
                console.log(`[${requestId}] ⏳ Rate limited. Waiting ${retryAfter} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            } 
            // Don't retry on client errors (4xx) except for 408 (Request Timeout)
            else if (statusCode >= 400 && statusCode < 500 && statusCode !== 408) {
                console.error(`[${requestId}] 🛑 Client error (${statusCode}), not retrying`);
                break;
            }
            
            // If we have retries left, wait before retrying
            if (attempt < maxRetries) {
                const delay = calculateDelay(
                    attempt, 
                    RATE_LIMIT_CONFIG.initialDelay, 
                    RATE_LIMIT_CONFIG.maxDelay, 
                    RATE_LIMIT_CONFIG.jitter
                );
                
                console.log(`[${requestId}] 🔄 Retrying in ${Math.round(delay/1000)} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // If we get here, all retry attempts have failed
    console.error(`\n[${requestId}] ❌ All ${maxRetries} attempts failed!`);
    
    // If we have no lastError (shouldn't happen)
    if (!lastError) {
        const unknownError = new Error('Failed to generate content: Unknown error after all retries');
        unknownError.statusCode = 500;
        unknownError.code = 'UNKNOWN_ERROR';
        unknownError.isOperational = true;
        console.error(`[${requestId}] No error details available`);
        throw unknownError;
    }
    
    // Enhance the last error with retry information
    lastError.attempts = attempt - 1; // Subtract 1 because we increment at the start of the loop
    lastError.maxAttempts = maxRetries;
    
    // Format a more descriptive error message
    if (lastError.response?.status === 429) {
        lastError.message = `Rate limited after ${lastError.attempts} attempts. ${lastError.message}`;
    } else {
        lastError.message = `Failed after ${lastError.attempts} attempts: ${lastError.message}`;
    }
    
    // Ensure error has required properties
    lastError.statusCode = lastError.statusCode || 500;
    lastError.code = lastError.code || 'GEMINI_API_ERROR';
    lastError.isOperational = true;
    
    console.error(`[${requestId}] Final error:`, {
        code: lastError.code,
        status: lastError.statusCode,
        message: lastError.message,
        attempts: lastError.attempts,
        maxAttempts: lastError.maxAttempts
    });
    
    throw lastError;
}

// Fallback questions generator
function generateFallbackQuestions(role, experience, topics, count = 5) {
    console.log(`Generating ${count} fallback questions for ${role} (${experience} years) about ${topics}`);
    
    // Common questions that can be customized
    const commonQuestions = [
        `What are the key responsibilities of a ${role}?`,
        `How does your ${experience} years of experience prepare you for this ${role} role?`,
        `What are the most important skills for a ${role} to have?`,
        `How do you stay updated with the latest trends in ${topics}?`,
        `Can you describe a challenging project you've worked on related to ${topics}?`,
        `What tools and technologies are you most proficient with as a ${role}?`,
        `How do you approach problem-solving when working with ${topics}?`,
        `What experience do you have with ${topics} in a professional setting?`,
        `How would you explain ${topics} to someone who is not technical?`,
        `What are some common challenges you've faced when working with ${topics}?`
    ];
    
    // Return the requested number of questions
    return commonQuestions.slice(0, Math.min(count, commonQuestions.length));
}

// @route POST /api/ai/generate-questions
// @access Private
async function generateInterviewQuestions(req, res) {
    const requestId = Date.now();
    console.log(`\n=== GENERATE QUESTIONS REQUEST ${requestId} ===`);
    console.log(`[${requestId}] Request body:`, JSON.stringify({
        role: req.body.role ? 'provided' : 'missing',
        experience: req.body.experience ? 'provided' : 'missing',
        topicsToFocus: req.body.topicsToFocus ? 'provided' : 'missing',
        numberOfQuestions: req.body.numberOfQuestions ? 'provided' : 'missing'
    }, null, 2));
    
    try {
        const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
        
        // Validate request body
        if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
            const missingFields = [];
            if (!role) missingFields.push('role');
            if (!experience) missingFields.push('experience');
            if (!topicsToFocus) missingFields.push('topicsToFocus');
            if (!numberOfQuestions) missingFields.push('numberOfQuestions');
            
            const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
            error.statusCode = 400;
            error.code = 'MISSING_REQUIRED_FIELDS';
            error.missingFields = missingFields;
            throw error;
        }
        
        // Validate number of questions
        const numQuestions = parseInt(numberOfQuestions, 10);
        if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 20) {
            const error = new Error('Number of questions must be between 1 and 20');
            error.statusCode = 400;
            error.code = 'INVALID_NUM_QUESTIONS';
            throw error;
        }
        
        console.log(`[${requestId}] Generating ${numQuestions} questions for ${role} (${experience} years) focusing on: ${topicsToFocus}`);
        
        try {
            // Generate the prompt
            const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numQuestions);
            
            // Generate questions with retry logic
            console.log(`[${requestId}] Sending request to AI model...`);
            const startTime = Date.now();
            const result = await generateContentWithRetry(prompt);
            const responseTime = Date.now() - startTime;
            
            console.log(`[${requestId}] Received AI response in ${responseTime}ms`);
            
            // Process the AI response
            console.log(`[${requestId}] Raw AI response:`, result);
            
            let questions = [];
            try {
                // Try to parse as JSON first (in case the model returned JSON)
                try {
                    const parsed = JSON.parse(result);
                    if (Array.isArray(parsed)) {
                        questions = parsed.map(String);
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        questions = Object.values(parsed).map(String);
                    }
                } catch (e) {
                    // Not JSON, continue with text parsing
                }
                
                // If no questions found in JSON, try to extract from text
                if (questions.length === 0) {
                    // Try to extract numbered list (1. Question 1\n2. Question 2...)
                    const numberedMatches = result.match(/^\d+\..+$/gm);
                    if (numberedMatches && numberedMatches.length > 0) {
                        questions = numberedMatches.map(q => q.replace(/^\d+\.\s*/, '').trim());
                    } else {
                        // Try to split by newlines and filter out empty lines and code blocks
                        questions = result.split('\n')
                            .map(q => q.trim())
                            .filter(q => {
                                const trimmed = q.trim();
                                return trimmed.length > 0 && 
                                       !trimmed.startsWith('```') && 
                                       !trimmed.startsWith('---') &&
                                       !trimmed.startsWith('===') &&
                                       !trimmed.toLowerCase().includes('example');
                            });
                            
                        // If we still have too many questions, take the first N
                        if (questions.length > numQuestions) {
                            questions = questions.slice(0, numQuestions);
                        }
                    }
                }
                
                // Clean up questions
                questions = questions
                    .map(q => {
                        // Remove any remaining markdown formatting
                        q = q.replace(/[*_`]/g, '').trim();
                        // Remove any quotes
                        q = q.replace(/^["']|["']$/g, '').trim();
                        return q;
                    })
                    .filter(q => q.length > 0);
                    
                console.log(`[${requestId}] Extracted questions:`, questions);
                
                // Filter out any empty questions and trim whitespace
                questions = questions.map(q => q.trim()).filter(q => q.length > 0);
                
                // If we still couldn't parse any questions, throw an error
                if (questions.length === 0) {
                    throw new Error('No valid questions found in the response');
                }
                
                console.log(`[${requestId}] Successfully extracted ${questions.length} questions`);
                
                // Return a simple array of questions as expected by the frontend
                return res.status(200).json({
                    success: true,
                    questions: questions
                });
                
            } catch (aiError) {
                console.error(`[${requestId}] AI processing error:`, aiError);
                console.log(`[${requestId}] Falling back to local question generation`);
                
                // Fallback to local question generation
                const fallbackQuestions = generateFallbackQuestions(role, experience, topicsToFocus, numQuestions);
                console.log(`[${requestId}] Generated ${fallbackQuestions.length} fallback questions`);
                
                return res.status(200).json({
                    success: true,
                    questions: fallbackQuestions,
                    isFallback: true
                });
            }
            
        } catch (aiError) {
            console.error(`[${requestId}] AI processing error:`, aiError);
            throw aiError;
        }
    } catch (error) {
        // Log the error with request details
        const errorDetails = {
            timestamp: new Date().toISOString(),
            requestId,
            error: {
                name: error.name,
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                body: {
                    ...req.body,
                    // Don't log the entire prompt if it's large
                    prompt: req.body.prompt ? `${req.body.prompt.substring(0, 100)}...` : undefined
                },
                params: req.params,
                query: req.query
            }
        };
        
        console.error(`[${requestId}] Error details:`, JSON.stringify(errorDetails, null, 2));
        
        // Determine the appropriate status code
        const statusCode = error.statusCode || 500;
        const errorMessage = error.isOperational ? error.message : 'An unexpected error occurred';
        
        // Send error response
        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code || 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
                ...(error.stack && { stack: error.stack })
            })
        });
    }
}

// @desc Generate explains an interview question
// @route POST /api/ai/generate-explanation
// @access Private
async function generateConceptExplanation(req, res) {
    const requestId = Date.now();
    console.log(`\n=== GENERATE EXPLANATION REQUEST ${requestId} ===`);
    
    try {
        const { concept, difficulty = 'intermediate', language = 'English', context } = req.body;
        
        // Validate request body
        if (!concept) {
            const error = new Error('Missing required field: concept');
            error.statusCode = 400;
            error.code = 'MISSING_CONCEPT';
            throw error;
        }
        
        // Validate difficulty level
        const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (difficulty && !validDifficulties.includes(difficulty.toLowerCase())) {
            const error = new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
            error.statusCode = 400;
            error.code = 'INVALID_DIFFICULTY';
            throw error;
        }
        
        console.log(`[${requestId}] Generating ${difficulty} level explanation for concept: "${concept}" in ${language}`);
        
        try {
            // Generate the prompt with context if provided
            const prompt = conceptExplainPrompt(concept, difficulty, language, context);
            
            // Generate explanation with retry logic
            console.log(`[${requestId}] Sending request to AI model...`);
            const startTime = Date.now();
            const explanation = await generateContentWithRetry(prompt);
            const responseTime = Date.now() - startTime;
            
            console.log(`[${requestId}] Received AI response in ${responseTime}ms`);
            
            // Process the explanation
            let formattedExplanation;
            try {
                // Try to parse as JSON first (in case the model returns structured data)
                try {
                    const parsed = JSON.parse(explanation);
                    formattedExplanation = typeof parsed === 'string' ? parsed : explanation;
                } catch {
                    formattedExplanation = explanation;
                }
                
                // Ensure the explanation is a non-empty string
                if (typeof formattedExplanation !== 'string' || !formattedExplanation.trim()) {
                    throw new Error('Generated explanation is empty');
                }
                
            } catch (parseError) {
                console.error(`[${requestId}] Failed to process explanation:`, parseError);
                console.error(`[${requestId}] Raw response:`, explanation);
                
                const error = new Error('Failed to process the generated explanation');
                error.statusCode = 500;
                error.code = 'INVALID_EXPLANATION_FORMAT';
                error.originalError = parseError;
                throw error;
            }
            
            console.log(`[${requestId}] Successfully generated explanation (${formattedExplanation.length} characters)`);
            
            return res.status(200).json({
                success: true,
                data: {
                    concept,
                    difficulty,
                    language,
                    explanation: formattedExplanation,
                    metadata: {
                        model: GEMINI_MODEL_NAME,
                        responseTime: `${responseTime}ms`,
                        generatedAt: new Date().toISOString()
                    }
                }
            });
            
        } catch (aiError) {
            console.error(`[${requestId}] AI processing error:`, aiError);
            throw aiError;
        }
        
    } catch (error) {
        // Log the error with request details
        const errorDetails = {
            timestamp: new Date().toISOString(),
            requestId,
            error: {
                name: error.name,
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                body: {
                    ...req.body,
                    // Don't log the entire prompt if it's large
                    concept: req.body.concept ? `${req.body.concept.substring(0, 100)}...` : undefined
                },
                params: req.params,
                query: req.query
            }
        };
        
        console.error(`[${requestId}] Error details:`, JSON.stringify(errorDetails, null, 2));
        
        // Determine the appropriate status code
        const statusCode = error.statusCode || 500;
        const errorMessage = error.isOperational ? error.message : 'An error occurred while generating the explanation';
        
        // Send error response
        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code || 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
                ...(error.stack && { stack: error.stack })
            })
        });
    }
}

// Export the controller functions
module.exports = {
    generateInterviewQuestions,
    generateConceptExplanation
};
