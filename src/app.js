import express from "express";
import cors from "cors";
import path from "path";
import campeonatoRotas from "./rotas/campeonato.rotas.js";
import inscricaoRotas from "./rotas/inscricao.rotas.js";
import chaveamentoRotas from "./rotas/chaveamento.rotas.js";
import placarRotas from "./rotas/placar.rotas.js";
import podioRotas from "./rotas/podio.rotas.js";
import resumoRotas from "./rotas/resumo.rotas.js";
import usuarioRotas from "./rotas/usuario.rotas.js";
import equipeRotas from "./rotas/equipe.rotas.js";
import adminRotas from "./rotas/admin.rotas.js";

const app = express();

app.use(cors());

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do sistema de campeonato de volei funcionando."
  });
});

app.use("/admin", adminRotas);
app.use("/usuarios", usuarioRotas);
app.use("/campeonatos", campeonatoRotas);
app.use("/campeonatos", inscricaoRotas);
app.use("/campeonatos", chaveamentoRotas);
app.use("/campeonatos", podioRotas);
app.use("/campeonatos", resumoRotas);
app.use("/", placarRotas);
app.use("/equipes", equipeRotas);

export { app };