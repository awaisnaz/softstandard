import express from 'express';
import cors from "cors";
import "dotenv/config.js";
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import Anthropic from "@anthropic-ai/sdk";
import MongoStore from 'connect-mongo';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// User model
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});
const User = mongoose.model('User', UserSchema);

// Define the schema for the Job model
const jobSchema = new mongoose.Schema({
    timestamp: Date,
    companyName: String,
    title: String,
    description: String
  });  
const Job = mongoose.model('Job', jobSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.PASSWORD_HASH,
  saveUninitialized: false,
  resave: true,
  cookie: { secure: false },
  secure: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    collectionName: 'sessions' // This is optional
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({credentials: true, origin: ['http://localhost:5173', 'http://localhost:3000/login']}));

// Passport local strategy
passport.use(new LocalStrategy({ usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/login', passport.authenticate('local'), (req, res) => {
    // res.redirect("/");
    res.json({ message: 'Logged in successfully' });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Protected route example
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.get('/checkAuth', async (req, res) => {
  let temp = await req.isAuthenticated();
  if (req.user) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.post('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({})
      .sort({ timestamp: -1 })
      .skip((req.body.page - 1) * 10)
      .limit(10);
    const count = await Job.countDocuments();
    res.json({
        jobs: jobs,
        total: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/addJob', async (req, res) => {
  try {
    const job = new Job({
      timestamp: new Date().toISOString(),
      companyName: req.body.company,
      title: req.body.title,
      description: req.body.description
     });
    await job.save();
    res.status(201).json({ message: 'Job Added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Job Add Error' });
    console.log(error);
  }
});

app.post('/genJob', async (req, res) => {
  const systemPrompt = `You are an AI assistant specialized in improving job titles and creating concise job descriptions. 
  When given an input job title and description, you will generate a concise 100-word job description that accurately reflects the role.
  
  Make the Job Description as a paragraph of numbered points of requirements, and preferences.

  Return the response a json in the following format (fill in the title and description):
  {"title": [title], "description": "description"}

  The JSON Format should be parsable. You need to escape your escapes :) Use double \\ instead of \
  `;  
  
  const userPrompt = `Input Job Title: ${req.body.title}
  Input Job Description: ${req.body.description}
  
  Please provide the corrected job title and a 100-word description.`;

  try {
    let response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // "claude-3-opus-20240229", // 
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });

    response = JSON.parse(JSON.parse(JSON.stringify(response.content[0].text)));
    res.status(201).json({ 
      response
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));