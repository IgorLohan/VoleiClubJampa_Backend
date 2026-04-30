function embaralharLista(lista) {
  const novaLista = [...lista];

  for (let i = novaLista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [novaLista[i], novaLista[j]] = [novaLista[j], novaLista[i]];
  }

  return novaLista;
}

export { embaralharLista };