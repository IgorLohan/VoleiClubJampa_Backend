import { Router } from "express";
import chaveamentoControlador from "../controladores/chaveamento.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.patch("/:id/encerrar-inscricoes", autenticarAdmin, chaveamentoControlador.encerrarInscricoes);
router.patch("/:id/reabrir-inscricoes", autenticarAdmin, chaveamentoControlador.reabrirInscricoes);
router.post("/:id/chaveamento", autenticarAdmin, chaveamentoControlador.gerarChaveamento);
router.get("/:id/jogos", chaveamentoControlador.listarJogos);
router.patch("/:id/reabrir-inscricoes", autenticarAdmin, chaveamentoControlador.reabrirInscricoes);
export default router;