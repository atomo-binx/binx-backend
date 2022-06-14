const {
  EventBridgeClient,
  ListRulesCommand,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} = require("@aws-sdk/client-eventbridge");

const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "../../.env" });

const client = new EventBridgeClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

async function listRules(eventBusName) {
  const params = {
    EventBusName: eventBusName,
  };

  const command = new ListRulesCommand(params);

  client
    .send(command)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log("Falha:", error.message);
    });
}

async function describeRules(eventBusName, ruleName) {
  const params = {
    EventBusName: eventBusName,
    Name: ruleName,
  };

  const command = new DescribeRuleCommand(params);

  client
    .send(command)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log("Falha:", error.message);
    });
}

async function listTargetsByRule(eventBusName, ruleName) {
  const params = {
    EventBusName: eventBusName,
    Rule: ruleName,
  };

  const command = new ListTargetsByRuleCommand(params);

  client
    .send(command)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log("Falha:", error.message);
    });
}

listRules("default");
describeRules("default", "aprovacaoAutomatica");
listTargetsByRule("default", "aprovacaoAutomatica");
