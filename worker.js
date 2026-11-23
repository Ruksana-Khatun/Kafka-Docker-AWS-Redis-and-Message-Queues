const { Worker } = require("bullmq");

const connection = { host: "127.0.0.1", port: 6379 };

const worker = new Worker(
  "order-emails",
  async (job) => {
    console.log(`[Worker] Job #${job.id} mila -> Email bhej raha hoon: ${job.data.email}`);

   
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log(`[Worker] Job #${job.id} DONE! Order #${job.data.orderId} ka email chala gaya.`);
  },
  { connection }
);

console.log("Worker chalu hai aur jobs ka wait kar raha hai...");