import express from 'express'
import nodemailer from 'nodemailer'
import multer from 'multer'
import Application from '../models/application.js'
import dotenv from 'dotenv'

dotenv.config()
const router = express.Router()


const upload = multer({
  storage: multer.memoryStorage(), 
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed!'), false)
    }
  },
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
})


router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      preferredLocation,
      coverLetter = '',
      experience,
      linkedin = '',
      jobTitle = 'Not Specified',
      jobDepartment = '',
      jobLocation = '',
    } = req.body

    
    if (!fullName || !email || !phone || !preferredLocation || !experience) {
      return res.status(400).json({ message: 'All required fields must be filled.' })
    }


    if (!req.file) {
      return res.status(400).json({ message: 'Resume (PDF) is required.' })
    }

    // 1. Save to Database (ITCS > itcs-db)
    const newApplication = new Application({
      fullName,
      email,
      phone,
      preferredLocation,
      jobTitle,
      jobDepartment,
      jobLocation,
      experience,
      linkedin,
      coverLetter,
      resumeFileName: req.file.originalname,
    })

    await newApplication.save()
    console.log(`Application from ${fullName} saved to itcs-db collection.`)

    // 2. Send Email Notification
    const mailOptions = {
      from: `"Careers Portal" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to the admin email
      subject: `New Application: ${jobTitle} - ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #4a9eff; }
            .value { margin-top: 5px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #eee; }
            .job-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            a { color: #4a9eff; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h2>New Job Application Received!</h2></div>
            <div class="content">

              <div class="job-info">
                <h3>${jobTitle}</h3>
                <p><strong>Department:</strong> ${jobDepartment || 'N/A'} | <strong>Location:</strong> ${jobLocation || 'N/A'}</p>
              </div>

              <div class="section"><div class="label">Name:</div><div class="value">${fullName}</div></div>
              <div class="section"><div class="label">Email:</div><div class="value"><a href="mailto:${email}">${email}</a></div></div>
              <div class="section"><div class="label">Phone:</div><div class="value">${phone}</div></div>
              ${linkedin ? `<div class="section"><div class="label">LinkedIn:</div><div class="value"><a href="${linkedin}" target="_blank">${linkedin}</a></div></div>` : ''}
              <div class="section"><div class="label">Experience:</div><div class="value">${experience}</div></div>
              <div class="section"><div class="label">Preferred Location:</div><div class="value">${preferredLocation}</div></div>

              ${coverLetter ? `
              <div class="section">
                <div class="label">Cover Letter:</div>
                <div class="value">${coverLetter.replace(/\n/g, '<br>')}</div>
              </div>` : ''}

              <div style="margin-top: 30px; padding: 15px; background: #fff; border-left: 4px solid #4a9eff; font-style: italic;">
                A resume has been attached below as a PDF.
              </div>

            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: 'application/pdf',
        },
      ],
    }

    await transporter.sendMail(mailOptions)

    // Success!
    res.json({
      message: 'Application submitted successfully! We\'ll contact you soon.',
    })
  } catch (error) {
    console.error('Application submission error:', error)
    res.status(500).json({
      message: 'Failed to submit application. Please try again later.',
    })
  }
})

export default router


