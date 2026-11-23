import { produtos, coresCategorias, obterCategorias, slugify, formatarPreco, salvarProdutos, adicionarCategoria, renomearCategoria } from "./produtos.js";
const listaProdutos = document.querySelector("#lista-produtos");
const filtrosCategorias = document.querySelector("#filtros-categorias");
const campoPesquisa = document.querySelector("#pesquisa-produtos");

const modalProduto = document.querySelector("#modal-produto");
const modalExclusao = document.querySelector("#modal-exclusao");
const formularioProduto = document.querySelector("#form-produto");

const btnAdicionar = document.querySelector("#btn-adicionar");
const btnGerenciarCategorias = document.querySelector("#btn-gerenciar-categorias");
const modalCategorias = document.querySelector("#modal-categorias");
const formularioNovaCategoria = document.querySelector("#form-nova-categoria");
const listaCategorias = document.querySelector("#lista-categorias");
const mensagemCategorias = document.querySelector("#mensagem-categorias");
const btnConfirmarExclusao = document.querySelector("#btn-confirmar-exclusao");

const limitePopular = 4.5;
let categoriaSelecionada = "Todas";
let produtoSelecionado = null;
let produtoEmEdicao = null;
let produtoParaExcluir = null;

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


function obterProdutosDaSecao(categoria) {
    if (categoria === "Populares") {
        return produtos.filter(produto => Number(produto.avaliacao) >= limitePopular);
    }

    if (categoria === "Promocoes") {
        return produtos.filter(produto => produto.promocao);
    }

    return produtos.filter(produto => (produto.categorias || []).includes(categoria));
}

function criarCard(produto) {
    const card = document.createElement("article");
    card.className = "produto-card";
    card.dataset.id = produto.id;

    const seloPromocao = produto.promocao
        ? '<span class="selo-promocao">OFERTA</span>'
        : "";

    const preco = produto.promocao && produto.precoPromocional !== null && produto.precoPromocional !== undefined
        ? `<p class="produto-preco"><span class="preco-antigo">${formatarPreco(produto.preco)}</span>${formatarPreco(produto.precoPromocional)}</p>`
        : `<p class="produto-preco">${formatarPreco(produto.preco)}</p>`;

    card.innerHTML = `
        ${seloPromocao}
        <img src="${escaparHTML(produto.imagem || "")}" alt="${escaparHTML(produto.nome)}" onerror="this.style.display='none'">
        <div class="produto-conteudo">
            <h3>${escaparHTML(produto.nome)}</h3>
            ${preco}
            ${Number(produto.avaliacao) > 0 ? `<p class="produto-avaliacao">★ ${Number(produto.avaliacao).toFixed(1)} / 5</p>` : ""}
        </div>
        <div class="acoes-produto">
            <button type="button" class="btn-editar" data-acao="editar">Editar</button>
            <button type="button" class="btn-excluir" data-acao="excluir">Excluir</button>
        </div>
    `;

    if (Number(produtoSelecionado) === Number(produto.id)) {
        card.classList.add("selecionado");
    }

    card.addEventListener("click", event => {
        const acao = event.target.closest("button")?.dataset.acao;

        if (acao === "editar") {
            abrirFormulario(produto);
            return;
        }

        if (acao === "excluir") {
            produtoParaExcluir = produto;
            modalExclusao.showModal();
            return;
        }

        produtoSelecionado = produtoSelecionado === produto.id ? null : produto.id;
        renderizarCardapio();
    });

    return card;
}

function criarSecao(categoria, produtosDaSecao) {
    const secao = document.createElement("section");
    secao.className = "categoria-produtos";
    secao.style.setProperty("--cor-categoria", coresCategorias[categoria] || "#35a853");

    const titulo = categoria === "Promocoes" ? "Promoções" : categoria;
    const link = ["Populares", "Promocoes"].includes(categoria)
        ? ""
        : `<a href="./categoria.html?categoria=${slugify(categoria)}">Ver categoria →</a>`;

    secao.innerHTML = `
        <div class="categoria-cabecalho">
            <h2>${escaparHTML(titulo)}</h2>
            ${link}
        </div>
        <div class="produtos-horizontal"></div>
    `;

    const container = secao.querySelector(".produtos-horizontal");
    produtosDaSecao.forEach(produto => container.appendChild(criarCard(produto)));

    return secao;
}

function renderizarFiltros() {
    const categorias = ["Todas", "Populares", "Promocoes", ...obterCategorias()];
    filtrosCategorias.innerHTML = "";

    categorias.forEach(categoria => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = categoria === "Promocoes" ? "Promoções" : categoria;
        botao.classList.toggle("ativo", categoriaSelecionada === categoria);

        botao.addEventListener("click", () => {
            categoriaSelecionada = categoria;
            renderizarCardapio();
        });

        filtrosCategorias.appendChild(botao);
    });
}

function renderizarCardapio() {
    renderizarFiltros();
    listaProdutos.innerHTML = "";

    const pesquisa = campoPesquisa.value.trim().toLowerCase();
    let secoes = categoriaSelecionada === "Todas"
        ? ["Populares", "Promocoes", ...obterCategorias()]
        : [categoriaSelecionada];

    secoes.forEach(categoria => {
        const correspondentes = obterProdutosDaSecao(categoria).filter(produto => {
            const texto = [
                produto.nome,
                produto.descricao,
                ...(produto.categorias || [])
            ].join(" ").toLowerCase();

            return texto.includes(pesquisa);
        });

        if (correspondentes.length > 0) {
            listaProdutos.appendChild(criarSecao(categoria, correspondentes));
        }
    });

    if (!listaProdutos.children.length) {
        listaProdutos.innerHTML = '<p class="sem-produtos">Nenhum produto encontrado.</p>';
    }
}

