
const modalAtivacao = document.querySelector("#modal-dialog");
const modalMesa = document.querySelector("#modal-mesa");

const inputCliente = document.querySelector("#nome-cliente");

const btnConfirmar = document.querySelector("#confirmar-ativacao");
const btnCancelar = document.querySelector("#cancelar-ativacao");
const btnFecharDetalhes = document.querySelector("#fechar-detalhes");
const btnDesativar = document.querySelector("#desativar-mesa");

const detalheTitulo = document.querySelector("#detalhe-titulo");
const detalheStatus = document.querySelector("#detalhe-status");
const detalheCliente = document.querySelector("#detalhe-cliente");
const detalhePedido = document.querySelector("#detalhe-pedido");

let mesaSelecionada = null;

function abrirDetalhes(mesa) {

    const numero = mesa.dataset.mesa;
    const status = mesa.dataset.status;
    const cliente = mesa.dataset.cliente || "Nenhum";
    const pedido = mesa.dataset.pedido || "Sem pedidos";

    detalheTitulo.textContent = `Mesa ${numero}`;
    detalheStatus.textContent = `Status: ${status}`;
    detalheCliente.textContent = `Cliente: ${cliente}`;
    detalhePedido.textContent = `Pedido: ${pedido}`;

    btnDesativar.hidden = status !== "Ativa";

    mesaSelecionada = mesa;

    modalMesa.showModal();

}

document.querySelectorAll(".mesa-card").forEach((mesa) => {

    const botao = mesa.querySelector(".btn-ativar");


    mesa.addEventListener("click", (event) => {

        if (event.target.closest("button")) {
            return;
        }

        abrirDetalhes(mesa);

    });

    botao.addEventListener("click", () => {

        if (mesa.dataset.status === "Ativa") {

            abrirDetalhes(mesa);

        } else {

            mesaSelecionada = mesa;
            inputCliente.value = "";
            modalAtivacao.showModal();

        }

    });

});

btnCancelar.addEventListener("click", () => {

    modalAtivacao.close();

});

btnConfirmar.addEventListener("click", () => {

    const nomeCliente = inputCliente.value.trim();

    if (nomeCliente === "") {
        alert("Digite o nome do cliente.");
        return;
    }

    mesaSelecionada.classList.remove("disponivel");
    mesaSelecionada.classList.add("ativa");

    mesaSelecionada.dataset.status = "Ativa";
    mesaSelecionada.dataset.cliente = nomeCliente;
    mesaSelecionada.dataset.pedido = "Sem pedidos";

    mesaSelecionada.querySelector(".status-mesa").textContent = "Ativa";
    mesaSelecionada.querySelector(".cliente-mesa").textContent = nomeCliente;

    mesaSelecionada.querySelector(".btn-ativar").textContent =
        "Ver Mesa";

    const statusPedido = mesaSelecionada.querySelector(".status-pedido");

    statusPedido.textContent = "Sem pedidos";
    statusPedido.className = "status-pedido sem-pedido";
        
    modalAtivacao.close();

});

btnDesativar.addEventListener("click", () => {

    if (!mesaSelecionada) {
        return;
    }

    mesaSelecionada.dataset.status = "Disponível";
    mesaSelecionada.dataset.cliente = "";
    mesaSelecionada.dataset.pedido = "Sem pedidos";

    mesaSelecionada.classList.remove("ativa");
    mesaSelecionada.classList.add("disponivel");

    mesaSelecionada.querySelector(".status-mesa").textContent = "Disponível";
    mesaSelecionada.querySelector(".cliente-mesa").textContent = "Nenhum cliente";

    const statusPedido = mesaSelecionada.querySelector(".status-pedido");

    statusPedido.textContent = "Sem pedidos";
    statusPedido.className = "status-pedido sem-pedido";

    mesaSelecionada.querySelector(".btn-ativar").textContent = "Ativar Mesa";

    modalMesa.close();

});

document.querySelectorAll(".mesa-card").forEach((mesa) => {

    mesa.addEventListener("click", (event) => {

        if (event.target.closest("button")) {
            return;
        }

        const numeroMesa = mesa.dataset.mesa;
        const statusMesa = mesa.dataset.status || "Disponível";
        const cliente = mesa.dataset.cliente || "Nenhum";

        detalheTitulo.textContent = `Mesa ${numeroMesa}`;
        detalheStatus.textContent = `Status: ${statusMesa}`;
        detalheCliente.textContent = `Cliente: ${cliente}`;

        modalMesa.showModal();

    });

});

btnFecharDetalhes.addEventListener("click", () => {

    modalMesa.close();

});