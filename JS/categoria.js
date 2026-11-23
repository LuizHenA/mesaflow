import {
    produtos,
    coresCategorias,
    slugify,
    formatarPreco,
    salvarProdutos,
    obterCategorias
} from "./produtos.js";

const parametros = new URLSearchParams(window.location.search);
const categoriaSlug = parametros.get("categoria") || "";

const categoriaAtual = obterCategorias()
    .find(categoria => slugify(categoria) === categoriaSlug);

const tituloCategoria = document.querySelector("#titulo-categoria");
const descricaoCategoria = document.querySelector("#descricao-categoria");
const listaProdutos = document.querySelector("#lista-produtos");
const campoPesquisa = document.querySelector("#pesquisa-produtos");

const modalProduto = document.querySelector("#modal-produto");
const modalExclusao = document.querySelector("#modal-exclusao");
const formularioProduto = document.querySelector("#form-produto");

const btnAdicionar = document.querySelector("#btn-adicionar");
const btnConfirmarExclusao = document.querySelector("#btn-confirmar-exclusao");

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

function obterProdutosDaCategoria() {
    return produtos.filter(produto =>
        (produto.categorias || []).includes(categoriaAtual)
    );
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
            ${Number(produto.avaliacao) > 0
            ? `<p class="produto-avaliacao">★ ${Number(produto.avaliacao).toFixed(1)} / 5</p>`
            : '<p class="produto-avaliacao">Ainda sem avaliações</p>'}
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
        renderizarProdutos();
    });

    return card;
}

function renderizarProdutos() {
    listaProdutos.innerHTML = "";

    const pesquisa = campoPesquisa.value.trim().toLowerCase();

    const encontrados = obterProdutosDaCategoria().filter(produto => {
        const texto = [
            produto.nome,
            produto.descricao,
            ...(produto.categorias || [])
        ].join(" ").toLowerCase();

        return texto.includes(pesquisa);
    });

    encontrados.forEach(produto => listaProdutos.appendChild(criarCard(produto)));

    if (!encontrados.length) {
        listaProdutos.innerHTML = '<p class="sem-produtos">Nenhum produto encontrado nesta categoria.</p>';
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

function abrirFormulario(produto = null) {
    produtoEmEdicao = produto;
    formularioProduto.reset();

    document.querySelector("#titulo-modal-produto").textContent =
        produto ? "Editar produto" : "Adicionar produto";

    document.querySelector("#produto-nome").value = produto?.nome || "";
    preencherSelectCategorias(produto?.categorias || (categoriaAtual ? [categoriaAtual] : []));
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

    if (!categorias.length) return;

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
    renderizarProdutos();
}

if (categoriaAtual) {
    tituloCategoria.textContent = categoriaAtual;
    descricaoCategoria.textContent = "Produtos disponíveis nesta categoria.";
    document.documentElement.style.setProperty(
        "--cor-categoria",
        coresCategorias[categoriaAtual] || "#35a853"
    );
} else {
    tituloCategoria.textContent = "Categoria não encontrada";
    descricaoCategoria.textContent = "Volte ao cardápio e escolha uma categoria.";
    btnAdicionar.disabled = true;
}

btnAdicionar.addEventListener("click", () => abrirFormulario());
formularioProduto.addEventListener("submit", salvarFormulario);
campoPesquisa.addEventListener("input", renderizarProdutos);

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
    renderizarProdutos();
});

document.querySelectorAll("[data-fechar]").forEach(botao => {
    botao.addEventListener("click", () => {
        document.getElementById(botao.dataset.fechar).close();
    });
});

renderizarProdutos();
