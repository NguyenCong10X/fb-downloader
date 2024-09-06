var express = require('express');
var router = express.Router();
const axios = require("axios")
const qs = require("qs")

const api = "https://fbload.online/download"
const csrfTokenUrl = "https://fbload.online";
/* GET home page. */
// router.get('/', function (req, res, next) {
//     res.render('index', {title: 'Express'});
// });
router.get('/proxy', async (req, res) => {
    const videoUrl = req.query.url;
    try {
        const response = await axios.get(videoUrl, {
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Failed to fetch video');
    }
});

router.get('/download', async function (req, res, next) {
    try {
        const { url } = req.query;
        console.log(`URL: ${url}`);

        // Step 1: Fetch the CSRF token and session cookies
        const csrfResponse = await axios.get(csrfTokenUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            },
            withCredentials: true
        });

        // Extract cookies and CSRF token
        const cookies = csrfResponse.headers['set-cookie'].join('; ');
        const csrfTokenMatch = csrfResponse.data.match(/name="csrf-token" content="([^"]+)"/);
        const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : null;

        if (!csrfToken) {
            throw new Error("CSRF token not found.");
        }
        console.log(`CSRF Token: ${csrfToken}`);
        console.log(`Cookies: ${cookies}`);

        // Step 2: Make the POST request with the CSRF token and session cookies
        const postResponse = await axios.post(api, `url=${encodeURIComponent(url)}`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-CSRF-Token": csrfToken,
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Referer": "https://fbload.online/",
                "Origin": "https://fbload.online",
                "Cookie": cookies // Ensure cookies are passed along with the POST request
            },
            withCredentials: true // Ensure cookies are included
        });

        console.log(postResponse.data);
        res.status(200).json(postResponse.data);
    } catch (e) {
        if (e.response) {
            console.log(`Response Error: ${e.response.status} - ${e.response.statusText}`);
            console.log(`Response Data: ${JSON.stringify(e.response.data)}`);
        } else {
            console.log(`Error: ${e.message}`);
        }
        res.status(500).json({
            status: 500,
            msg: "Internal Server Error"
        });
    }
});
module.exports = router;
