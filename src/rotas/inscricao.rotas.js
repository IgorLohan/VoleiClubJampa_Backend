import { Router } from "express";
import inscricaoControlador from "../controladores/inscricao.controlador.js";
import inscricaoIndividualControlador from "../controladores/inscricaoIndividual.controlador.js";
import { autenticarParticipante } from "../middlewares/autenticacaoParticipante.middleware.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.post(
  "/:id/inscricoes",
  autenticarParticipante,
  inscricaoControlador.inscrever
);

router.post(
  "/:id/inscricoes-individuais",
  autenticarParticipante,
  inscricaoIndividualControlador.criar
);

router.get(
  "/:id/inscricoes-individuais",
  autenticarAdmin,
  inscricaoIndividualControlador.listarPorCampeonato
);

router.post(
  "/:id/inscricoes-individuais/montar-equipe",
  autenticarAdmin,
  inscricaoIndividualControlador.montarEquipe
);

router.patch(
  "/inscricoes-individuais/:inscricaoId/aprovar",
  autenticarAdmin,
  inscricaoIndividualControlador.aprovarInscricao
);

router.patch(
  "/inscricoes-individuais/:inscricaoId/reprovar",
  autenticarAdmin,
  inscricaoIndividualControlador.reprovarInscricao
);

router.patch(
  "/inscricoes-individuais/:inscricaoId",
  autenticarAdmin,
  inscricaoIndividualControlador.atualizarInscricao
);

router.delete(
  "/inscricoes-individuais/:inscricaoId",
  autenticarAdmin,
  inscricaoIndividualControlador.excluirInscricao
);

router.get(
  "/:id/minha-inscricao-individual",
  autenticarParticipante,
  inscricaoIndividualControlador.buscarMinhaInscricao
);

router.get(
  "/:id/inscricoes",
  inscricaoControlador.listarPorCampeonato
);

router.put(
  "/inscricoes/:id",
  autenticarAdmin,
  inscricaoControlador.atualizar
);

router.delete(
  "/inscricoes/:id",
  autenticarAdmin,
  inscricaoControlador.excluir
);

export default router;