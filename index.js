const express = require("express");
const Redis = require("ioredis");
const { Queue } = require("bullmq")

const app = express();
app.use(express.json());


const connection = { host: "127.0.0.1", port: 6379 };
const redis = new Redis(connection);
const emailQueue = new Queue("order-emails", { connection });

// Purana /product/:id caching route yahan waise hi rehne dein...

app.post("/order", async (req, res) => {
  const { email, item } = req.body;
  const orderId = Math.floor(1000 + Math.random() * 9000);

  // Slow email kaam seedha yahan karne ke bajaye Queue mein daal diya
  await emailQueue.add("send-confirmation", { orderId, email, item });

  // User ko turant fast response mil gaya
  return res.json({
    message: "Order placed! Confirmation email thodi der mein aa jayega.",
    orderId,
  });
});
// Simulates a slow database query (2 seconds)
const fetchFromDB = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    id,
    name: `Product ${id}`,
    price: 499,
    fetchedAt: new Date().toISOString(),
  };
};

app.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;

  // 1. Check Redis first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ source: "redis-cache", data: JSON.parse(cached) });
  }

  // 2. Cache miss -> fetch from DB
  const freshData = await fetchFromDB(id);

  // 3. Store in Redis with a 60-second TTL (expiry)
  await redis.set(cacheKey, JSON.stringify(freshData), "EX", 60);

  return res.json({ source: "database", data: freshData });
});

app.listen(8000, () => console.log("Server running on http://localhost:3000"));