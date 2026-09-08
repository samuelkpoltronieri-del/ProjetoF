// =====================================================================
// FUNÇÕES DE NAVEGAÇÃO (SPA) E SENHA — executadas primeiro
// Como este <script> está no final do <body>, o DOM já está pronto
// quando ele é carregado, então chamamos as funções diretamente
// (sem esperar por "DOMContentLoaded", que já teria disparado antes).
// =====================================================================

inicializarNavegacao();
inicializarSenha();

/**
 * Controla a alternância entre as abas "Sobre o Projeto" e "Dashboard Ao Vivo",
 * sem recarregar a página (comportamento de Single Page Application).
 */
function inicializarNavegacao() {
  const botoesNav = document.querySelectorAll(".nav-btn");
  const secoes = document.querySelectorAll(".tab-content");

  botoesNav.forEach((botao) => {
    botao.addEventListener("click", () => {
      const alvo = botao.getAttribute("data-tab");

      // Atualiza o botão ativo
      botoesNav.forEach((b) => b.classList.remove("active"));
      botao.classList.add("active");

      // Mostra apenas a seção correspondente
      secoes.forEach((secao) => {
        secao.classList.toggle("active", secao.id === alvo);
      });

      // Guarda a última aba visitada, para restaurar ao recarregar a página
      localStorage.setItem("iot_ultima_aba", alvo);
    });
  });

  // Restaura a última aba visitada (se existir e não for a padrão)
  const ultimaAba = localStorage.getItem("iot_ultima_aba");
  if (ultimaAba && ultimaAba !== "sobre") {
    const botaoAlvo = document.querySelector(`.nav-btn[data-tab="${ultimaAba}"]`);
    if (botaoAlvo) botaoAlvo.click();
  }
}

/**
 * Gerencia o salvamento e a recuperação, via localStorage, da senha
 * fornecida pelo professor para a equipe.
 */
const CHAVE_SENHA = "iot_senha_equipe";

function inicializarSenha() {
  const inputSenha = document.getElementById("senha-input");
  const btnSalvar = document.getElementById("btn-salvar-senha");
  const btnMostrar = document.getElementById("btn-mostrar-senha");
  const statusSenha = document.getElementById("senha-status");

  // Se já existir uma senha salva, avisa o usuário (sem exibi-la de imediato)
  const senhaSalva = localStorage.getItem(CHAVE_SENHA);
  if (senhaSalva) {
    statusSenha.innerText = "✅ Senha já salva neste navegador.";
    statusSenha.style.color = "#1e8e3e";
  }

  btnSalvar.addEventListener("click", () => {
    const valor = inputSenha.value.trim();

    if (valor === "") {
      statusSenha.innerText = "⚠️ Digite uma senha antes de salvar.";
      statusSenha.style.color = "#d93025";
      return;
    }

    localStorage.setItem(CHAVE_SENHA, valor);
    statusSenha.innerText = "✅ Senha salva com sucesso neste navegador.";
    statusSenha.style.color = "#1e8e3e";
    inputSenha.value = "";
  });

  btnMostrar.addEventListener("click", () => {
    const senha = localStorage.getItem(CHAVE_SENHA);

    if (!senha) {
      statusSenha.innerText = "⚠️ Nenhuma senha salva ainda.";
      statusSenha.style.color = "#d93025";
      return;
    }

    statusSenha.innerText = "🔑 Senha salva: " + senha;
    statusSenha.style.color = "#0d6efd";
  });
}

// =====================================================================
// CÓDIGO MQTT ORIGINAL — NÃO MODIFICADO NA LÓGICA
// (envolvido em try/catch apenas para que uma eventual falha de conexão
// ou biblioteca não impeça o restante da página, como a navegação, de
// funcionar normalmente)
// =====================================================================

try {
  // --- CONFIGURAÇÕES DE CONEXÃO ---
  // Substitua pelo IP do notebook onde o Mosquitto está rodando
  const MQTT_HOST = "10.136.42.24";
  const MQTT_PORT = 9001; // Porta WebSocket configurada no mosquitto.conf

  // Tópicos exatos publicados pelo ESP32
  const TOPIC_TEMP = "aulas/grupo3/temperatura";
  const TOPIC_HUM  = "aulas/grupo3/umidade";
  const TOPIC_AIR  = "aulas/grupo3/gas";

  // Criação do ID de Cliente único para o navegador
  const clientID = "WebDash_" + Math.random().toString(16).substr(2, 8);

  // Inicializa o cliente MQTT Paho
  const client = new Paho.MQTT.Client(MQTT_HOST, Number(MQTT_PORT), clientID);

  // Callbacks do cliente
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  // Conecta ao broker
  client.connect({
    onSuccess: onConnect,
    onFailure: onFailure
  });

  function onConnect() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "Status: Conectado ao Mosquitto";
    statusDiv.className = "status connected";

    // Assina os tópicos após conectar com sucesso
    client.subscribe(TOPIC_TEMP);
    client.subscribe(TOPIC_HUM);
    client.subscribe(TOPIC_AIR);
  }

  function onFailure(responseObject) {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "Status: Falha na conexão (" + responseObject.errorMessage + ")";
    statusDiv.className = "status disconnected";
  }

  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      const statusDiv = document.getElementById("status");
      statusDiv.innerText = "Status: Conexão Perdida";
      statusDiv.className = "status disconnected";
    }
  }

  // Processa as mensagens recebidas nos tópicos assinados
  function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;

    if (topic === TOPIC_TEMP) {
      document.getElementById("temp").innerText = payload;
    } else if (topic === TOPIC_HUM) {
      document.getElementById("hum").innerText = payload;
    } else if (topic === TOPIC_AIR) {
      document.getElementById("air").innerText = payload;
    }
  }
} catch (erro) {
  console.error("Erro ao iniciar o cliente MQTT:", erro);
  const statusDiv = document.getElementById("status");
  if (statusDiv) {
    statusDiv.innerText = "Status: Erro ao carregar cliente MQTT (veja o console)";
    statusDiv.className = "status disconnected";
  }
}