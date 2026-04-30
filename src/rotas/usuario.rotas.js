import { Router } from "express";
import usuarioControlador from "../controladores/usuario.controlador.js";
import { autenticarParticipante } from "../middlewares/autenticacaoParticipante.middleware.js";
import { uploadFotoPerfil } from "../middlewares/uploadFotoPerfil.middleware.js";

const router = Router();

router.post("/cadastro", usuarioControlador.cadastro);
router.post("/login", usuarioControlador.login);

router.get("/verificar-email", usuarioControlador.verificarEmail);
router.post("/reenviar-verificacao", usuarioControlador.reenviarEmailVerificacao);

router.get("/perfil", autenticarParticipante, usuarioControlador.perfil);

router.put(
  "/perfil",
  autenticarParticipante,
  usuarioControlador.atualizarPerfil
);

router.patch(
  "/perfil/foto",
  autenticarParticipante,
  uploadFotoPerfil.single("foto"),
  usuarioControlador.atualizarFotoPerfil
);

router.get(
  "/minhas-inscricoes",
  autenticarParticipante,
  usuarioControlador.minhasInscricoes
);

export default router;