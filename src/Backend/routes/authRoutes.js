import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import User from '../models/userModel.js'
import dotenv from 'dotenv'

dotenv.config()
const router = express.Router()


// Login route (for manual login - kept for backward compatibility)
// Manual login removed for security - Microsoft 365 only.
router.post('/login', async (req, res) => {
  res.status(403).json({ message: 'Manual login is disabled. Please use Microsoft 365.' });
});

// Microsoft OAuth login route
router.post('/microsoft', async (req, res) => {
  try {
    const { accessToken, email, name } = req.body

    if (!accessToken || !email) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Verify token with Microsoft Graph API
    try {
      const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const microsoftUser = graphResponse.data
      const userEmail = (microsoftUser.mail || microsoftUser.userPrincipalName || email || "").toLowerCase();
      const userName = microsoftUser.displayName || name || microsoftUser.givenName || 'User'

      // --- ADMIN WHITELIST CHECK ---
      const allowedAdmins = ['zulqarnain.hafeez@itcs.com'];
      if (!allowedAdmins.includes(userEmail)) {
        console.warn(`Blocked unauthorized login attempt from: ${userEmail}`);
        return res.status(403).json({ message: 'Unauthorized. This email is not on the admin whitelist.' });
      }
      // -----------------------------

      // Check if user exists in database by email OR by username
      let user = await User.findOne({ 
        $or: [
          { email: userEmail },
          { username: userEmail.split('@')[0] }
        ]
      })
      
      const usernameDerived = userEmail.split('@')[0]

      if (!user) {
        // Create new user if doesn't exist at all
        user = new User({
          fullName: userName,
          username: usernameDerived,
          email: userEmail,
          password: '', // No password needed for OAuth users
          role: 'admin',
          isAdmin: true,
        })
        await user.save()
        console.log(`Created new Microsoft user: ${userEmail}`)
      } else {
        // Update user info - link Microsoft login to existing manual account if needed
        user.fullName = userName
        user.email = userEmail // Ensure email matches Microsoft one
        await user.save()
        console.log(`Linked/Updated Microsoft user: ${userEmail}`)
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Extended for easier development
      })

      console.log(`User ${userEmail} successfully authenticated via Microsoft`)

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      })
    } catch (graphError) {
      console.error('--- Microsoft Graph API Error ---')
      if (graphError.response) {
        console.error('Status:', graphError.response.status)
        console.error('Data:', JSON.stringify(graphError.response.data, null, 2))
      } else {
        console.error('Message:', graphError.message)
      }
      return res.status(401).json({ 
        message: 'Failed to verify Microsoft account. Please ensure your token is valid.',
        details: graphError.response?.data?.error?.message || graphError.message
      })
    }
  } catch (error) {
    console.error('Microsoft login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router