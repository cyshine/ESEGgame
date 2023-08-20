
//Envia dados do jogador para o backend e recebe ql o
// avatar determinado para ele
function send_data() {
    playerAvatar = document.getElementById('playerAvatar')

    if (playerAvatar == null) {
        nome = document.getElementById('nome_aluno').value

        if (nome == "") {
            alert("Preencha o seu nome.")
            return 0
        }

        div_info = document.getElementById('div_info')
        current_url = document.getElementById('current_url').innerHTML

        url = current_url + "/player_data"
        
        payload = {}

        payload["nome"] = nome

        actions_list = ["move_cima", "move_baixo", "move_esquerda", "move_direita",
            "ataca", "defende", "busca_premio", "busca_inimigo"]

        estados = ["explora", "batalha"]


        // Calculando a o peso proporcional de cada ação programada
        for (let j = 0; j < estados.length; j++) {
            payload[estados[j]] = []
            soma = 0
            for (let i = 0; i < actions_list.length; i++) {
                soma += parseInt(document.getElementById(estados[j]+'_'+actions_list[i]).value)
            }

            for (let i = 0; i < actions_list.length; i++) {
                weight = document.getElementById(estados[j]+'_'+actions_list[i]).value/soma
                payload[estados[j]].push({'action': actions_list[i], 'weight':weight})
            }
        }



        fetch(url, {
            method: "POST",
            cache: "no-cache",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        })
        .then((res) => res.json())
        .then((response) => {
            div_info.innerHTML = "<p>Player: " + response.player + "</p>"

            var img = document.createElement("img");
            img.id = "playerAvatar"
            img.src = "static/images/"+ response.avatar  +".png";
            div_info.appendChild(img);    
        })
        .catch((error) => {
            console.log("Error: ", error);
        
        });
    }
    else {
        alert("Jogador já possui avatar.")
    }
    

}