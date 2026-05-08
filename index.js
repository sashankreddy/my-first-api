require('dotenv').config()


const express = require('express')
const mongoose = require('mongoose')

const app = express()
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('Connection failed:', err))

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: false }
})

const Book = mongoose.model('Book', bookSchema)





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
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body)
    await book.save()
    res.status(201).json(book)
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message })
  }
})

// PUT - update a book
app.put('/books/:id', async (req, res) => {
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
app.delete('/books/:id', async (req, res) => {
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

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})