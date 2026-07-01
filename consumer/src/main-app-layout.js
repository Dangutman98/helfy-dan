const { Kafka } = require("kafkajs");
const log4js = require("log4js");

log4js.configure({
  appenders: { out: { type: "stdout" } },
  categories: { default: { appenders: ["out"], level: "info" } }
});
const logger = log4js.getLogger();
const kafka = new Kafka({ brokers: ["kafka:9092"] });

async function main() {
  const consumer = kafka.consumer({ groupId: "cdc-consumer" });
  
  while (true) {
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: "dbserver1.home-test.users", fromBeginning: true });
      await consumer.subscribe({ topic: "dbserver1.home-test.user_tokens", fromBeginning: true });
      break;
    } catch (err) {
      console.log("Waiting for Kafka and database topics to be ready...");
      await new Promise(function (resolve) {
        setTimeout(resolve, 5000);
      });
    }
  }

  await consumer.run({
    eachMessage: async function (payload) {
      const topic = payload.topic;
      const message = payload.message;
      
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString());
        logger.info(JSON.stringify({
          action: "database_change",
          topic: topic,
          data: event.payload
        }));
      } catch (err) {
        logger.error("Failed to parse database change message: " + err.message);
      }
    }
  });
}

main();
