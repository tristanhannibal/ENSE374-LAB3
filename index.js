const User = require("./user.js");
const Task = require("./task.js");
var fs = require('fs');
bodyParser = require('body-parser');
const express = require("express");
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
const port = 3333;
app.listen(port, function () {
    console.log(' server is running ' + port);
});

app.use(bodyParser.urlencoded({ extended: true }));

const AUTH_VALUE = '123'; // Auth code for signup


createFileWX('./todo.json');
var jsonDatabase = JSON.parse(fs.readFileSync('./todo.json', 'utf8'));

app.get('/', function (req, res) {
    res.render('login', { errorLogin: false, errorSignup: false });
});


//only registers if email doesn't already exist, and auth code is correct
app.post('/register', function (req, res) {
    let auth = req.body.authentication;
    let email = req.body.email;
    let password = req.body.password;

    for (var user of jsonDatabase['Users']) {
        if (email == user.username) {
            res.render('login', { errorLogin: false, errorSignup: true });
            return;

        }

    }
    if (auth != AUTH_VALUE) {
        res.render('login', { errorLogin: false, errorSignup: true });

    }
    else {
        userAdded = new User(email, password);
        jsonDatabase['Users'].push(userAdded);
        fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
        res.render('todo', { email: email, taskDatabase: jsonDatabase['Tasks'] });
    }

});



//verifies user is allowed to login then redirects to todo page if allowed
app.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    for (var user of jsonDatabase['Users']) {
        if (email == user.username) {
            if (password == user.password) {
                res.redirect(307, "/todo");
                return;
            }
            else {
                signInError = true;
            }

        }

    }
    res.render('login', { errorLogin: true, errorSignup: false });
});



app.post('/todo', function (req, res) {
    var email = req.body.email;
    res.render('todo', { email: email, taskDatabase: jsonDatabase['Tasks'] });
});


app.post('/unfinish', function (req, res) {
    var id = req.body.postID;
    var email = req.body.email;
    for (var i = 0; i < jsonDatabase['Tasks'].length; i++) {
        if (jsonDatabase['Tasks'][i].id == id) {
            jsonDatabase['Tasks'][i].done = false;
        }
    }
    fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
    res.redirect(307, "/todo");

});


app.post('/abandonorcomplete', function (req, res) {
    var id = req.body.postID;
    var abandon = req.body.abandon;
    var email = req.body.email;

    for (var i = 0; i < jsonDatabase['Tasks'].length; i++) {
        if (jsonDatabase['Tasks'][i].id == id) {
            var index = i;
        }
    }
    //if abandon is set then we abandon, else we know we are changing the done condition
    if (abandon) {
        delete jsonDatabase['Tasks'][index].owner;

    } else {
        jsonDatabase['Tasks'][index].done = true;

    }

    fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
    res.redirect(307, "/todo");
});


//claims task
app.post('/claim', function (req, res) {

    var id = req.body.postID;
    var email = req.body.currentUser;
    var index = findJsonIndex(jsonDatabase['Tasks'], id);
    jsonDatabase['Tasks'][index].owner = email;
    fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
    res.render('todo', { email: email, taskDatabase: jsonDatabase['Tasks'] });


});

//adds task and automatically claims.
app.post('/addtask', function (req, res) {
    let entry = req.body.newTodo;
    let user = req.body.currentUser;

    let jsonSize = jsonDatabase['Tasks'].length;

    let nextIndex = (jsonDatabase['Tasks'][jsonSize - 1]['id']) + 1;

    taskAdded = new Task(nextIndex, entry, user, user, false, false);
    jsonDatabase['Tasks'].push(taskAdded);
    fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
    res.render('todo', { email: user, taskDatabase: jsonDatabase['Tasks'] });





});
//deletes all done tasks for logged in user
app.post('/purge', function (req, res) {
    let user = req.body.currentUser;


    for (var i = 0; i < jsonDatabase['Tasks'].length; i++) {
        if (jsonDatabase['Tasks'][i].owner == user && jsonDatabase['Tasks'][i].done == true) {
            jsonDatabase['Tasks'][i].cleared = true;
        }

    }

    fs.writeFileSync('./todo.json', JSON.stringify(jsonDatabase));
    res.render('todo', { email: user, taskDatabase: jsonDatabase['Tasks'] });
    //res.redirect(307, "/todo");


});


//logout by going to login page, no session variables 
app.get('/logout', function (req, res) {
    res.redirect(307, "/");
});



//finds the index by match id to id
function findJsonIndex(json, id) {
    for (var i = 0; i < json.length; i++) {
        if (json[i].id == id) {
            return i;
        }
    }

    return -1;

}

//only creates file if not exist
function createFileWX(filename) {
    json = createJsonString();
    try {
        fs.writeFileSync(filename, json, { flag: 'wx' });
    }
    catch (errs) {

    }

}


//create json string for wanted cases in lab 3
function createJsonString() {
    var jsonStoreOjbect = {
        Users: [],
        Tasks: []
    };

    jsonStoreOjbect.Users.push({
        username: "user1@a.com",
        password: "password1"
    });
    jsonStoreOjbect.Users.push({
        username: "user2@b.com",
        password: "password2"
    });

    jsonStoreOjbect.Tasks.push({
        id: 1,
        name: "claimed by user1 and unfinished",
        owner: "user1@a.com",
        creator: "user1",
        done: false,
        cleared: false
    });
    jsonStoreOjbect.Tasks.push({
        id: 2,
        name: "claimed by user2 and unfinished",
        owner: "user2@b.com",
        creator: "user1@a.com",
        done: false,
        cleared: false
    });
    jsonStoreOjbect.Tasks.push({
        id: 3,
        name: "claimed by user1 and finished",
        owner: "user1@a.com",
        creator: "user2@b.com",
        done: true,
        cleared: false
    });
    jsonStoreOjbect.Tasks.push({
        id: 4,
        name: "claimed by user2 and finished",
        owner: "user2@b.com",
        creator: "user2@b.com",
        done: true,
        cleared: false
    });
    jsonStoreOjbect.Tasks.push({
        id: 5,
        name: "unclaimed",
        creator: "user2@b.com",
        done: false,
        cleared: false
    });

    var jsonString = JSON.stringify(jsonStoreOjbect);
    return jsonString;


};