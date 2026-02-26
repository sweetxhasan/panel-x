const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

// User agents pool for human-like behavior
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

router.post('/start', async (req, res) => {
    try {
        const { url, proxy, autoMode } = req.body;
        
        // Launch browser with stealth settings
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1280,720',
                proxy ? `--proxy-server=${proxy}` : ''
            ]
        });

        const page = await browser.newPage();
        
        // Set random user agent
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        await page.setUserAgent(userAgent);
        
        // Set extra headers to look like real browser
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        // WebDriver detection bypass
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            
            // Add chrome runtime
            window.chrome = {
                runtime: {}
            };
        });

        // Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Cloudflare detection & bypass
        const bypassResult = await handleCloudflare(page);
        
        // Send back browser info for streaming
        res.json({
            success: true,
            message: 'Bypass started',
            browserInfo: {
                userAgent: userAgent,
                url: page.url()
            }
        });

        // Keep browser alive for streaming
        global.activeBrowser = browser;

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function handleCloudflare(page) {
    try {
        // Check for Cloudflare
        const isCloudflare = await page.evaluate(() => {
            return document.title.includes('Just a moment') || 
                   document.body.innerText.includes('Checking your browser') ||
                   document.querySelector('#cf-content') !== null;
        });

        if (isCloudflare) {
            console.log('⏳ Cloudflare detected, solving...');
            
            // Wait for Cloudflare challenge to appear
            await page.waitForSelector('#challenge-form, #cf-content', { timeout: 5000 })
                .catch(() => null);

            // Simulate human behavior
            await page.mouse.move(100, 100);
            await page.mouse.move(200, 200);
            
            // Wait for automatic solving
            await page.waitForNavigation({ 
                waitUntil: 'networkidle2', 
                timeout: 15000 
            }).catch(() => {});

            // Check if solved
            const solved = await page.evaluate(() => {
                return !document.title.includes('Just a moment');
            });

            if (solved) {
                console.log('✅ Cloudflare bypassed!');
                return { success: true, message: 'Cloudflare bypassed' };
            }
        }

        return { success: true, message: 'No Cloudflare detected' };

    } catch (error) {
        console.error('Cloudflare handling error:', error);
        return { success: false, error: error.message };
    }
}

router.post('/next-step', async (req, res) => {
    try {
        const { step, action } = req.body;
        
        if (!global.activeBrowser) {
            return res.status(400).json({ error: 'No active browser' });
        }

        const pages = await global.activeBrowser.pages();
        const page = pages[0];

        switch(action) {
            case 'click':
                await page.click(req.body.selector);
                break;
            case 'wait':
                await page.waitForTimeout(req.body.timeout || 2000);
                break;
            case 'screenshot':
                const screenshot = await page.screenshot({ encoding: 'base64' });
                res.json({ screenshot });
                return;
            case 'reload':
                await page.reload({ waitUntil: 'networkidle2' });
                break;
        }

        res.json({ 
            success: true, 
            url: page.url(),
            title: await page.title()
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
