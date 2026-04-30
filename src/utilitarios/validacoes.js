function validarJogadoresPorCategoria(tipoParticipante, categoria, jogadores) {
  if (!Array.isArray(jogadores) || jogadores.length === 0) {
    return "A lista de jogadores é obrigatória.";
  }

  const homens = jogadores.filter((jogador) => jogador.genero === "M").length;
  const mulheres = jogadores.filter((jogador) => jogador.genero === "F").length;

  const todosTemNome = jogadores.every(
    (jogador) => jogador.nome && jogador.nome.trim() !== ""
  );

  const todosTemGeneroValido = jogadores.every(
    (jogador) => jogador.genero === "M" || jogador.genero === "F"
  );

  if (!todosTemNome) {
    return "Todos os jogadores precisam ter nome.";
  }

  if (!todosTemGeneroValido) {
    return 'Todos os jogadores precisam ter gênero "M" ou "F".';
  }

  if (tipoParticipante === "DUPLA") {
    if (jogadores.length !== 2) {
      return "Uma dupla precisa ter exatamente 2 jogadores.";
    }

    if (categoria === "MASCULINO" && homens !== 2) {
      return "Na categoria masculina, a dupla precisa ter 2 homens.";
    }

    if (categoria === "FEMININO" && mulheres !== 2) {
      return "Na categoria feminina, a dupla precisa ter 2 mulheres.";
    }

    if (categoria === "MISTA" && !(homens === 1 && mulheres === 1)) {
      return "Na categoria mista, a dupla precisa ter 1 homem e 1 mulher.";
    }
  }

  if (tipoParticipante === "TIME") {
    if (categoria === "MASCULINO" && mulheres > 0) {
      return "Na categoria masculina, o time deve ser formado apenas por homens.";
    }

    if (categoria === "FEMININO" && homens > 0) {
      return "Na categoria feminina, o time deve ser formado apenas por mulheres.";
    }

    if (categoria === "MISTA") {
      if (jogadores.length !== 4) {
        return "Na categoria mista por time, o time precisa ter exatamente 4 jogadores.";
      }

      if (!(homens === 2 && mulheres === 2)) {
        return "Na categoria mista, o time precisa ter 2 homens e 2 mulheres.";
      }
    }
  }

  return null;
}

export { validarJogadoresPorCategoria };