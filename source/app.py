from flask import Flask, request, render_template, jsonify, json
from flask_cors import CORS

import os 

ROOT = "//content/drive/MyDrive/Apresentações/Game/source/"
TEMPLATE = ROOT + "/templates/"
STATIC = ROOT + "/static/"
DATA = ROOT + "/data_folder/"

app = Flask(__name__, 
            template_folder=TEMPLATE, 
            static_folder=STATIC)
CORS(app)

@app.route('/')
def index():
    print("Carregando pagina principal", flush=True)

    dados = ""
    with open("public_url.txt", "r") as f:
        dados = f.readlines()[0]

    return render_template('index.html', ngrok_url = dados)

@app.route('/game')
def game():
    dados = ""
    with open("public_url.txt", "r") as f:
        dados = f.readlines()[0]

    print("Carregando pagina do game", flush=True)
    return render_template('game.html', ngrok_url = dados)


@app.route('/game_data', methods=['GET'])
def game_data():
    player_data_list = [f for f in os.listdir(DATA) if os.path.isfile(os.path.join(DATA, f))]

    game_data = {}

    for fname in player_data_list:
        with open(f'./data_folder/{fname}') as f:
            dados = f.readlines()[0]

        game_data[fname.split(".")[0]] = json.loads(dados)

    return jsonify(game_data)

@app.route('/player_data', methods=['POST'])
def player_data():
    
    print("Recebendo dados do jogador", flush=True)

    msg_body = json.loads(request.data)

    player_data_list = [f for f in os.listdir(DATA) if os.path.isfile(os.path.join(DATA, f))]
    
    # Criando arquivo com as lógicas de movimento
    if len(player_data_list) < 25:
        for i in range(1,26):
            if f"player{i}.json" not in player_data_list:
                with open(f"{DATA}/player{i}.json", "w") as outfile:
                    outfile.write(json.dumps(msg_body))
                
                print(f"Player{i} criado.", flush=True)
                break
    else:  
        print("Número máximo de jogadores excedido", flush=True)
        return jsonify({"player":"-----", "avatar": "X"})

    avatars = ["chocobo", "deadpool", "goku", "vaultboy",
                "link2", "mario", "megaman", "totoro",
                "yoda", "yoshi", "sonic", "link",
                "red", "fox", "penguim", "soldier",
                "cat", "knight", "nyanCat", "ghost",
                "wizard", "inu", "kid", "kid2", "kid3"]

    # Salvar dados em um arquivo para leitura posterior
    # print(msg_body, flush=True)

    return jsonify({"player":f"{i}", "avatar": avatars[i-1]})



if __name__ == "__main__":
    app.run()
