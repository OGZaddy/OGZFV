const express = require('express');
const app = express();
app.use(express.json());

app.get('/trades/:userId', async (req, res) => {
    const userId = req.params.userId;
    const trades = await getTrades(userId);
    res.json(trades);
});

app.post('/trades/:userId', async (req, res) => {
    const userId = req.params.userId;
    const tradeData = req.body;
    await saveTrade(userId, tradeData);
    res.json({ success: true });
});

app.listen(3000, () => console.log('API running on port 3000'));