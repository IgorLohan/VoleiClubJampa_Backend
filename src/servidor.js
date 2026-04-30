import "dotenv/config";
import { app } from "./app.js";
import adminRotas from "./rotas/admin.rotas.js";

app.use("/admin", adminRotas);

const PORTA = process.env.PORT || process.env.PORTA || 3333;

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});