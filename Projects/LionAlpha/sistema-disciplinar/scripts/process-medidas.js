const fs = require('fs');

// Dados CSV das medidas disciplinares
const csvMedidas = `Código (Matrícula),Nome completo,turma,data,especificação,observação,tipo de medida,nr medida
2459453,ALESSON LEITE SOARES DOS SANTOS,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,110
1789186,ALIFFER DOUGLAS PEREIRA DOS SANTOS,8A,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,49
1789186,ALIFFER DOUGLAS PEREIRA DOS SANTOS,8A,06/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,90
1789186,ALIFFER DOUGLAS PEREIRA DOS SANTOS,8A,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,97
2346559,ANA BEATRIZ FERNANDES REIS,7A,04/08/2025,Item 21 - Sentar-se no chão,Sentada no chão,Fato Observado Negativo,59
2455939,ANA CLARA DE SOUZA,7A,04/08/2025,Item 21 - Sentar-se no chão,Sentada no chão,Fato Observado Negativo,60
2230586,ANA CLARA GONÇALVES PEREIRA,7B,12/08/2025,3 - Cabelo fora do padrão estabelecido,"Cabelo fora do padrão, recusa de arrumar o mesmo",Fato Observado Negativo,10
2551247,ANA JULIA VENTURA SILVA,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,111
1968026,ANA LUIZA RIBEIRO DA SILVA,9B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,63
1962289,ANDRE LUCAS PEREIRA MIRANDA DE MELO,8A,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,146
2623898,ANDRIL VALMIR ALMEIDA DE MACEDO,6B,30/07/2025,35 - Deixar de Zelar pela apresentação Individual,Aluno fez gestos obscenos em sala,Fato Observado Negativo,2
2623898,ANDRIL VALMIR ALMEIDA DE MACEDO,6B,04/08/2025,47 - Portar-se de maneira inconveniente,Aluno estava bagunçando em sala,Fato Observado Negativo,4
1976485,ANTÔNIO MANOEL CAETANO PEREIRA,9B,30/07/2025,Item 18 - Perturbar o estudo,conversa em sala,Fato Observado Negativo,32
1976485,ANTÔNIO MANOEL CAETANO PEREIRA,9B,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,46
2252892,ANTÔNIO MIGUEL DE FREITAS OLIVEIRA,7B,07/08/2025,47 - Portar-se de maneira inconveniente,Aluno estava bagunçando em sala,Fato Observado Negativo,8
2369452,CARLOS ALBERTO MIRANDA FUNKLER,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,19
2369452,CARLOS ALBERTO MIRANDA FUNKLER,7A,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,47
2369452,CARLOS ALBERTO MIRANDA FUNKLER,7A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,64
2369452,CARLOS ALBERTO MIRANDA FUNKLER,7A,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,134
2529809,CAROLINE DE SOUSA DOURADO,2A,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,147
2064462,CINTHIA MARA VENANCIO COSTA,8A,28/07/2025,Item 47 - Portar-se de maneira inconveniente,Disperso em sala,Fato Observado Negativo,16
2064462,CINTHIA MARA VENANCIO COSTA,8A,05/08/2025,Item 47 - Portar-se de maneira inconveniente,Deitada no chão,Fato Observado Negativo,76
2646472,CLARICE DA SILVA BRITO,7A,12/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,122
2367547,DANIEL OTAVIO RIBEIRO DO AMARAL,9B,30/07/2025,Item 3 - Cabelo fora do padrão estabelecido,mal comportamento,Fato Observado Negativo,35
2194656,DANILO ALVES DA SILVA,8A,05/08/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,78
2194656,DANILO ALVES DA SILVA,8A,11/08/2025,Item 18 - Perturbar o estudo,Conversa na sala,Fato Observado Negativo,109
1871578,DARLAM COSTA BARBOSA,9E,12/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,124
1871578,DARLAM COSTA BARBOSA,9E,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,139
2617428,DAVI CRUZ SOUZA,6B,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,27
2235078,DAVI DE LIMA TREVISAN ARAÚJO,6A,12/08/2025,4 - Chegar atrasado ,Atrasado,Fato Observado Negativo,11
2579395,DOUGLAS FELIPE DUARTE DOS SANTOS,9B,30/07/2025,Item 3 - Cabelo fora do padrão estabelecido,mal comportamento,Fato Observado Negativo,34
2579395,DOUGLAS FELIPE DUARTE DOS SANTOS,9B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,140
2198257,DUAN HISLÂNDER PEREIRA DA SILVA,1C,11/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,118
2129828,DYOGO MATHEUS GOMES SILVINO,7B,15/08/2025,4 - Chegar atrasado ,Atrasado,Fato Observado Negativo,13
1987147,EDUARDO GUILHERME DA SILVA,2A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,88
2624781,EDUARDO OLIVEIRA SANTOS,7B,29/07/2025,81 -  Praticar atos contrários ao culto e ao respeito aos símbolos nacionais,Durante o intervalo o akuno tentou derrubar a bandeira do Brasil,Fato Observado Negativo,1
2624781,EDUARDO OLIVEIRA SANTOS,7B,04/08/2025,84 - Envolver-se em rixa,Aluno estva brigando em sala,Fato Observado Negativo,5
2624781,EDUARDO OLIVEIRA SANTOS,7B,15/08/2025,4 - Chegar atrasado ,Atrasado,Fato Observado Negativo,14
2131345,EMANUEL MARTINS SANTOS,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,20
2131345,EMANUEL MARTINS SANTOS,7A,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,48
2131345,EMANUEL MARTINS SANTOS,7A,04/08/2025,Item 3 - Cabelo fora do padrão estabelecido,,Fato Observado Negativo,55
2131345,EMANUEL MARTINS SANTOS,7A,04/08/2025,35 - Deixar de Zelar pela apresentação Individual,Risco na sobrancelha,Fato Observado Negativo,58
2131345,EMANUEL MARTINS SANTOS,7A,12/08/2025,Item 18 - Perturbar o estudo,Short,Fato Observado Negativo,125
2131345,EMANUEL MARTINS SANTOS,7A,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,138
2610137,EMANUELLY TEIXEIRA NERES,8A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,66
2557498,ENZO GABRIEL OLIVEIRA COSTA,6A,13/08/2025,48 - Portar-se de maneira desrespeitosa,xingando o colega,Fato Observado Negativo,12
2110786,ERIVELTON PERIS DOS SANTOS,8A,05/08/2025,Item 84 - Envolver-se em rixa,Contato físico com outro aluno,Fato Observado Negativo,72
2034925,EVERSON JÚNIOR LIMA DE ARAÚJO,7A,23/07/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,15
2034925,EVERSON JÚNIOR LIMA DE ARAÚJO,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,21
2186745,GABRIEL BEZERRA PARREIRA PINHO,9E,31/07/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,não acatou ordem do monitor,Fato Observado Negativo,41
2186745,GABRIEL BEZERRA PARREIRA PINHO,9E,06/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,91
2186745,GABRIEL BEZERRA PARREIRA PINHO,9E,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,107
2617384,GABRIEL DA SILVA BALDRIGUE,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,22
2524988,GABRIEL HENRIQUE COUTINHO BERTONCELLO,2A,29/07/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,29
2243078,GABRIEL REBOUÇAS DE ANDRADE,9A,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,100
2286098,GABRIEL VINICIUS FRANÇA SILVA,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,79
2286098,GABRIEL VINICIUS FRANÇA SILVA,1B,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,116
2286098,GABRIEL VINICIUS FRANÇA SILVA,1B,12/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,126
2618571,GEOVANNA RODRIGUES CARVALHO,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,23
2618571,GEOVANNA RODRIGUES CARVALHO,7A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,65
1898737,GUSTAVO RODRIGUES DA SILVA,8B,06/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,93
1898737,GUSTAVO RODRIGUES DA SILVA,8B,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,99
1856819,HALLISON GUSTAVO CAMPANHA DA MOTA,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,80
1856819,HALLISON GUSTAVO CAMPANHA DA MOTA,1B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,136
2628972,HELOISA VITÓRIA ALMEIDA NUNES,9A,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,149
1912727,IASMIM BONFIM DOS SANTOS,2A,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,120
2419945,ISA EMANUELLY DA SILVA FREITAS,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,112
2407823,ISAAC GABRIEL ULISSES DA CONCEIÇÃO,9B,30/07/2025,Item 48 - Portar-se de maneira desrespeitosa,retrucou a professora,Fato Observado Negativo,39
2407823,ISAAC GABRIEL ULISSES DA CONCEIÇÃO,9B,31/07/2025,Item 48 - Portar-se de maneira desrespeitosa,retrucou a professora,Fato Observado Negativo,42
2407823,ISAAC GABRIEL ULISSES DA CONCEIÇÃO,9B,01/08/2025,Item 2 - Barba ou Bigode sem fazer ,,Fato Observado Negativo,43
2407823,ISAAC GABRIEL ULISSES DA CONCEIÇÃO,9B,01/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,45
2407823,ISAAC GABRIEL ULISSES DA CONCEIÇÃO,9B,04/08/2025,Item 2 - Barba ou Bigode sem fazer ,,Fato Observado Negativo,54
2139205,ISABELLA OLIVEIRA NEVES,7A,04/08/2025,Item 21 - Sentar-se no chão,Sentada no chão,Fato Observado Negativo,61
2403559,ISADORA FERNANDA GERONIMO PEREIRA,9A,07/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,95
2403559,ISADORA FERNANDA GERONIMO PEREIRA,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,113
2379490,ITALO MATEUS PEREIRA DE PAULA,9B,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,102
2463639,JACIARA MARIA DA SILVA,8B,28/07/2025,Item 5 - Comparecer a EECM sem material ,Não trouxe material,Fato Observado Negativo,17
2177475,JAIR MARIANO JARDIM DA SILVA,1C,05/08/2025,Item 2 - Barba ou Bigode sem fazer ,,Fato Observado Negativo,85
2177475,JAIR MARIANO JARDIM DA SILVA,1C,11/08/2025,Item 2 - Barba ou Bigode sem fazer ,,Fato Observado Negativo,119
2363704,JAMILLY BEATRIZ UMBURANA DA SILVA,9A,07/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,96
2480162,JOÃO VITOR NUNES DA SILVA RODRIGUES,9E,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,52
2480162,JOÃO VITOR NUNES DA SILVA RODRIGUES,9E,06/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,92
2480162,JOÃO VITOR NUNES DA SILVA RODRIGUES,9E,14/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,145
2051045,JOSÉ ANTÔNIO DOS SANTOS,7B,07/08/2025,47 - Portar-se de maneira inconveniente,Aluno estava bagunçando em sala,Fato Observado Negativo,7
2477287,JOSE RAYAN FERNANDES GOUVEIA,8B,01/08/2025,Item 84 - Envolver-se em rixa,Chutando o colega,Fato Observado Negativo,44
2367808,JULIA VALENTINA BRAGA TRENTIN,9B,30/07/2025,Item 18 - Perturbar o estudo,conversa em sala,Fato Observado Negativo,33
1896932,KEMILLY LORRAYNE GONCALVES CANGUCU,1C,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,86
2381157,KESSILYN LOPES DUARTE,9B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,141
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,06/08/2025,Item 47 - Portar-se de maneira inconveniente,Ouvindo música na sala,Fato Observado Negativo,94
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,114
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,13/08/2025,Item 3 - Cabelo fora do padrão estabelecido,Legging e cabelo slto,Fato Observado Negativo,142
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,04/08/2025,Item 3 - Cabelo fora do padrão estabelecido,,Fato Observado Negativo,62
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,87
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,12/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,127
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,135
2145572,KHALIL MAY MAGALHAES,7A,04/08/2025,Item 47 - Portar-se de maneira inconveniente,Rindo do colega que estava sendo punido,Fato Observado Negativo,56
2460688,LAYLA VITÓRIA BATISTA MENEZES,8B,28/07/2025,Item 5 - Comparecer a EECM sem material ,Não trouxe material,Fato Observado Negativo,18
2052634,LOANY COSTA SANTANA,9E,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,53
2616150,LUCAS BUCHARD CAMARGO,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,81
2616150,LUCAS BUCHARD CAMARGO,1B,13/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,144
2050646,LUCAS OLIVEIRA COIMBRA,8A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não respeita professor,Fato Observado Negativo,28
2217875,LUIZ FERNANDO LONGHINI,6B,07/08/2025,47 - Portar-se de maneira inconveniente,Aluno deitado no pátio e gritando,Fato Observado Negativo,9
2195750,LUIZ GABRIEL BRANDÃO OLIVEIRA,8A,05/08/2025,Item 84 - Envolver-se em rixa,Contato físico com outro aluno,Fato Observado Negativo,73
2522261,LUIZ HENRIQUE SANTANA DE SOUZA DE OLIVEIRA,7A,04/08/2025,Item 47 - Portar-se de maneira inconveniente,Rindo do colega que estava sendo punido,Fato Observado Negativo,57
2522261,LUIZ HENRIQUE SANTANA DE SOUZA DE OLIVEIRA,7A,05/08/2025,Item 2 - Barba ou Bigode sem fazer ,,Fato Observado Negativo,71
2616759,LUIZ MIGUEL MONTEIRO DOS SANTOS,9A,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,101
1912887,MAILANE DA SILVA CARVALHO,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,82
1912887,MAILANE DA SILVA CARVALHO,1B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,137
1912887,MAILANE DA SILVA CARVALHO,1B,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,148
2311364,MARCOS ANTONIO OLIVEIRA LIMA,9B,05/08/2025,Item 18 - Perturbar o estudo,bagunça em sala,Fato Observado Negativo,70
2367889,MARCOS HENRIK DA SILVA ALMEIDA,9B,30/07/2025,Item 18 - Perturbar o estudo,bagunça em sala,Fato Observado Negativo,31
2367889,MARCOS HENRIK DA SILVA ALMEIDA,9B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,129
2052627,MARIA CAROLINE COSTA SANTANA,8A,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,50
2459363,MARIA GABRIELA ULISSES DA CONCEIÇAO,8B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,128
2047460,MARIA LUIZA LUCAS FAUSTINO,8B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,68
2492774,MAURICIO NETO WESCHENFELDER DA SILVA,1B,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,117
1789322,NATHAN DA SILVA XIMENES PEREIRA,1B,13/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,143
2551250,PAULA GEOVANA VENTURA SILVA,9A,11/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não fez tarefa,Fato Observado Negativo,115
2053801,PEDRO JOSÉ DOS SANTOS LOPES,8A,04/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,51
2053801,PEDRO JOSÉ DOS SANTOS LOPES,8A,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,106
243827,PEDRO MAURÍCIO,8B,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,151
2525055,PÉROLA PRIMO PIRES,2A,29/07/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,30
2525055,PÉROLA PRIMO PIRES,2A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,89
2037471,PIETRA GARCIA DELAIX,8A,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,67
2037471,PIETRA GARCIA DELAIX,8A,05/08/2025,Item 47 - Portar-se de maneira inconveniente,Deitada no chão,Fato Observado Negativo,77
2037471,PIETRA GARCIA DELAIX,8A,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,98
2171288,QUÉZIA DOS SANTOS BARCELOS,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não Respeita professor,Fato Observado Negativo,24
2089574,REINIVAL ROCHA INACIO DE MORAES FILHO,8A,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,105
2171993,RHIAN GABRIEL ARTUSO GOMES,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não Respeita professor,Fato Observado Negativo,25
2171993,RHIAN GABRIEL ARTUSO GOMES,7A,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,133
2171993,RHIAN GABRIEL ARTUSO GOMES,7A,15/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,150
2309708,RHUAN RIKELMI ALVES BRITO,8B,05/08/2025,Item 47 - Portar-se de maneira inconveniente,Correndo no pátio,Fato Observado Negativo,74
2381432,VICENTE PEREIRA RIBEIRO,9B,30/07/2025,Item 3 - Cabelo fora do padrão estabelecido,mal comportamento,Fato Observado Negativo,36
2301179,VICTOR GABRIEL SANTOS SILVA,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,83
2301179,VICTOR GABRIEL SANTOS SILVA,1B,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,103
2412750,VICTOR HUGO MARQUES DAS NEVES,9E,30/07/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,não fez tarefa,Fato Observado Negativo,37
2412750,VICTOR HUGO MARQUES DAS NEVES,9E,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,69
2412750,VICTOR HUGO MARQUES DAS NEVES,9E,05/08/2025,Item 47 - Portar-se de maneira inconveniente,Correndo no pátio,Fato Observado Negativo,75
2186011,VINICIUS EDUARDO DA SILVA RODRIGUES,7A,29/07/2025,Item 48 - Portar-se de maneira desrespeitosa,Não Respeita professor,Fato Observado Negativo,26
2301179,VICTOR GABRIEL SANTOS SILVA,1B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,130
2005553,VITORIA GABRIELA DOS SANTOS,2A,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,121
2234300,VITÓRIA VIANA MARQUES,6B,31/07/2025,48 - Portar-se de maneira desrespeitosa,Aluna estava com risadinha e deboche da professora,Fato Observado Negativo,3
2371462,WASHINGTON SALES BENTO (PNE),9E,30/07/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,não fez tarefa,Fato Observado Negativo,38
2371462,WASHINGTON SALES BENTO (PNE),9E,11/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,108
2617344,YAN JÓRYS DA SILVA SANTOS,9A,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,131
2457718,YASMIM PINHEIRO MORAIS,8A,12/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,123
2575508,YOHHAM CARNEIRO CARVALHO,1B,05/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,84
2575508,YOHHAM CARNEIRO CARVALHO,1B,08/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,104
2575508,YOHHAM CARNEIRO CARVALHO,1B,13/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,132
2632119,YOSBEL PÉREZ NUNEZ,1C,30/07/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,40
2338382,YSABELLA YASMIN MAGRI SILVA,7B,05/08/2025,14 - debruçar-se sore a carteira e dormir durante o horário das aulas ou instruções,Dormindo em sala,Fato Observado Negativo,6
2194656,DANILO ALVES DA SILVA,8A,19/08/2025,Item 1- Apresentar-se com o uniforme diferente do estabelecido pelo regulamento do uniforme,calça verde,Fato Observado Negativo,138
2186011,VINICIUS EDUARDO DA SILVA RODRIGUES,7A,19/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,139
2131345,EMANUEL MARTINS SANTOS,7A,19/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,140
2171993,RHIAN GABRIEL ARTUSO GOMES,7A,19/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,141
2176443,CARLOS EDUARDO SOUZA SILVA,7A,19/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,142
2617350,ESTELA RIBEIRO DA SILVA MARTINS,7A,19/08/2025,Item 18 - Perturbar o estudo,,Fato Observado Negativo,143
1978994,VICTOR GABRIEL BENTO RODRIGUES,1B,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,144
2459363,MARIA GABRIELA ULISSES DA CONCEIÇAO,8B,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,145
2616150,LUCAS BUCHARD CAMARGO,1B,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,146
1967013,KETLYN VITÓRIA SANTOS DE JESUS,9A,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,147
2392323,MICHELLY CASTRO DE SOUZA,9A,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,148
1987147,EDUARDO GUILHERME DA SILVA,2A,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,149
1784903,RUAN GABRIEL VIEIRA ANDRADE,1C,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,150
2614738,KEVER CALSING SANTOS,1C,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,151
2587256,MARIA EDUARDA SILVA SANTOS,1C,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,152
1746589,BRUNO VIEIRA DE MELO,1C,19/08/2025,Item 4 - Chegar atrasado ,,Fato Observado Negativo,153
1976485,ANTÔNIO MANOEL CAETANO PEREIRA,9B,01/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,2
2367808,JULIA VALENTINA BRAGA TRENTIN,9B,01/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,3
2131345,EMANUEL MARTINS SANTOS,7A,04/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,4
2034166,RAFAEL DIAS FÉLIX,8A,04/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,5
2480162,JOÃO VITOR NUNES DA SILVA RODRIGUES,9E,04/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,6
2397494,KEVILIN JACIANE GOMES DOS SANTOS,9B,05/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,7
1976485,ANTÔNIO MANOEL CAETANO PEREIRA,9B,06/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,8
1871578,DARLAM COSTA BARBOSA,9E,07/08/2025,Item 84 - Envolver-se em rixa,Briga/Rixa,Advertência,9
2186745,GABRIEL BEZERRA PARREIRA PINHO,9E,07/08/2025,Item 84 - Envolver-se em rixa,Briga/Rixa,Advertência,10
2004666,RAFAEL SILVA RODRIGUES FELICIO,9E,07/08/2025,Item 84 - Envolver-se em rixa,Briga/Rixa,Advertência,11
1898737,GUSTAVO RODRIGUES DA SILVA,8B,08/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,12
2632119,YOSBEL PÉREZ NUNEZ,1C,12/08/2025,"Item 73 - Fazer uso, portar ou distribuir produtos tóxicos",vaper,Advertência,13
2584624,YAGO MOREIRA DE OLIVEIRA,1B,11/08/2025,Item 48 - Portar-se de maneira desrespeitosa,Deboche com o inspetor,Advertência,14
2034925,EVERSON JÚNIOR LIMA DE ARAÚJO,7A,12/08/2025,Item 47 - Portar-se de maneira inconveniente,Indisciplina na sala,Advertência,15
2316137,LARISSA MOURA ARAUJO,1B,13/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,16
1871578,DARLAM COSTA BARBOSA,9E,13/08/2025,Item 34 - Deixar de cumprir tarefas atribuídas pela Direção,Não entrega de documento,Advertência,17
2214219,GIOVANA AMORIM HOTHOVOLPHO,2A,14/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,18
2034166,RAFAEL DIAS FÉLIX,8A,14/08/2025,Item 84 - Envolver-se em rixa,Briga/Rixa,Advertência,19
2529809,CAROLINE DE SOUSA DOURADO,2A,19/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,20
2547955,EMANUELLY MOREIRA BARROS,2A,19/08/2025,"Item 73 - Fazer uso, portar ou distribuir produtos tóxicos",Material Proibido,Advertência,21
2492774,MAURICIO NETO WESCHENFELDER DA SILVA,1B,20/08/2025,Item 61 - Utilizar telefone celular,Celular,Advertência,22`;

