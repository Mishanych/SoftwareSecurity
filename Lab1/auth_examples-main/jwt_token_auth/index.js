const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const JWT_SECRET = 'ms';

app.use((req, res, next) => {
    console.log(req.url)
    if (req && req.url === '/logout') {
        next();
    }
    const token = req.get('Authorization');
    console.log(token);
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token." });
            }
            req.user = decoded;
            next();
        });
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    if (req.user && req.user.username) {
        return res.json({
            username: req.user.username,
            logout: 'http://localhost:3000/logout'
        })
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    res.json({ message: 'Logged out. Remove token from client.' });
});

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'Login1',
        password: 'Password1',
        username: 'Username1',
    }
]

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const user = users.find((user) => {
        if (user.login == login && user.password == password) {
            return true;
        }
        return false
    });

    if (user) {
        const token = jwt.sign({ username: user.username, login: user.login }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }

    res.status(401).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
