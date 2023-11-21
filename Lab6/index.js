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
const LOGIN_REDIRECT_URL = process.env.APP_DOMAIN;
const LOGIN_URL = `https://${DOMAIN}/authorize?client_id=${CLIENT_ID}&redirect_uri=${LOGIN_REDIRECT_URL}&audience=${AUDIENCE}&response_type=code&response_mode=query`;

app.use(async (req, res, next) => {
    console.log("[Request url] - " + req.url)

    if (req && req.url === '/logout') {
        next();
    }

    const token = req.get('Authorization');
    console.log("[Request token] - " + token)

    if (token) {
        try {
            jwt.verify(token, await getToken(`https://${DOMAIN}/pem`), (err, decoded) => {
                if (err) {
                    return res.status(401).json({ message: "Invalid token." });
                }
                req.user = decoded;
                next();
            });
        } catch (e) {
            console.error('[Request error token]', e);
            next();
        }
    } else {
        next();
    }
});

async function getToken(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch public key: ${response.statusText}`);
    }

    return await response.text();
}

app.get('/', (req, res) => {
    if (req.user && req.user.sub) {
        return res.json({
            username: req.user.sub,
            logout: 'http://localhost:3000/logout'
        })
    }

    if (req.query.code) {
        return res.sendFile(path.join(__dirname+'/index.html'));
    }

    res.redirect(LOGIN_URL);
})

app.get('/logout', (req, res) => {
    res.json({ message: 'Logged out. Remove token from client.' });
});

app.post('/api/login', async (req, res) => {
    const { code } = req.body;
    console.log("[Login code] - " + code);

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('audience', AUDIENCE);
        params.append('redirect_uri', LOGIN_REDIRECT_URL);

        const response = await fetch(`https://${DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} Body: ${JSON.stringify(await response.json())}`);
        }

        const data = await response.json();
        const token = data['access_token'];
        return res.json({ token });
    } catch (error) {
        console.error('[LOGIN error]: ', error);
        res.status(401).send();
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})