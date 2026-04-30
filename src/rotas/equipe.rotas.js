import { Router } from "express";
import equipeControlador from "../controladores/equipe.controlador.js";
import { autenticarParticipante } from "../middlewares/autenticacaoParticipante.middleware.js";

const router = Router();

router.get("/convites/:token", equipeControlador.buscarConvitePorToken);

router.post(
  "/convites/:token/aceitar",
  autenticarParticipante,
  equipeControlador.aceitarConvite
);

router.post(
  "/",
  autenticarParticipante,
  equipeControlador.criarEquipe
);

router.get(
  "/minhas",
  autenticarParticipante,
  equipeControlador.listarMinhasEquipes
);

router.delete(
  "/:id/membros/:membroId",
  autenticarParticipante,
  equipeControlador.removerMembroEquipe
);

router.get(
  "/:id",
  autenticarParticipante,
  equipeControlador.buscarEquipe
);

router.put(
  "/:id",
  autenticarParticipante,
  equipeControlador.atualizarEquipe
);

router.delete(
  "/:id",
  autenticarParticipante,
  equipeControlador.excluirEquipe
);

router.post(
  "/:id/convites",
  autenticarParticipante,
  equipeControlador.gerarConvite
);

export default router;