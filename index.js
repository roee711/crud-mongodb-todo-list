const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const express = require('express')
const { MongoClient } = require("mongodb");
let collection = null;
const url = 'mongodb://localhost:27017';
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
        const connection = await MongoClient.connect(url, { useNewUrlParser: true });
        const db = connection.db('roee-todos');
     // await db.createCollection('todos');
        collection = db.collection('todos');
        const todos = await collection.find({}) .toArray();
        if(!todos.length)         {
            collection.insertMany(initialTodos);
        }

    } catch (e) {
        console.log('e', e);
    }
})();


const cors = require('cors');

const fs = require('fs').promises
const fileName = "./todo.json";

const store = {

    async read() {
        try {

            await fs.access(fileName);
            this.todos = JSON.parse((await fs.readFile(fileName)).toString());
        } catch (e) {
            this.todos = initialTodos;
        }
        return this.todos;
    },
    async save() {
        await fs.writeFile(fileName, JSON.stringify(this.todos));
    },
    async getIndexById(id) {
        try {
            const todos = await this.read();
            console.log(todos);
            return todos.findIndex(todo => todo.id === +id);
        } catch (e) {
            console.log(e);
        }
    },
    async getNextTodoId() {
        let maxId = 1;
        const todos = await this.read();

        if (todos.length > 0) {
            todos.forEach(todo => {
                if (todo.id > maxId) maxId = todo.id;
            });
            maxId = maxId + 1;
        }
        return maxId;

    },
    todos: []
}
const app = express();
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/todos', async (req, res) => {
    // res.json(await store.read());
    // res.json(await store.read());
    res.send(await collection.find({}).toArray());
});

app.get('/todos/deletes', async (req, res) => {

    try{
        const deleteRows =await collection.deleteMany();
        console.log("deleteRowsRemove",deleteRows);
        res.status(200).send(deleteRows.deletedCount.toString());
    }catch (e){
        res.status(500).send(e.message);
    }

 });

app.post('/todos', async (req, res) => {


    /*const todo = req.body;
    console.log(todo);
    todo.id = await store.getNextTodoId();
    store.todos.push(todo);
    await store.save();
    res.json('ok');*/

   const todos = await collection.find({}).toArray();
    let  maxId =0;
   if(todos.length){
       /*const  { id: maxId } = await collection
           .find({})
           .sort({ id: -1 })
           .next();*/

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

app.get('/todos/:id', async (req, res) => {
    console.log(req.params.id);
    /* const index = await store.getIndexById(req.params.id);
     if (index != -1) {

         res.json(store.todos[index] );
     } else {
         res.json('no');
     }*/
    const todo =await collection.findOne({ id: +req.params.id });
    if(todo){
        res.status(200).send(todo);
    }else{
        res.status(401).send("no");
    }
    console.log(todo);


});
app.put('/todos/:id', async (req, res) => {

    /*const index = await store.getIndexById(req.params.id);
    console.log(index);
    if (index != -1) {
        store.todos[index] = req.body;
        store.todos[index].id = req.params.id
        await store.save();
        res.json('ok');
    } else {
        res.json('no');
    }
    */
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
app.delete('/todos/:id', async (req, res) => {
   /* const index = await store.getIndexById(req.params.id);
    if (index != -1) {
        store.todos.splice(index, 1);
        await store.save();
        res.json('ok');
    } else {
        res.json('no');
    }*/
    try {
        await collection.deleteOne({ id: +req.params.id });
        res.status(200).json('OK!');
        } catch (e) {
        res.send(e);
        }

});
app.get('/testGet', async (req, res) => {
    console.log("testGet");
    const fetchResp = await fetch('http://localhost:3000/todos');
    const json = await fetchResp.json();
    res.send(json);
});


app.listen(3000, () => {
    console.log('Example app listening on port 3000')
});
