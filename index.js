const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const express = require('express')
const { MongoClient } = require("mongodb");
const port =3000;
// Database login address  mongodb
const url = 'mongodb://localhost:27017';
const urlFetch =`http://localhost:${port}/todos`;
let collection = null;
// Default todo
const initialTodos = [
    {
        id: 1,
        title: 'Throw garbage',
        completed: false
    },
    {
        id: 2,
        title: 'Wash the dishes',
        completed: false
    }
];
(async () => {
    try {
        // Connecting to a database
        const connection = await MongoClient.connect(url, { useNewUrlParser: true });
        const db = connection.db('todos-list');
     // await db.createCollection('todos');
        collection = db.collection('todos');
        const todos = await collection.find({}) .toArray();
        if(!todos.length)
        {
            // Default content
            collection.insertMany(initialTodos);
        }

    } catch (e) {
        console.log('e', e);
    }
})();
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!')
});

//  get all todos

app.get('/todos', async (req, res) => {
    res.send(await collection.find({}).toArray());
});
//  remove all todos
app.get('/todos/deletes', async (req, res) => {

    try{
        const deleteRows =await collection.deleteMany();
        console.log("deleteRowsRemove",deleteRows);
        res.status(200).send(deleteRows.deletedCount.toString());
    }catch (e){
        res.status(500).send(e.message);
    }

 });
// add todos
app.post('/todos', async (req, res) => {

   let  maxId =0;
   const todos = await collection.find({}).toArray();
   if(todos.length){
       const  todo = await collection
               .find({})
               .sort({ id: -1 })
               .next();
        maxId =todo.id;

   }
    const { title, completed } = req.body;
    try {
        await collection.insertOne({ id: maxId + 1, title, completed });
        res.status(200).json('OK!');
    } catch (e) {
        res.send(e);
    }

});
// get todo by id
app.get('/todos/:id', async (req, res) => {
    const todo =await collection.findOne({ id: +req.params.id });
    if(todo){
        res.status(200).send(todo);
    }else{
        res.status(401).send("no");
    }
    console.log(todo);


});
// edit todo by id
app.put('/todos/:id', async (req, res) => {

    const { title, completed } = req.body;
    const update =await collection.updateOne(
        { id: +req.params.id },
        { $set: { title, completed } }
    );
    if(update.modifiedCount){
        res.status(200).json('OK!');
    }else{
        res.status(200).json('nO!');
    }

});
// remove todo by id
app.delete('/todos/:id', async (req, res) => {
    try {
        await collection.deleteOne({ id: +req.params.id });
        res.status(200).json('OK!');
        } catch (e) {
        res.send(e);
        }

});
// fetch todos
app.get('/testGet', async (req, res) => {
    const fetchResp = await fetch(urlFetch);
    const json = await fetchResp.json();
    res.send(json);
});
app.listen(port, () => {
    console.log(`Example app listening  http://localhost:${port}` )
});
