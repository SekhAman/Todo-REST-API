const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/todo');

mongoose.connect('mongodb://localhost/todos');

const app = express();
app.use(express.json());
const port = 3000;


mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});


countdocuments = async (filter, limit) => {
  try {

    const count = await Todo.countDocuments(filter);
        const totalpages = Math.ceil(count / limit);

        return { count, totalpages };
  } 
  catch (error) {
    throw new Error(error.message);
  }
};


// Define a route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the Express.js application!');
});

app.post('/todos', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    if (!todo.title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


app.get('/todos', async (req, res) => {
  const filter = {};
 

  if ( req.query.page !== undefined && isNaN(req.query.page ) || req.query.limit !== undefined && isNaN(req.query.limit) ) {
    res.status(400).json({ message: 'Invalid query parameter for page or limit. Please use a number.' });
    return;
  }
  if (req.query.page !== undefined && parseInt(req.query.page) < 1 || req.query.limit !== undefined && parseInt(req.query.limit) < 1) {
    res.status(400).json({ message: 'Invalid query parameter for page or limit. Please use a number greater than 0.' });
    return;
  }

  if(req.query.page !== undefined && req.query.page !== String(parseInt(req.query.page) ) || req.query.limit !== undefined && req.query.limit !== String(parseInt(req.query.limit)) ) {
    res.status(400).json({ message: 'Invalid query parameter for page or limit. Please use an integer.' });
    return;
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (req.query.done !== "true" && req.query.done !== "false" && req.query.done !== undefined) { res.status(400).json({ message: 'Invalid query parameter for done. Please use true or false.' }); return; }
  if (req.query.done !== undefined) {
    filter.done = req.query.done === 'true';
  }
 const sort = {};
  if (req.query.sort) {
    const sortField = req.query.sort;
    sort[sortField] = req.query.order === 'desc' ? -1 : 1; // 1 for ascending, -1 for descending
  }
  try {
    const todos = await Todo.find(filter).sort(sort).skip(skip).limit(limit);

    const { count, totalpages } = await countdocuments(filter, limit);

    res.json({
      todos: todos,
      total: count,
      totalPages: totalpages,
      currentPage: page,
      limit: limit});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.put('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(200).json({
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

 





// Start the server
app.listen(port, () => {
  console.log(`Application listening on port http://localhost:${port}`);
});