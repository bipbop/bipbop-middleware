# Middleware BIPBOP para Operações XML

Esta aplicação permite o consumo da BIPBOP de forma que apenas uma única requisição gere múltiplas respostas. Nós não recomendamos o uso a não ser que você saiba exatamente o que está fazendo, os prós e os contras. É preferível o gerenciamento de concorrência na camada do software.


## Multithreading

**Atenção** - Recomendamos a utilização consciente, as respostas podem enfrentar _TIMEOUT_ caso o número de threads e requisições seja desregulado.   
**Atenção** - Para aplicações de UX/UI recomendamos que seja utilizado threads na interface do cliente para que o mesmo veja o progresso das requisições.

### Exemplo de Requisição ###
```
curl -H "Content-Type: application/json" -X POST -d @sample-request.json http://localhost/
```

### Formato da Requisição ###
```
{
	"threads": 5, /* Quantidade de Threads no Middleware */
	"apiKey": "6057b71263c21e4ada266c9d4d4da613", /* Chave de API do Cliente */
	"requests" : [
		{
			"form": { /* Conteúdo da Chamada */
				"q": "SELECT FROM 'BIPBOPJS'.'CPFCNPJ'",
				"documento" : "17299408000109"
			},
			"id" : "CPFCNPJ-17299408000109" /* Identificador da Chamada */
		},
		{
			"form": {
				"q": "SELECT FROM 'BIPBOPJS'.'CPFCNPJ'",
				"documento" : "17279091000149"
			},
			"id" : "CPFCNPJ-17279091000149"
		}
	]
}
```

### Formato da Resposta ###
```
<?xml version="1.0" encoding="UTF-8"?>
<middleware elapsed-time-ms="801">
    <!-- TAG BPQL contendo ID da chamada -->
    <BPQL id="CPFCNPJ-17279091000149">
        <header resourceUse="0">
            <date-time>01/11/2017 11:16:24</date-time>
            <execution-time>0</execution-time>
            <query database="BIPBOPJS" table="CPFCNPJ">SELECT FROM &apos;BIPBOPJS&apos;.&apos;CPFCNPJ&apos;</query>
        </header>
        <body>
            <nome>MANDATUM WEBSERVICE E COBRANCAS - EIRELI - ME</nome>
        </body>
    </BPQL>
    <BPQL id="CPFCNPJ-17299408000109">
        <header resourceUse="0">
            <date-time>01/11/2017 11:16:24</date-time>
            <execution-time>0</execution-time>
            <query database="BIPBOPJS" table="CPFCNPJ">SELECT FROM &apos;BIPBOPJS&apos;.&apos;CPFCNPJ&apos;</query>
        </header>
        <body>
            <nome>BIPBOP SOFTWARE E SERVICOS LTDA</nome>
        </body>
    </BPQL>
</middleware>
```
