const {
  QuickSightClient,
  ListDashboardsCommand,
  GetDashboardEmbedUrlCommand,
} = require("@aws-sdk/client-quicksight");

const client = new QuickSightClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.COGNITO_REGION,
});

module.exports = {
  async listarDashboards() {
    return new Promise((resolve, reject) => {
      const params = {
        AwsAccountId: process.env.AWS_ACCOUNT_ID,
      };

      const command = new ListDashboardsCommand(params);

      client
        .send(command)
        .then((result) => resolve(result.DashboardSummaryList))
        .catch((error) => reject(error));
    });
  },

  async adquirirDashboardUrl(dashboardId) {
    return new Promise((resolve, reject) => {
      const params = {
        AwsAccountId: process.env.AWS_ACCOUNT_ID,
        DashboardId: dashboardId,
        IdentityType: "IAM",
      };

      const command = new GetDashboardEmbedUrlCommand(params);

      client
        .send(command)
        .then((result) => resolve(result.EmbedUrl))
        .catch((error) => reject(error));
    });
  },
};
