btn_load = document.getElementById('btn_load')
url = "http://af8f-34-90-0-6.ngrok.io/carregar_estado"

btn_load.onclick = function(){
    
    nome_aluno = document.getElementById('nome_aluno')
    dados_load = document.getElementById('dados_load')
    
    let submissionData = {
        nome_aluno: nome_aluno.value,
    };
      
    fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(submissionData),
  })
    .then((res) => res.json())
    .then((response) => {
        
        dados_load.innerHTML = response.dados
        console.log(response.dados)
    
    })
    .catch((error) => {
      console.log("Error: ", error);
      
    });
}

