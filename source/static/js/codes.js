
var positions = null
var players_info = null
var stateMemory = null
var nextActionMemory = null
var avatares = null

acoes = ["move_cima","move_baixo","move_esquerda","move_direita","ataca","defende","busca_premio","busca_inimigo"]

document.onkeydown = checkKey;

function checkKey(event) {
    switch (event.key) {
        case 'n':
            newGame();
            break;
        case 'c':
            nextRound();
            break;
        case 'e':
            executeRound();
            break;
    }
}

async function newGame() {
    stateMemory = {}
    nextActionMemory = {}
    avatares = {}
    createBoard();
    tabela_usuarios = document.getElementsByClassName("tabela_usuarios")[0];
    tabela_usuarios.innerHTML = ""
    prize_position = placePrize();
    positions = { "prize": prize_position }

    players_info = await getPlayersInfo();
    createPlayers(positions, players_info);

}

async function getPlayersInfo() {

    current_url = document.getElementById('current_url').innerHTML
    url = current_url + "/game_data"

    response = await fetch(url, {
                    method: "GET",
                    cache: "no-cache",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                })

    return await response.json();

}

function placePrize() {
    randomCol = Math.floor(Math.random() * 16+1);
    randomRow = Math.floor(Math.random() * 7 + 1);

    base = document.getElementById("base"+randomCol+"-"+randomRow)
    
    prize = document.createElement("div");
    prize.className = "box player";
    prize.id = "prize" 

    var img = document.createElement("img");

    img.src = "static/images/prize.png";

    prize.appendChild(img);

    base.appendChild(prize);
        
    return [randomCol,randomRow]
    
}

function createBoard(){
    tabuleiro = document.getElementsByClassName("tabuleiro")[0];

    //Limpando tabuleiro
    while (tabuleiro.firstChild) {
        tabuleiro.removeChild(tabuleiro.firstChild);
    }

    //Criando as bases
    for (i = 0; i < 16; i++){
        for (j = 0; j < 8; j++) {
            newBox = document.createElement("div");
            newBox.className = "box";
            newBox.id = "base" + String(i + 1) + "-" + String(j + 1);
            newBox.style = "grid-column:"+ String(i + 1) + ";grid-row:" + String(j + 1) +";"
            tabuleiro.appendChild(newBox);
        }
    }
}



function createPlayers(positions, players_info) {

    // Ler total de players de acordo com o enviado de 'cadastros'
    totalPlayers = Object.keys(players_info).length

    // Requisitar do servidor a lógica para cada player
    
    avatars = ["chocobo", "deadpool", "goku", "vaultboy",
                "link2", "mario", "megaman", "totoro",
                "yoda", "yoshi", "sonic", "link",
                "red", "fox", "penguim", "soldier",
                "cat", "knight", "nyanCat", "ghost",
                "wizard", "inu", "kid", "kid2", "kid3"]

    for (i = 1; i < totalPlayers + 1; i++){
        randomCol = Math.floor(Math.random() * 16+1);
        randomRow = Math.floor(Math.random() * 7+1);

        // Impedindo dois players na mesma posição
        value = Object.keys(positions).find(key => String(positions[key]) === String([randomCol,randomRow]));

        console.log(value)
        while (value != undefined) {
            console.log("--")
            randomCol = Math.floor(Math.random() * 16+1);
            randomRow = Math.floor(Math.random() * 7 + 1);
            
            value = Object.keys(positions).find(key => positions[key] === [randomCol,randomRow]);
        }
        


        base = document.getElementById("base"+randomCol+"-"+randomRow)
        
        newPlayer = document.createElement("div");
        newPlayer.className = "box player";
        newPlayer.id = "player" + String(i);
        // newPlayer.innerHTML = "<p>P" + String(i) + "</p>"


        var img = document.createElement("img");

        img.src = "static/images/"+ avatars[i-1] +".png";

        newPlayer.appendChild(img);

        positions["player" + String(i)] = [ randomCol,randomRow]

        stateMemory["player" + String(i)] = "explora"

        avatares["player" + String(i)] = avatars[i-1]

        base.appendChild(newPlayer);

    }
}

