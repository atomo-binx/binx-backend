module.exports = {
  development: {
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST_NAME,
    dialect: "mysql",
    logging: false,
    useUTC: true, // for reading from database
    // dialectOptions: {
    // },
    // query: {
    //   raw: true,
    //   nest: true,
    // },
  },
  production: {
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST_NAME,
    dialect: "mysql",
    logging: false,
    // query: {
    //   raw: true,
    //   nest: true,
    // },
  },
};
