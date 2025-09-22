import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from "../../components/Inputs/Input"
import SpinnerLoader from '../../components/Loader/SpinnerLoader';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const CreateSessionForm = () => {
    const [formData, setFormData] = useState({ 
    role: "", 
    experience: "", 
    topicsToFocus: "", 
    description:"", 
});

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleChange = (key, value) => {
        setFormData ((prevData) => ({ 
            ...prevData, 
            [key]: value, 
        })); 
     };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        const { role, experience, topicsToFocus } = formData;

        if (!role || !experience || !topicsToFocus) {
            setError("Please fill all the required fields.");
            return;
        }

        setError("");
        setIsLoading(true);

        console.log('Creating session with data:', { role, experience, topicsToFocus });

        try {
            // 1. First, verify authentication
            const token = localStorage.getItem('token');
            console.log('Auth token:', token ? 'Present' : 'Not found');

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            // 2. Call AI API to generate questions
            console.log('Calling AI API to generate questions...');
            let aiResponse;
            let generatedQuestions = [];
            
            try {
                aiResponse = await axiosInstance.post( 
                    API_PATHS.AI.GENERATE_QUESTIONS, 
                    { 
                        role, 
                        experience, 
                        topicsToFocus, 
                        numberOfQuestions: 5, // Reduced for testing
                    },
                    {
                        timeout: 30000, // 30 second timeout
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );
                
                console.log('AI API response:', aiResponse.data);

                // 3. Verify the response structure
                if (aiResponse.data?.questions) {
                    // Handle the case where questions are directly in the response
                    generatedQuestions = aiResponse.data.questions;
                } else if (Array.isArray(aiResponse.data)) {
                    // Handle case where response is an array of questions
                    generatedQuestions = aiResponse.data;
                } else if (aiResponse.data?.data?.questions) {
                    // Handle nested questions in data.questions
                    generatedQuestions = aiResponse.data.data.questions;
                }
                
                console.log('Extracted questions:', generatedQuestions);
                
            } catch (aiError) {
                console.error('Error generating questions with AI:', aiError);
                toast.error('Using fallback questions due to AI service issue');
                
                // Generate fallback questions locally
                generatedQuestions = [
                    `What are the key responsibilities of a ${role}?`,
                    `How does your ${experience} years of experience prepare you for this role?`,
                    `What are the most important skills for a ${role} to have?`,
                    `How do you stay updated with the latest trends in ${topicsToFocus}?`,
                    `Can you describe a challenging project you've worked on related to ${topicsToFocus}?`
                ];
            }

            if (!generatedQuestions || generatedQuestions.length === 0) {
                throw new Error('Failed to generate questions. Please try again.');
            }

            console.log(`Generated ${generatedQuestions.length} questions`);

            // 4. Format questions for the session creation
            const formattedQuestions = generatedQuestions.map(question => ({
                question: question,
                answer: '', // Initialize with empty answer
                isPinned: false
            }));

            console.log('Creating session with questions:', formattedQuestions);
            
            // 5. Create session with the generated questions
            const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, { 
                role: formData.role,
                experience: formData.experience,
                topicsToFocus: formData.topicsToFocus,
                description: formData.description || '',
                questions: formattedQuestions
            });

            console.log('Session created:', response.data);

            if (response.data?.session?._id) { 
                navigate(`/interview-prep/${response.data.session._id}`);
            } else {
                throw new Error('Failed to create session. Please try again.');
            }

        } catch (error) {
            console.error('Error in handleCreateSession:', error);
            
            let errorMessage = 'Something went wrong. Please try again.';
            
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
                
                if (error.response.status === 401) {
                    errorMessage = 'Your session has expired. Please log in again.';
                    localStorage.removeItem('token');
                    navigate('/login');
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error setting up request:', error.message);
                errorMessage = error.message || 'An unexpected error occurred.';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    return <div className="w-full max-w-full">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
            Start a New Interview Journey
        </h3>
        <p className="text-sm text-gray-600 mb-6">
            Fill out a few quick details and unlock your personalized set of interview questions!
        </p>

        <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
        <Input
            value={formData.role}
            onChange={({ target }) => handleChange("role", target.value)}
            label="Target Role"
            placeholder="(e.g., Frontend Developer, UI/UX Designer, etc.)"
            type="text"
        />

        <Input
            value={formData.experience}
            onChange={({ target }) => handleChange("experience", target.value)}
            label="Years of Experience"
            placeholder="(e.g., 1 year, 3 years, 5+ years)"
            type="number"
        />
        
        <Input
            value={formData.topicsToFocus}
            onChange={({ target }) => handleChange("topicsToFocus", target.value)}
            label="Topics to Focus On"
            placeholder="(Comma-separated, e.g., React, Node.js, MongoDB)"
            type="text"
        />

        <Input
            value={formData.description}
            onChange={({ target }) => handleChange("description", target.value)}
            label="Description"
            placeholder=" (Any specific goals or notes for this session)"
            type="text"
        />
        
        {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

        <div className="mt-4">
          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={isLoading}
          >
            {isLoading ? <SpinnerLoader /> : 'Create Session'}
          </button>
        </div>
        </form>
        </div>
};

export default CreateSessionForm;