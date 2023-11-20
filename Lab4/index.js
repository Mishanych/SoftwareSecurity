const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const DOMAIN = process.env.DOMAIN;
const AUDIENCE = process.env.AUDIENCE;


app.use((req, res, next) => {
    console.log(req.url)

    if (req && req.url === '/logout') {
        next();
    }
    const token = req.get('Authorization');

    console.log(token);
    if (token) {
        req.user = jwt.decode(token);
        next();
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    if (req.user && req.user.sub) {
        return res.json({
            username: req.user.sub,
            logout: 'http://localhost:3000/logout'
        })
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    res.json({ message: 'Logged out. Token from client was removed' });
});

app.post('/api/login', async(req, res) => {
    const { login, password } = req.body;

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', login);
        params.append('password', password);
        params.append('audience', AUDIENCE);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);

        const response = await fetch(`https://${DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const token = data['access_token'];
        return res.json({ token });
    } catch (error) {
        console.error('Error:', error);
        res.status(401).send();
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})