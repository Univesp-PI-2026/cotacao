require("dotenv").config();

const createApp = require("./app");

const app = createApp();
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`cotacao_v02 API rodando na porta ${port}`);
});
