//http://dados.gov.br/dataset/24934-quantidade-de-sedes-de-instituicoes-autorizadas-a-funcionar-do-segmento-bancario-na-regia
var source_1 = JSON.parse('[{"data":"01/01/2005","valor":"111"},{"data":"01/01/2006","valor":"117"},{"data":"01/01/2007","valor":"117"},{"data":"01/01/2008","valor":"122"},{"data":"01/01/2009","valor":"124"},{"data":"01/01/2010","valor":"123"},{"data":"01/01/2011","valor":"126"},{"data":"01/01/2012","valor":"127"},{"data":"01/01/2013","valor":"125"},{"data":"01/01/2014","valor":"121"},{"data":"01/01/2015","valor":"122"},{"data":"01/01/2016","valor":"124"}]');
//http://dados.gov.br/dataset/25051-quantidade-de-postos-de-atendimento-pa-do-segmento-bancario-por-10-mil-adultos-na-regiao-
var source_2 = JSON.parse('[{"data":"01/01/2005","valor":"0.67"},{"data":"01/01/2006","valor":"0.64"},{"data":"01/01/2007","valor":"0.64"},{"data":"01/01/2008","valor":"0.67"},{"data":"01/01/2009","valor":"0.66"},{"data":"01/01/2010","valor":"0.65"},{"data":"01/01/2011","valor":"0.63"},{"data":"01/01/2012","valor":"0.72"},{"data":"01/01/2013","valor":"0.74"},{"data":"01/01/2014","valor":"0.72"},{"data":"01/01/2015","valor":"0.72"},{"data":"01/01/2016","valor":"0.71"}]');

//Adapto os elementos da base 1
source_1.forEach(element => {
    element.year = parseInt(element.data.substring(6));
    element.qtd_sedes = parseFloat(element.valor);
});

//Adapto os elementos da base 2
source_2.forEach(element => {
    element.year = parseInt(element.data.substring(6));
    element.qtd_postos = parseFloat(element.valor);
});

//Filtro entre elementos com ano par/ímpar
source_1 = {
    pares: source_1.filter(element => element.year % 2 === 0),
    impares: source_1.filter(element => element.year % 2 !== 0),
}

source_2 = {
    pares: source_2.filter(element => element.year % 2 === 0),
    impares: source_2.filter(element => element.year % 2 !== 0),
}

var source = {pares: [], impares: []};

/*
    RESTRIÇÕES
        - As bases devem ter uma quantidade par de anos
        - As bases devem ter a mesma quantidade de elementos
        - As bases devem considerar os mesmos anos
*/

let colors = [
    'FFFF0000',
    'FF00FF00',
    'FF0000FF',
    'FFFF0000',
    'FF00FF00',
    'FF0000FF'
]

for(let i = 0; i < source_1.pares.length; i++) {
    source.pares.push({
        color: colors[i],
        data: {
            qtd_sedes: source_1.pares[i].qtd_sedes,
            qtd_postos: source_2.pares[i].qtd_postos
        }
    });
}

for(let i = 0; i < source_1.impares.length; i++) {
    source.impares.push({
        color: colors[i],
        data: {
            qtd_sedes: source_1.impares[i].qtd_sedes,
            qtd_postos: source_2.impares[i].qtd_postos
        }
    });
}

delete source_1;
delete source_2;

//Calculando Porcentagens
let total = source.pares.length + source.impares.length;
let pares = source.pares.length;
let impares = source.impares.length;

pares = ((pares * 100) / total);
impares = ((impares * 100) / total)/100;

//Criando Sources
let dataset_pares = source.pares.map((element, index) => {
    return {
        position: index + 1,
        molecules: [element]
    }
});

let dataset_impares = source.impares.map((element, index) => {
    return {
        position: index + 1,
        molecules: [element]
    }
});

//Objeto Final
var data = {
    period: {
        starts: '',
        ends: ''
    },
    query: '',
    window: {
        size: 16,
        amount: 7,
        mode: 'GLOBAL'
    },
    sector: {
        label: 'project'
    },
    sectors: [
        {
            angle: pares,
            label: 'Anos Pares',
            windows: dataset_pares
        },
        {
            angle: impares,
            label: 'Ímpares',
            windows: dataset_impares
        }
    ]
};

console.log(JSON.stringify(data));