function weighted_random(options) {
    var i;

    var weights = [options[0].weight];

    for (i = 1; i < options.length; i++)
        weights[i] = options[i].weight + weights[i - 1];
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return options[i].action;
}

function nextRound() {

    tabela_usuarios = document.getElementsByClassName("tabela_usuarios")[0];

    newTable = "<table id='usuarios'><thead><tr><th>Avatar</th><th>Nome</th><th>Estado</th><th>Próxima ação</th></tr></thead><tbody>"
    // Sorteia próxima ação de todos os jogadores
    Object.entries(players_info).forEach(([player, info]) => {  
        if (stateMemory[player] != "Derrotado") {

            currentState = stateMemory[player]
            nextAction = weighted_random(info[currentState])
            nextActionMemory[player] = nextAction

            // Atualizar as tabelas de visualização dos jogadores
            avatar_image = `<img src='static/images/${avatares[player]}.png' >`
            newTable += `<tr><td> ${avatar_image} </td><td> ${info.nome} </td><td id='state-${player}'>${currentState}</td><td id='next-action-${player}'>${nextAction}</td></tr>`

        }
        else {
            avatar_image = `<img src='static/images/${avatares[player]}.png' >`
            skull_image = `<img src='static/images/skull.png' >`
            newTable += `<tr><td> ${avatar_image} </td><td> ${info.nome} </td><td id='state-${player}'>Derrotado</td><td id='next-action-${player}'>${skull_image}</td></tr>`

        }
        
    })

    newTable += "</tbody></table>"

    tabela_usuarios.innerHTML = newTable
}

function executeRound() {
    // Executa ações calculadas
    // Ordem das ações:
    // Defesa --> Ataque --> Movimento --> Busca premio/inimigo
    // A ação de defesa é verificada na função de ataque, anulando-o

    Object.entries(players_info).forEach(([player, state]) => {
        if (stateMemory[player] != "Derrotado") {
            checkAtaque(player)
            checkMove(player)
            checkBuscas(player)
        }

    })

    // Avalia se algum jogador venceu
    // Isto ocorre quando o jogador está na mesma posição do premio
    Object.entries(players_info).forEach(([player, state]) => {
        if (stateMemory[player] != "Derrotado") {
            checkVictory(player)
        }

    })
    
}

function checkBuscas(player) {
    
    var currCol = parseInt(positions[player][0])
    var currRow = parseInt(positions[player][1])
    currentBase = document.getElementById("base"+currCol+"-"+currRow)
    
    switch (nextActionMemory[player]) {
        case 'busca_premio':

            console.log(players_info[player][stateMemory[player]])
        
            taxa_aumento = 1.5
            movimento = ""
            if (Math.abs(currCol - positions['prize'][0]) < Math.abs(currRow - positions['prize'][1])) {
                // Direção horizontal é mais próxima

                if (currCol - positions['prize'][0] > 0){
                    // Jogador está à direita do premio, deve andar para esquerda
                    movimento = "move_esquerda"
                }
                else {
                    // Jogador está à esquerda do premio, deve andar para direita
                    movimento = "move_direita"
                }
            }
            else {
                // Direção vertical é a mais próxima
                if (currRow - positions['prize'][1] > 0){
                    // Jogador está abaixo do premio, deve andar para cima
                    movimento = "move_cima"
                }
                else {
                    // Jogador está acima do premio, deve andar para baixo
                    movimento = "move_baixo"
                }
            }

            // Atualiza probabilidades
            var index = players_info[player][stateMemory[player]].findIndex(function(item, i){
                                return item.action === movimento
                                });
                                
            valor_correcao = players_info[player][stateMemory[player]][index].weight

            players_info[player][stateMemory[player]][index].weight *= taxa_aumento
            valor_correcao = (players_info[player][stateMemory[player]][index].weight - valor_correcao)/7

            for (i = 0; i < acoes.length ; i++) {
                if (acoes[i] != movimento){
                    players_info[player][stateMemory[player]][i].weight -= valor_correcao
                }
            }

            // console.log(players_info[player][stateMemory[player]])

            break

        case 'busca_inimigo':

            // Retorna a posição do primeiro inimigo encontrado na área do
            // entorno do player ou false caso não haja inimigo
            const inimigo = buscaInimigo(player)
            
            if (inimigo["posicao"] != false) {
                console.log(player +": Inimigo em: " + inimigo["posicao"])
                stateMemory[player] = "batalha"
            }
            
    }



}

