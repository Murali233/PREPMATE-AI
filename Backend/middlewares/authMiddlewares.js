const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        console.log('Auth middleware - Headers:', JSON.stringify(req.headers, null, 2));
        
        let token = req.headers.authorization || req.headers.Authorization;
        
        if (!token) {
            console.error('No token provided in request');
            return res.status(401).json({ 
                success: false,
                message: "Not authorized, no token provided" 
            });
        }
        
        // Extract token from Bearer string if present
        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }
        
        console.log('Token to verify:', token);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
        
        try {
            // Verify the token
            const secret = process.env.JWT_SECRET.trim();
            console.log('JWT Secret being used for verification:', secret);
            console.log('Token being verified:', token);
            
            let decoded;
            try {
                decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
                console.log('Successfully decoded token:', JSON.stringify(decoded, null, 2));
                
                if (!decoded.id) {
                    console.error('Token does not contain user ID');
                    return res.status(401).json({ 
                        success: false,
                        message: "Invalid token format" 
                    });
                }
            } catch (verifyError) {
                console.error('JWT verification failed with error:', verifyError.message);
                console.error('Error details:', {
                    name: verifyError.name,
                    message: verifyError.message,
                    stack: verifyError.stack
                });
                return res.status(401).json({ 
                    success: false,
                    message: "Invalid token",
                    error: verifyError.message 
                });
            }
            
            // Find the user by ID from the token
            const user = await User.findById(decoded.id).select("-password");
            
            if (!user) {
                console.error('User not found for ID:', decoded.id);
                return res.status(401).json({ 
                    success: false,
                    message: "User not found" 
                });
            }
            
            // Attach user to request object
            req.user = user;
            console.log('User authenticated:', user.email);
            next();
            
        } catch (error) {
            console.error('JWT verification failed:', {
                name: error.name,
                message: error.message,
                expiredAt: error.expiredAt,
                stack: error.stack
            });
            
            let errorMessage = 'Invalid token';
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Token has expired';
            } else if (error.name === 'JsonWebTokenError') {
                errorMessage = 'Invalid token format';
            }
            
            return res.status(401).json({ 
                success: false,
                message: errorMessage,
                error: error.message 
            });
        }
    } catch (error) {
        console.error('Unexpected error in auth middleware:', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false,
            message: "Server error during authentication", 
            error: error.message 
        });
    }
};
module.exports = { protect };