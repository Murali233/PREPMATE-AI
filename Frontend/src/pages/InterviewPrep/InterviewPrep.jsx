/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import { LuCircleAlert, LuListCollapse } from "react-icons/lu";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";
import { toast } from "react-hot-toast";
import RoleInfoHeader from "../InterviewPrep/components/RoleInfoHeader";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from '../../utils/apiPaths';
import Drawer from '../../components/Drawer';
import SkeletonLoader from '../../components/Loader/SkeletonLoader';
import AIResponsePreview from './components/AIResponsePreview';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import QuestionCard from '../../components/Cards/QuestionCard';

const InterviewPrep = () => { 
  const { sessionId } = useParams();

  const [sessionData, setSessionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [error, setError] = useState("");
  const [openLeanMoreDrawer, setOpenLeanMoreDrawer] = useState(false);
  const [explanation, setExplanation] = useState(null);

  const [isLoading, setIsLoading] = useState(false); 
  const [isUpdateLoader, setIsUpdateLoader] = useState(false);

  // Fetch session data by session id
  const fetchSessionDetailsById = async () => {
    if (!sessionId) {
      setErrorMsg("Invalid session ID");
      return;
    }

    try {
      setErrorMsg("");
      setIsLoading(true);
      
      console.log('Fetching session with ID:', sessionId);
      const response = await axiosInstance.get(API_PATHS.SESSION.GET_ONE(sessionId));
      console.log('Session API Response:', response.data);

      if (response.data && response.data.success && response.data.session) {  
        const session = response.data.session;
        console.log('Session data:', session);
        
        // Ensure questions is an array and log its contents
        let questions = [];
        
        if (Array.isArray(session.questions)) {
          questions = session.questions.map(q => ({
            _id: q._id,
            question: q.question || 'No question provided',
            answer: q.answer || '',
            isPinned: q.isPinned || false,
            note: q.note || ''
          }));
        } else if (typeof session.questions === 'object' && session.questions !== null) {
          // Handle case where questions is an object with numeric keys
          questions = Object.values(session.questions).map(q => ({
            _id: q._id || '',
            question: q.question || 'No question provided',
            answer: q.answer || '',
            isPinned: q.isPinned || false,
            note: q.note || ''
          }));
        }
        
        console.log('Processed questions:', questions);
        
        // Set the session data with formatted questions
        const sessionWithQuestions = {
          ...session,
          questions: questions
        };
        
        console.log('Setting session data with formatted questions:', sessionWithQuestions);
        setSessionData(sessionWithQuestions);
      } else {
        console.error("Unexpected response format:", response.data);
        setErrorMsg("Failed to load session data. Invalid response format.");
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to load session. Please try again later.";
      setErrorMsg(errorMessage);
      
      // If it's a 404, suggest going back to dashboard
      if (error.response?.status === 404) {
        setErrorMsg("Session not found. It may have been deleted.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Concept Explanation
  const generateConceptExplanation = async (question) => {
    try {
      setErrorMsg("");
      setExplanation(null);
      setIsLoading(true);
      setOpenLeanMoreDrawer(true);

      console.log('Sending request to generate explanation for:', question);
      const response = await axiosInstance.post(
        API_PATHS.AI.GENERATE_EXPLANATION,
        {
          concept: question,
          difficulty: 'intermediate',
          language: 'English'
        }
      );

      console.log('Explanation response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        const explanationText = response.data.data.explanation;
        
        setExplanation({
          title: question,
          explanation: explanationText
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      setExplanation(null)
      setErrorMsg("Failed to generate explanation, Try again later" );
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pin Question
  const toggleQuestionPinStatus = async (questionId) => {
    try {
      const response = await axiosInstance.post( 
        API_PATHS.QUESTION.PIN(questionId) 
      );

      console.log(response);

      if (response.data && response.data.question) {  
        // toast.success('Question Pinned Successfully')
        fetchSessionDetailsById();
      }
} catch (error) {
  console.error("Error:", error);
  }
};

  // Add more questions to a session
  const uploadMoreQuestions = async () => {
    try {
      setIsUpdateLoader(true);
      setErrorMsg("");

      // Call AI API to generate questions
      const aiResponse = await axiosInstance.post(
        API_PATHS.AI.GENERATE_QUESTIONS,
        {
          role: sessionData?.role,
          experience: sessionData?.experience,
          topicsToFocus: sessionData?.topicsToFocus,
          numberOfQuestions: 5, // Reduced number to stay within quota
        }
      );
      
      // Check if the response contains questions array
      const questionsArray = Array.isArray(aiResponse.data) 
        ? aiResponse.data 
        : aiResponse.data.questions || [];
      
      if (!questionsArray.length) {
        throw new Error('No questions were generated. The daily API quota might be exceeded.');
      }
      
      // Format questions for the API
      const formattedQuestions = questionsArray.map(q => ({
        question: q.question || q,
        answer: q.answer || ''
      }));
      
      const response = await axiosInstance.post(
        API_PATHS.QUESTION.ADD_TO_SESSION,
        {
          sessionId,
          questions: formattedQuestions,
        }
      );
      
      if (response.data?.success) {
        toast.success(`Added ${formattedQuestions.length} new questions!`);
        // Refresh the session data
        await fetchSessionDetailsById();
      } else {
        throw new Error(response.data?.message || 'Failed to add questions to the session');
      }
    } catch (error) {
      console.error('Error in uploadMoreQuestions:', error);
      if (error.response) {
        // Handle different types of errors from the API
        if (error.response.status === 429) {
          setErrorMsg("Daily API quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or upgrade your plan.");
        } else if (error.response.data && error.response.data.message) {
          setErrorMsg(error.response.data.message);
        } else {
          setErrorMsg("Failed to load more questions. The AI service might be temporarily unavailable.");
        }
      } else if (error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsUpdateLoader(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetailsById();
    }

    return () => {};
  }, []);
    return ( 
    <DashboardLayout>
      {errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMsg}</span>
        </div>
      ) : sessionData ? (
        <RoleInfoHeader
          role={sessionData.role || ""}
          topicsToFocus={sessionData.topicsToFocus || ""}
          experience={sessionData.experience || "-"}
          questions={sessionData.questions?.length || "0"}
          description={sessionData.description || ""}
          lastUpdated={
            sessionData.updatedAt
              ? moment(sessionData.updatedAt).format("Do MMM YYYY")
              : ""
          }
        />
      ) : (
        <div className="flex justify-center items-center py-10">
          <SpinnerLoader />
        </div>
      )}
      <div className="container mx-auto pt-4 pb-4 px-4 md:px-0">
        <h2 className="text-lg font-semibold color-black">Interview Q & A</h2>
  
        <div className="grid grid-cols-12 gap-4 mt-5 mb-10">
          <div
            className={`col-span-12 ${
              openLeanMoreDrawer ? "md:col-span-7": "md:col-span-8"
            } `}
          >

        <div className="debug-info" style={{ display: 'none' }}>
          <div>Session Data: {JSON.stringify(sessionData, null, 2)}</div>
          <div>Questions Array: {JSON.stringify(sessionData?.questions || [], null, 2)}</div>
          <div>Questions Length: {sessionData?.questions?.length || 0}</div>
        </div>
        
        <AnimatePresence>
          {sessionData?.questions?.length > 0 ? (
            sessionData.questions.map((data, index) => {
              console.log(`Rendering question ${index}:`, data); // Debug log
            return (
              <motion.div
                key={data._id || index}
                initial={{ opacity: 0, y: -20}}
                animate={{ opacity: 1, y: 0}}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100,
                  delay: index * 0.1,
                  damping: 15,
              }}
              layout // This is the key prop that animates position changes
              layoutId={`question-${data._id || index}`} 
              >
                <>
                <QuestionCard
                question={data?.question}
                answer={data?.answer}
                onLearnMore={() =>
                  generateConceptExplanation(data.question)
                }
                isPinned={data?.isPinned}
                onTogglePin={() => toggleQuestionPinStatus(data._id)}
              />

              {!isLoading &&
                sessionData?.questions?.length == index + 1 && (
                  <div className="flex items-center justify-center mt-5">
                    <button
                      className="flex items-center gap-3 text-sm text-white font-medium bg-black px-5 py-2 mr-2 rounded text-nowrap cursor-pointer"
                      disabled={isLoading || isUpdateLoader}
                      onClick={uploadMoreQuestions}
                    >
                      {isUpdateLoader ? (
                        <SpinnerLoader />
                      ) : (
                      
                      <LuListCollapse className="text-lg" />
                      )}{""}
                      Load More
                    </button>
                  </div>
                )}
                </>
              </motion.div>
            );
          })
          ) : !errorMsg ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No questions found for this session.</p>
            </div>
          ) : null}
          </AnimatePresence>
          </div>
          </div>

          <div>
            <Drawer
            isOpen= {openLeanMoreDrawer}
            onClose={() => setOpenLeanMoreDrawer(false)}
            title={!isLoading && explanation?.title}
          >
            {errorMsg && (
              <p className="flex gap-2 text-sm text-amber-600 font-medium">
                <LuCircleAlert className="mt-1" /> {errorMsg}
              </p>
            )}
            {isLoading && <SkeletonLoader />}
            {!isLoading && explanation && (
              <AIResponsePreview content={explanation?.explanation} />
              )}
              </Drawer>
          </div>
          </div>
        </DashboardLayout> 
  )
}

export default InterviewPrep