function buscaInimigo(player) {
    var currCol = parseInt(positions[player][0])
    var currRow = parseInt(positions[player][1])
    currentBase = document.getElementById("base" + currCol + "-" + currRow)
    var all_positions = []
    var playerIndex = -1
    var keys = []
    
    for (var key in positions) {
        if ((key != player) && (key != "prize")) {
            all_positions.push(String(positions[key]))
            keys.push(key)
        }
        
    }

    var result = {}
    result["posicao"] = false
    result["player"] = false
                
    cols = [currCol - 1, currCol, currCol + 1]
    rows = [currRow - 1,currRow,currRow + 1]
    
    for (i = 0; i < cols.length; i++) {
        for (j = 0; j < rows.length; j++) {
            // console.log(String([cols[i], rows[j]]))
            str_indexes = String([cols[i], rows[j]])
            if (all_positions.includes(str_indexes)) {

                playerIndex = all_positions.indexOf(str_indexes)

                result["posicao"] = [cols[i], rows[j]]
                result["player"] = keys[playerIndex]

                return result
                
            }
        }

    }

    return result
    
    
}

function checkVictory(player) {
    // Pode haver mais de um vencedor
    if (nextActionMemory[player] == "Vitória") {
        player_estado = document.getElementById(`state-${player}`)
        player_acao = document.getElementById(`next-action-${player}`)

        player_estado.innerHTML = "Vitória"
        player_acao.innerHTML = "<img src='static/images/prize.png' >"
    }

    
}

// Retorna true se existe jogador na posição destino de player, caso contrário
// retorna false
function playerInDestination(position) {
    var result = false
    Object.entries(players_info).forEach(([player, state]) => {
        // console.log(String(positions[player]), String(position))
        if (String(positions[player]) == String(position)) {
            result = true
        }

    })

    return result
    
}

