require('dotenv').config()

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


const express = require('express')
const mongoose = require('mongoose')

const app = express()
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('Connection failed:', err))

//Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: false }
})

const Book = mongoose.model('Book', bookSchema)


//User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})

const User = mongoose.model('User', userSchema)



//Authentication Middleware

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}





// GET all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find()
    res.json(books)
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

// GET one book
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }
    res.json(book)
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' })
  }
})

// POST - create a book
app.post('/books', authMiddleware, async (req, res) => {
  try {
    const book = new Book(req.body)
    await book.save()
    res.status(201).json(book)
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message })
  }
})

// PUT - update a book
app.put('/books/:id', authMiddleware,  async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }
    res.json(book)
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' })
  }
})

// DELETE a book
app.delete('/books/:id', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id)
    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }
    res.json({ message: 'Book deleted!' })
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' })
  }
})


// Register
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({ email, password: hashedPassword })
    await user.save()

    res.status(201).json({ message: 'User registered successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message })
  }
})

//Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)

    res.json({ token })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message })
  }
})


app.listen(3000, () => {
  console.log('Server is running on port 3000')
})