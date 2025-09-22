const User = require("../models/User"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (userId) => { 
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        
        const token = jwt.sign(
            { id: userId }, 
            process.env.JWT_SECRET.trim(), 
            { 
                expiresIn: "7d",
                algorithm: 'HS256' // Explicitly set the algorithm
            }
        );
        
        console.log('Generated token for user ID:', userId);
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Failed to generate authentication token');
    }
};

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, profileImageUrl } =
        req.body;
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" }); 
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
 });

        // Return user data with JWT
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id),
        });
    } catch (error){
    res.status(500).json({message: "Server error", error: error.message });
}
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
    try {
        console.log('Login request received. Body:', JSON.stringify(req.body, null, 2));
        
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ 
                success: false,
                message: "Please provide both email and password" 
            });
        }

        console.log('Looking for user with email:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }
        
        console.log('User found. Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password); 
        
        console.log('Password match result:', isMatch);
        if (!isMatch) {  
            console.log('Password does not match for user:', email);
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }
        
        try {
            // Generate token
            const token = generateToken(user._id);
            console.log('Successfully generated token for user:', user._id);
            
            // Return user data with JWT
            res.json({
                success: true,
                _id: user._id,
                name: user.name, 
                email: user.email, 
                profileImageUrl: user.profileImageUrl, 
                token: token
            });
        } catch (tokenError) {
            console.error('Token generation error:', tokenError);
            return res.status(500).json({
                success: false,
                message: "Error generating authentication token",
                error: tokenError.message
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message 
        });
    }
};

// @desc Get user profile
//@route GET /api/auth/profile
// @access Private (Requires JWT)

const getUserProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(484).json({message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
}

}; 


module.exports = { registerUser, loginUser, getUserProfile };