function checkMove(player) {
    // Verifica se não há barreiras na direção do movimento ou
    // se ele vai levar para fora do tabuleiro

    var currCol = parseInt(positions[player][0])
    var currRow = parseInt(positions[player][1])
    currentBase = document.getElementById("base"+currCol+"-"+currRow)
    
    switch (nextActionMemory[player]) {
        case 'move_cima':
            if ( (currRow - 1 > 0) && (!playerInDestination([currCol, currRow - 1]) ) ) {
                positions[player] = [currCol, currRow - 1]
                nomebase = "base" + String(currCol) + "-" + String(currRow - 1)
                newBase = document.getElementById(nomebase)
                if (currentBase.childNodes.length < 2) {
                    newBase.appendChild(currentBase.childNodes[0]);
                }
                else {
                    newBase.appendChild(currentBase.childNodes[1]);
                }
                    
                console.log("Jogador movido para base base" + String(currCol) + "-" + String(currRow - 1))
            }
             else {
                console.log("Ação do jogador "+player+ " não pode ser executada.")
            }

            break;
        case 'move_baixo':
            if ( (currRow + 1 < 8) && (!playerInDestination([currCol, currRow + 1]) ) ) {
                positions[player] = [currCol, currRow + 1]
                newBase = document.getElementById("base" + String(currCol) + "-" + String(currRow + 1))
                newBase.appendChild(currentBase.childNodes[0]);
                console.log("Jogador movido para base base" + String(currCol) + "-" + String(currRow + 1))
            }
             else {
                console.log("Ação do jogador "+player+ " não pode ser executada.")
            }

            break;
        case 'move_esquerda':
            if ( (currCol - 1 > 0) && (!playerInDestination([currCol - 1, currRow]) ) ) {
                positions[player] = [currCol - 1, currRow]
                newBase = document.getElementById("base" + String(currCol - 1) + "-" + String(currRow))
                newBase.appendChild(currentBase.childNodes[0]);
                console.log("Jogador movido para base base" + String(currCol - 1) + "-" + String(currRow))
            }
             else {
                console.log("Ação do jogador "+player+ " não pode ser executada.")
            }

            break;
        case 'move_direita':
             if ( (currCol + 1 < 17) && (!playerInDestination([currCol + 1, currRow]) ) ) {
                positions[player] = [currCol + 1, currRow]
                newBase = document.getElementById("base" + String(currCol + 1) + "-" + String(currRow))
                newBase.appendChild(currentBase.childNodes[0]);
                console.log("Jogador movido para base base" + String(currCol + 1) + "-" + String(currRow))
            }
             else {
                console.log("Ação do jogador "+player+ " não pode ser executada.")
            }

            break;
        case 'busca_premio':
        
            taxa_aumento = 1.2
            movimento = ""

            if (Math.abs(currCol - positions['prize'][0]) > Math.abs(currRow - positions['prize'][1])) {
                // Direção horizontal é mais próxima

                if (currCol - positions['prize'][0] > 0){
                    // Jogador está à direita do premio, deve andar para esquerda
                    movimento = "move_esquerda"
                }
                else {
                    // Jogador está à esquerda do premio, deve andar para direita
                    movimento = "move_direita"
                }
            }
            else {
                // Direção vertical é a mais próxima
                if (currRow - positions['prize'][1] > 0){
                    // Jogador está abaixo do premio, deve andar para cima
                    movimento = "move_cima"
                }
                else {
                    // Jogador está acima do premio, deve andar para baixo
                    movimento = "move_baixo"
                }
            }

            // Atualiza probabilidades
            var index = players_info[player][stateMemory[player]].findIndex(function(item, i){
                                return item.action === movimento
                                });
                                
            valor_correcao = players_info[player][stateMemory[player]][index].weight

            players_info[player][stateMemory[player]][index].weight *= taxa_aumento
            valor_correcao = (players_info[player][stateMemory[player]][index].weight - valor_correcao)/7

            for (i = 0; i < acoes.length ; i++) {
                if (acoes[i] != movimento){
                    players_info[player][stateMemory[player]][i].weight -= valor_correcao
                }
            }

            console.log(players_info[player][stateMemory[player]])
            break
            
    }

    if (String(positions[player]) == String(positions["prize"])){
        nextActionMemory[player] = "Vitória"
    }

}

function checkAtaque(player) {
    // Ataca o primeiro inimigo enontrado
    // Verifica se ataque acertou o player inimigo
    // Em caso positivo, remover este player apenas se o 
    // próximo comando dele não foi o de defesa

    switch (nextActionMemory[player]) {
        case 'ataca':
            var inimigo = buscaInimigo(player)

            if (inimigo["posicao"] != false) {
                // Defesa ocorre antes do ataque
                console.log(nextActionMemory[inimigo["player"]])

                if (nextActionMemory[inimigo["player"]] == "defende") {
                    console.log(inimigo["player"] + " defendeu o ataque de " + player)
                }
                else {
                    console.log(inimigo["player"] + " foi derrotado por " + player)
                    
                    nextActionMemory[inimigo["player"]] = "Derrotado"
                    stateMemory[inimigo["player"]] = "Derrotado"
                    document.getElementById(inimigo["player"]).remove()
                    delete positions[inimigo["player"]]

                    player_estado = document.getElementById(`state-${inimigo['player']}`)
                    player_acao = document.getElementById(`next-action-${inimigo['player']}`)

                    player_estado.innerHTML = "Derrotado"
                    player_acao.innerHTML = "<img src='static/images/skull.png' >"

                    // sai do estado de batalha se não há mais inimigos na área
                    inimigo = buscaInimigo(player)

                    if (inimigo["posicao"] == false) {
                        stateMemory[player] = "explora"
                    }

                    // Não está funcionando
                    if (positions.length == 1) {
                        nextActionMemory[player] = "Vitória"
                    }
                    
                }

            }
            else {
                stateMemory[player] = "explora"
                console.log("Nada para atacar!")
            }
    }

}


