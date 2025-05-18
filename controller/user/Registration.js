// const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const usersModel = require("../../models/users");

// const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const jwt = require('jsonwebtoken');

const Registration = async (req, res) => {
  try {
    const { name, email, dateOfBirth, phone, password } = req.body;

    if (!name || !email || !dateOfBirth || !phone) {
      return res.status(400).json({ message: "All required fields are not provided" });
    }

    const existingUser = await usersModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const userData = {
      name,
      email,
      dateOfBirth,
      phone
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      userData.password = hashedPassword;
    }

    const newUser = new usersModel(userData);
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// module.exports = Registration;
// const googleLogin = async (req, res) => {
//   const { idToken } = req.body;

//   if (!idToken) {
//     return res.status(400).json({ success: false, message: 'ID Token is required' });
//   }

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const userId = payload.sub;

//     // هنا تقدري تدخلي userId, email, name في قاعدة بياناتك
//     console.log("User verified:", payload);
//     const serverToken = jwt.sign(
//       { id: userId, email: payload.email },  // البيانات اللي تحبي تخزنيها
//       process.env.JWT_SECRET,               // سر التوقيع - ضيفيه في ملف env
//       { expiresIn: '1h' }                   // مدة صلاحية التوكن
//     );
//     res.json({
//       success: true,
//       user: {
//         id: userId,
//         name: payload.name,
//         email: payload.email,
//         picture: payload.picture,
//       },
//       token: serverToken, // التوكن اللي انتي عملتيه
//     });

//   } catch (error) {
//     console.error('Token verification failed:', error);
//     res.status(401).json({ success: false, message: 'Invalid ID Token' });
//   }
// };

// module.exports = { googleLogin };

/////////////////////////////////////////////////////
// ghada update////
// const { OAuth2Client } = require('google-auth-library');
// const jwt = require('jsonwebtoken');
// const usersModel = require('../../models/users');
// const nodemailer = require('nodemailer');


// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const googleLogin = async (req, res) => {
//   const { idToken } = req.body;

//   if (!idToken) {
//     return res.status(400).json({ success: false, message: 'ID Token is required' });
//   }

//   try {
//     // التحقق من التوكن مع Google
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { sub: googleId, email, name, picture } = payload;

//     // التحقق من وجود المستخدم في قاعدة البيانات
//     let user = await usersModel.findOne({ email });

//     if (!user) {
//       // المستخدم جديد — انشئ حساب جديد
//       user = new usersModel({
//         name,
//         email,
//         googleId,
//         avatar: picture,
//         isGoogleUser: true
//       });

//       await user.save();
//       console.log(`✅ New user created: ${email}`);
//     } else {
//       console.log(`🔑 Existing user logged in: ${email}`);
//     }

//     // إنشاء JWT
//     const serverToken = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         picture: user.avatar
//       },
//       token: serverToken
//     });

//   } catch (error) {
//     console.error('❌ Token verification failed:', error);
//     res.status(401).json({ success: false, message: 'Invalid ID Token' });
//   }
// };

// module.exports = { googleLogin };
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const usersModel = require("../../models/users");

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
    const { sub: googleId, email, name, picture, email_verified } = payload;

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
        from: 'abdosa3oor@gmail.com',  // من الإيميل الذي تم ضبطه في الـ transporter
        to: email,                    // البريد الإلكتروني للمستخدم
        subject: 'Welcome to Airbnb!',
        text: `Hello ${name},\n\nThank you for signing up with us! We're excited to have you onboard in Airbnb. 😊`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Welcome email sent:', info.response);
        }
      });
    } else {
      console.log(`Existing user logged in: ${email}`);
    }
    // إنشاء JWT
    const serverToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.avatar,
        email_verified: email_verified
      },
      token: serverToken
    });

  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid ID Token' });
  }
};

module.exports = { googleLogin, Registration };