function processarMedidas() {
    console.log('🔄 Processando medidas disciplinares...');
    
    const linhas = csvMedidas.trim().split('\n');
    const medidas = {};
    let contador = 1;
    
    // Pular cabeçalho
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha) continue;
        
        // Parsear CSV (cuidado com vírgulas dentro das aspas)
        const colunas = linha.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || linha.split(',');
        
        if (colunas.length >= 8) {
            const codigo = colunas[0]?.replace(/"/g, '').trim();
            const nome = colunas[1]?.replace(/"/g, '').trim();
            const turma = colunas[2]?.replace(/"/g, '').trim();
            const dataStr = colunas[3]?.replace(/"/g, '').trim();
            const especificacao = colunas[4]?.replace(/"/g, '').trim();
            const observacao = colunas[5]?.replace(/"/g, '').trim();
            const tipoMedida = colunas[6]?.replace(/"/g, '').trim();
            const nrMedida = colunas[7]?.replace(/"/g, '').trim();
            
            // Converter data brasileira para ISO
            let dataISO = new Date().toISOString();
            if (dataStr && dataStr.includes('/')) {
                const [dia, mes, ano] = dataStr.split('/');
                const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                if (!isNaN(dataObj.getTime())) {
                    dataISO = dataObj.toISOString();
                }
            }
            
            const id = `medida_${String(contador).padStart(3, '0')}`;
            
            medidas[id] = {
                id: id,
                codigo_aluno: codigo,
                nome_aluno: nome,
                turma: turma,
                data: dataISO,
                especificacao: especificacao,
                observacao: observacao || 'Sem observações',
                tipo_medida: tipoMedida,
                nr_medida: nrMedida,
                criadoEm: new Date().toISOString()
            };
            
            contador++;
        }
    }
    
    console.log(`✅ Processadas ${Object.keys(medidas).length} medidas disciplinares`);
    return medidas;
}

// Carregar DB atual
const dbAtual = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

// Processar medidas
const medidasProcessadas = processarMedidas();

// Atualizar DB
dbAtual.medidas_disciplinares = medidasProcessadas;
dbAtual.metadata.ultimo_backup = new Date().toISOString();
dbAtual.metadata.total_medidas = Object.keys(medidasProcessadas).length;

// Salvar
fs.writeFileSync('data/db.json', JSON.stringify(dbAtual, null, 2));

// Relatório
const estatisticas = {};
const tiposMedidas = {};

Object.values(medidasProcessadas).forEach(medida => {
    // Por turma
    const turma = medida.turma || 'Sem turma';
    estatisticas[turma] = (estatisticas[turma] || 0) + 1;
    
    // Por tipo
    const tipo = medida.tipo_medida || 'Sem tipo';
    tiposMedidas[tipo] = (tiposMedidas[tipo] || 0) + 1;
});

console.log('\n📊 RELATÓRIO DE MEDIDAS DISCIPLINARES');
console.log('=====================================');
console.log(`📋 Total de medidas: ${Object.keys(medidasProcessadas).length}`);
console.log(`👥 Total de alunos: ${dbAtual.metadata.total_registros}`);

console.log('\n📈 Por turma:');
Object.entries(estatisticas)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([turma, total]) => {
        console.log(`  ${turma}: ${total} medidas`);
    });

console.log('\n📊 Por tipo de medida:');
Object.entries(tiposMedidas)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([tipo, total]) => {
        console.log(`  ${tipo}: ${total} registros`);
    });

console.log('\n✅ Database atualizada com sucesso!');