function preencherSelectCategorias(categoriasSelecionadas = []) {
    const select = document.querySelector("#produto-categorias");
    select.innerHTML = "";

    obterCategorias().forEach(categoria => {
        const opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        opcao.selected = categoriasSelecionadas.includes(categoria);
        select.appendChild(opcao);
    });
}

function renderizarListaCategorias() {
    listaCategorias.innerHTML = "";

    obterCategorias().forEach(categoria => {
        const linha = document.createElement("div");
        linha.className = "linha-categoria-gerenciada";
        linha.innerHTML = `
            <input type="text" value="${escaparHTML(categoria)}" aria-label="Nome da categoria">
            <button type="button" class="btn-secundario" data-acao="salvar-categoria" data-categoria="${escaparHTML(categoria)}">Salvar</button>
        `;
        listaCategorias.appendChild(linha);
    });
}

function abrirFormulario(produto = null) {
    produtoEmEdicao = produto;
    formularioProduto.reset();

    document.querySelector("#titulo-modal-produto").textContent =
        produto ? "Editar produto" : "Adicionar produto";

    document.querySelector("#produto-nome").value = produto?.nome || "";
    preencherSelectCategorias(produto?.categorias || []);
    document.querySelector("#produto-descricao").value = produto?.descricao || "";
    document.querySelector("#produto-preco").value = produto?.preco ?? "";
    document.querySelector("#produto-avaliacao").value = produto?.avaliacao ?? 0;
    document.querySelector("#produto-imagem").value = produto?.imagem || "";
    document.querySelector("#produto-promocao").checked = Boolean(produto?.promocao);
    document.querySelector("#produto-preco-promocional").value = produto?.precoPromocional ?? "";

    modalProduto.showModal();
}

function salvarFormulario(event) {
    event.preventDefault();

    const categorias = [...document.querySelector("#produto-categorias").selectedOptions]
        .map(opcao => opcao.value);

    if (!categorias.length) {
        return;
    }

    const dados = {
        nome: document.querySelector("#produto-nome").value.trim(),
        categorias,
        descricao: document.querySelector("#produto-descricao").value.trim(),
        preco: document.querySelector("#produto-preco").value === ""
            ? null : Number(document.querySelector("#produto-preco").value),
        avaliacao: Number(document.querySelector("#produto-avaliacao").value) || 0,
        imagem: document.querySelector("#produto-imagem").value.trim(),
        promocao: document.querySelector("#produto-promocao").checked,
        precoPromocional: document.querySelector("#produto-preco-promocional").value === ""
            ? null : Number(document.querySelector("#produto-preco-promocional").value)
    };

    if (produtoEmEdicao) {
        Object.assign(produtoEmEdicao, dados);
    } else {
        const novoId = produtos.length
            ? Math.max(...produtos.map(produto => Number(produto.id))) + 1
            : 1;

        produtos.push({ id: novoId, ...dados });
    }

    salvarProdutos();
    modalProduto.close();
    produtoSelecionado = null;
    renderizarCardapio();
}

btnGerenciarCategorias.addEventListener("click", () => {
    mensagemCategorias.textContent = "";
    renderizarListaCategorias();
    modalCategorias.showModal();
});

formularioNovaCategoria.addEventListener("submit", event => {
    event.preventDefault();
    const campo = document.querySelector("#nova-categoria");
    const adicionada = adicionarCategoria(campo.value);

    if (!adicionada) {
        mensagemCategorias.textContent = "Digite um nome válido e que ainda não esteja cadastrado.";
        return;
    }

    campo.value = "";
    mensagemCategorias.textContent = "Categoria adicionada com sucesso.";
    renderizarListaCategorias();
    renderizarCardapio();
});

listaCategorias.addEventListener("click", event => {
    const botao = event.target.closest('[data-acao="salvar-categoria"]');
    if (!botao) return;

    const linha = botao.closest(".linha-categoria-gerenciada");
    const campo = linha.querySelector("input");
    const nomeAntigo = botao.dataset.categoria;
    const nomeNovo = campo.value;

    if (nomeAntigo === nomeNovo.trim()) {
        mensagemCategorias.textContent = "Nenhuma alteração foi feita.";
        return;
    }

    if (!renomearCategoria(nomeAntigo, nomeNovo)) {
        mensagemCategorias.textContent = "Não foi possível renomear. Verifique se o nome está vazio ou já existe.";
        return;
    }

    if (categoriaSelecionada === nomeAntigo) categoriaSelecionada = nomeNovo.trim();

    mensagemCategorias.textContent = "Categoria atualizada com sucesso.";
    renderizarListaCategorias();
    renderizarCardapio();
});

btnAdicionar.addEventListener("click", () => abrirFormulario());
formularioProduto.addEventListener("submit", salvarFormulario);
campoPesquisa.addEventListener("input", renderizarCardapio);

btnConfirmarExclusao.addEventListener("click", () => {
    if (!produtoParaExcluir) return;

    const indice = produtos.findIndex(produto => produto.id === produtoParaExcluir.id);

    if (indice !== -1) {
        produtos.splice(indice, 1);
        salvarProdutos();
    }

    produtoParaExcluir = null;
    produtoSelecionado = null;
    modalExclusao.close();
    renderizarCardapio();
});

document.querySelectorAll("[data-fechar]").forEach(botao => {
    botao.addEventListener("click", () => {
        document.getElementById(botao.dataset.fechar).close();
    });
});

renderizarCardapio();
