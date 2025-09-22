const Session = require("../models/Session");
const Question = require("../models/Question");

// @desc Create a new session and linked questions
// @route POST /api/sessions/create
// @access Private

exports.createSession = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, description, questions } = req.body;
        const userId = req.user._id; // Assuming you have a middleware setting req.user

        if (!Array.isArray(questions)) {
            return res.status(400).json({
                success: false,
                message: 'Questions must be an array'
            });
        }

        // Create the session first
        const session = await Session.create({
            user: userId,
            role,
            experience,
            topicsToFocus,
            description,
            questions: [] // Initialize with empty array
        });

        try {
            // Create all questions in parallel
            const questionDocs = await Promise.all(
                questions.map(async (q) => {
                    const question = await Question.create({
                        session: session._id,
                        question: q.question || 'No question provided',
                        answer: q.answer || '',
                        isPinned: q.isPinned || false
                    });
                    return question._id;
                })
            );

            // Update the session with the question references
            session.questions = questionDocs;
            await session.save();

            // Populate the questions before sending the response
            const populatedSession = await Session.findById(session._id)
                .populate({
                    path: 'questions',
                    select: '_id question answer isPinned',
                    options: { sort: { isPinned: -1, createdAt: 1 }}
                });
            
            return res.status(201).json({ 
                success: true, 
                session: populatedSession 
            });
            
        } catch (questionError) {
            // If there's an error creating questions, clean up the session
            await Session.findByIdAndDelete(session._id);
            throw questionError;
        }
    } catch (error) {
        console.error("Error in createSession:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Server Error"
        }); 
    }
};

// @desc Get all sessions for the logged-in user
// @route GET /api/sessions/my-sessions
//@access Private

exports.getMySessions = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }

        // Get user ID from the user object (could be _id or id)
        const userId = req.user._id || req.user.id;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid user information' 
            });
        }

        // Find sessions for the user
        const sessions = await Session.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'questions',
                select: '_id question answer isPinned',
                options: { sort: { isPinned: -1, createdAt: 1 }}
            })
            .lean();
            
        // Ensure each session has a questions array
        const formattedSessions = sessions.map(session => ({
            ...session,
            questions: session.questions || []
        }));
            
        res.status(200).json({ 
            success: true, 
            count: formattedSessions.length,
            sessions: formattedSessions 
        });
    } catch (error) {
        console.error('Error in getMySessions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc Get a session by ID with populated questions
//@route GET /api/sessions/:id
// @access Private

exports.getSessionById = async (req, res) => {
    try {
        console.log('getSessionById called with ID:', req.params.id);
        
        if (!req.params.id) {
            console.log('No session ID provided');
            return res.status(400).json({ 
                success: false, 
                message: "Session ID is required" 
            });
        }

        console.log('Finding session in database...');
        // Find the session as a Mongoose document (not lean) to enable population
        const session = await Session.findById(req.params.id)
            .select('-__v')
            .lean(); // Use lean() for better performance since we'll handle population manually
            
        if (!session) {
            console.log('Session not found');
            return res.status(404).json({ 
                success: false, 
                message: "Session not found" 
            });
        }

        console.log('Session found:', session._id);
        
        // Ensure questions array exists
        if (!session.questions) {
            console.log('No questions array found, initializing empty array');
            session.questions = [];
        } else if (!Array.isArray(session.questions)) {
            console.log('Questions is not an array, initializing empty array');
            session.questions = [];
        }

        console.log(`Found ${session.questions.length} question references`);

        // If there are questions, populate them
        if (session.questions.length > 0) {
            console.log('Populating questions...');
            try {
                // Use Question model to find all questions at once for better performance
                const questionIds = session.questions.map(q => q._id || q);
                const populatedQuestions = await Question.find({
                    _id: { $in: questionIds }
                })
                .select('_id question answer isPinned note')
                .sort({ isPinned: -1, createdAt: 1 })
                .lean();

                console.log(`Successfully populated ${populatedQuestions.length} questions`);
                
                // Replace the question references with the actual questions
                session.questions = populatedQuestions;
                
                return res.status(200).json({ 
                    success: true, 
                    session: session
                });
            } catch (populateError) {
                console.error('Error populating questions:', populateError);
                // Continue with unpopulated questions if population fails
            }
        }

        console.log('Returning session with questions:', session.questions);
        // Return session with questions array (populated or not)
        res.status(200).json({ 
            success: true, 
            session: session
        });
    } catch (error) {
        console.error('Error in getSessionById:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Server Error"
        }); 
    }
};

// @desc Delete a session and its questions
// @route DELETE /api/sessions/:id
// @access Private

exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        
        if (!session) {
            return res.status(404).json({message: "Session not found" });
        } 

        // Check if the logged-in user owns this session 
        if (session.user.toString() !== req.user.id) {
            return res
            .status(401) 
            .json({ message: "Not authorized to delete this session" });
        }
        // First, delete all questions linked to this session 
        await Question.deleteMany({session: session._id });

    // Then, delete the session
    await session.deleteOne();

        res.status(200).json({ message: "Session deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" }); 
    }
};