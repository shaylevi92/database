const fs = require("fs");

const express = require("express");

const app = express();

const { v4: uuidv4 } = require("uuid");

const mongoose = require("mongoose");

const cors = require("cors");

require("dotenv").config();

app.use(express.static("client/build"));
app.use(express.json());
app.use(cors());

const todoSchema = new mongoose.Schema({
  title: String,
  userId: String,
  completed: Boolean,
});

const Todo = mongoose.model("Todo", todoSchema);

app.get("/", (req, res) => {
  res.send("Hi!");
});

app.get("/api/todos", (req, res) => {
  const { title } = req.query;

  Todo.find((err, todos) => {
    if (title) {
      todos = todos.filter(
        (todo) =>
          todo.title && todo.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    res.send(todos);
  });
});

app.get("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  Todo.findById(id, (err, todo) => {
    res.send(todo);
  });
});

app.post("/api/todos", (req, res) => {
  const { title } = req.body;

  const todo = new Todo({ title, completed: false, userId: "1" });

  todo.save((err, todo) => {
    res.send(todo);
  });
});

app.put("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  const { title, userId } = req.body;

  const updatedFields = {};
  title ? (updatedFields.title = title) : null;
  userId ? (updatedFields.userId = userId) : null;

  Todo.findByIdAndUpdate(id, updatedFields, { new: true }, (err, todo) => {
    res.send(todo);
  });
});

app.delete("/api/todos/:id", (req, res) => {
  try {
    const { id } = req.params;
    Todo.findByIdAndDelete(id, (err, todo) => {
      console.log(todo);
      res.send(todo);
    });
  } catch (error) {
    res.send("Not found");
  }
});

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/client/build/index.html");
});

function initTodos() {
  Todo.findOne((err, todo) => {
    if (!todo) {
      fs.readFile("./initialTodos.json", "utf8", (err, data) => {
        let initialTodos = JSON.parse(data);
        initialTodos = initialTodos.map((todo) => ({ ...todo, id: uuidv4() }));

        Todo.insertMany(initialTodos, (err, todos) => {});
      });
    }
  });
}

initTodos();

const { DB_USER, DB_PASS, DB_HOST, DB_NAME } = process.env;

mongoose.connect(
  `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
  () => {
    app.listen(process.env.PORT || 8080);
  }
);
