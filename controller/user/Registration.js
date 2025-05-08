const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usersModel = require("../../models/users");

const Registration = async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, address } = req.body;

    if (!firstName || !lastName || !email || !password || !dateOfBirth || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await usersModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    //  Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let parsedAddress = address;

    if (typeof address === 'string') {
      const parts = address.split(',').map(part => part.trim());
      parsedAddress = {
        city: parts[0] || '',
        country: parts[1] || ''
      };
    }

    // Create new user
    const newUser = new usersModel({
      firstName,
      lastName,
      email,
      password: hashedPassword, // استخدمي الباسورد المشفر
      dateOfBirth,
      address:parsedAddress
    })
    // لو العنوان جاي كـ string (مثلاً: "Cairo, Egypt")، نقسمه
    await newUser.save();
    console.log(`✅ New user created: ${email}`);
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );
    console.log("Generated token:", token); // ✅

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        firstName,
        lastName,
        email,
        dateOfBirth,
        address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/////////////////////////////////////////////////////

const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// إعداد الـ transporter للإيميل (استخدام Gmail في المثال)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // يمكن تغيير الخدمة أو استخدام SMTP مخصص
  auth: {
    user: 'ghadadodo524@gmail.com',  // الإيميل الذي ستُرسل منه الرسائل
    pass: 'vlwo gavd guji yive'      // استخدم App Password وليس كلمة المرور العادية
  }
});

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'ID Token is required' });
  }

  try {
    // التحقق من التوكن مع Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
      
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // التحقق من وجود المستخدم في قاعدة البيانات
    let user = await usersModel.findOne({ email });

    if (!user) {
      // المستخدم جديد — انشئ حساب جديد
      user = new usersModel({
        name,
        email,
        googleId,
        avatar: picture,
        isGoogleUser: true
      });

      await user.save();
      console.log(`✅ New user created: ${email}`);

      // إرسال رسالة ترحيب عبر الإيميل
      const mailOptions = {
        from: 'ghadadodo524@gmail.com',  // من الإيميل الذي تم ضبطه في الـ transporter
        to: email,                    // البريد الإلكتروني للمستخدم
        subject: 'Welcome to Airbnb!',
        text: `Hello ${name},\n\nThank you for signing up with us! We're excited to have you onboard in Airbnb. 😊`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('❌ Error sending email:', error);
        } else {
          console.log('✅ Welcome email sent:', info.response);
        }
      });

    } else {
      console.log(`🔑 Existing user logged in: ${email}`);
    }

    // إنشاء JWT
    const serverToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.avatar
      },
      token: serverToken
    });

  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid ID Token' });
  }
};

module.exports = {
  googleLogin,
  Registration
};

